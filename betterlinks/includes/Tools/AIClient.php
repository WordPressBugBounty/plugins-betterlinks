<?php
/**
 * Shared AI client for BetterLinks.
 *
 * Provides a single, reusable wrapper around the OpenAI and Google Gemini chat
 * APIs. Credentials and model configuration are read from the existing AI
 * settings ( option `betterlinks_ai_api_keys` for keys and the main
 * `betterlinks_links` option for provider / model / token limits ) so every AI
 * feature ( Bulk Link Generator, AI Link Assistant, etc. ) shares one engine and one
 * place to configure keys.
 *
 * @package BetterLinks\Tools
 * @since   2.4.11
 */

namespace BetterLinks\Tools;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class AIClient {

	const OPENAI_ENDPOINT = 'https://api.openai.com/v1/chat/completions';
	const GEMINI_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/';

	/**
	 * Number of attempts (initial + retries) for transient provider errors.
	 */
	const MAX_ATTEMPTS = 3;

	/**
	 * HTTP status codes worth retrying (rate limit / temporary overload).
	 *
	 * @var int[]
	 */
	private static $retryable = array( 429, 500, 502, 503, 504 );

	/**
	 * Resolve the active AI configuration.
	 *
	 * @return array{provider:string,model:string,token_limit:int,api_key:string}
	 */
	public static function get_config() {
		$api_keys = get_option( BETTERLINKS_AI_API_KEYS_OPTION_NAME, array() );
		if ( is_string( $api_keys ) ) {
			$api_keys = json_decode( $api_keys, true );
		}
		if ( ! is_array( $api_keys ) ) {
			$api_keys = array();
		}

		$settings = get_option( BETTERLINKS_LINKS_OPTION_NAME, array() );
		if ( is_string( $settings ) ) {
			$settings = json_decode( $settings, true );
		}
		if ( ! is_array( $settings ) ) {
			$settings = array();
		}

		$provider = isset( $settings['ai_provider'] ) ? $settings['ai_provider'] : 'openai';

		if ( 'gemini' === $provider ) {
			$model       = isset( $settings['gemini_model'] ) ? $settings['gemini_model'] : 'gemini-2.5-flash';
			$token_limit = isset( $settings['gemini_token_limit'] ) ? intval( $settings['gemini_token_limit'] ) : 3000;
			$api_key     = isset( $api_keys['gemini_api_key'] ) ? $api_keys['gemini_api_key'] : '';
		} else {
			$provider    = 'openai';
			$model       = isset( $settings['openai_model'] ) ? $settings['openai_model'] : 'gpt-4o-mini';
			$token_limit = isset( $settings['openai_token_limit'] ) ? intval( $settings['openai_token_limit'] ) : 3000;
			$api_key     = isset( $api_keys['openai_api_key'] ) ? $api_keys['openai_api_key'] : '';
		}

		return array(
			'provider'    => $provider,
			'model'       => $model,
			'token_limit' => $token_limit > 0 ? $token_limit : 3000,
			'api_key'     => is_string( $api_key ) ? trim( $api_key ) : '',
		);
	}

	/**
	 * Whether the active provider has a usable API key.
	 *
	 * @return bool
	 */
	public static function is_configured() {
		$config = self::get_config();
		return ! empty( $config['api_key'] );
	}

	/**
	 * Send a chat request to the active provider.
	 *
	 * @param string $system_prompt System / instruction message.
	 * @param string $user_prompt   User message.
	 * @param array  $args          Optional overrides: temperature, max_tokens, json (bool).
	 *
	 * @return string|\WP_Error Raw text response on success.
	 */
	public static function chat( $system_prompt, $user_prompt, $args = array() ) {
		$config = self::get_config();

		if ( empty( $config['api_key'] ) ) {
			return new \WP_Error(
				'betterlinks_ai_not_configured',
				__( 'No AI API key is configured. Add an OpenAI or Gemini key in BetterLinks → Settings → AI.', 'betterlinks' )
			);
		}

		$defaults = array(
			'temperature' => 0.3,
			'max_tokens'  => $config['token_limit'],
			'json'        => false,
		);
		$args     = wp_parse_args( $args, $defaults );

		if ( 'gemini' === $config['provider'] ) {
			return self::request_gemini( $config, $system_prompt, $user_prompt, $args );
		}

		return self::request_openai( $config, $system_prompt, $user_prompt, $args );
	}

	/**
	 * Convenience helper that requests a JSON object and decodes it.
	 *
	 * @param string $system_prompt System / instruction message.
	 * @param string $user_prompt   User message.
	 * @param array  $args          Optional overrides.
	 *
	 * @return array|\WP_Error Decoded associative array on success.
	 */
	public static function chat_json( $system_prompt, $user_prompt, $args = array() ) {
		$args['json'] = true;
		$response     = self::chat( $system_prompt, $user_prompt, $args );

		if ( is_wp_error( $response ) ) {
			return $response;
		}

		$decoded = self::extract_json( $response );

		if ( null === $decoded ) {
			return new \WP_Error(
				'betterlinks_ai_invalid_json',
				__( 'The AI returned an unexpected response. Please try again.', 'betterlinks' ),
				array( 'raw' => $response )
			);
		}

		return $decoded;
	}

	/**
	 * Whether the given OpenAI model requires `max_completion_tokens` instead of
	 * the legacy `max_tokens` (and rejects a custom temperature). True for the
	 * GPT-5 family and other reasoning ("o"-series) models.
	 *
	 * @param string $model Model id.
	 *
	 * @return bool
	 */
	private static function model_uses_completion_tokens( $model ) {
		$model = strtolower( (string) $model );

		return 0 === strpos( $model, 'gpt-5' )
			|| 0 === strpos( $model, 'o1' )
			|| 0 === strpos( $model, 'o3' )
			|| 0 === strpos( $model, 'o4' );
	}

	/**
	 * Call the OpenAI chat completions API.
	 *
	 * @param array  $config        Resolved config.
	 * @param string $system_prompt System message.
	 * @param string $user_prompt   User message.
	 * @param array  $args          Request args.
	 *
	 * @return string|\WP_Error
	 */
	private static function request_openai( $config, $system_prompt, $user_prompt, $args ) {
		$body = array(
			'model'    => $config['model'],
			'messages' => array(
				array(
					'role'    => 'system',
					'content' => $system_prompt,
				),
				array(
					'role'    => 'user',
					'content' => $user_prompt,
				),
			),
		);

		// GPT-5 (and newer reasoning) models replace `max_tokens` with
		// `max_completion_tokens` and only accept the default temperature (1),
		// rejecting a custom one. Older models keep the classic parameters.
		if ( self::model_uses_completion_tokens( $config['model'] ) ) {
			$body['max_completion_tokens'] = intval( $args['max_tokens'] );
		} else {
			$body['temperature'] = floatval( $args['temperature'] );
			$body['max_tokens']  = intval( $args['max_tokens'] );
		}

		if ( ! empty( $args['json'] ) ) {
			$body['response_format'] = array( 'type' => 'json_object' );
		}

		// Reasoning models (GPT-5 / o-series) "think" before emitting output, so they
		// routinely need well over the 45s used for classic chat models. Give them a
		// longer window; keep it filterable for slow hosts / large token limits.
		$timeout = self::model_uses_completion_tokens( $config['model'] ) ? 120 : 45;
		/**
		 * Filters the OpenAI request timeout (seconds).
		 *
		 * @param int    $timeout Timeout in seconds.
		 * @param string $model   Model id.
		 */
		$timeout = (int) apply_filters( 'betterlinks/ai/openai_timeout', $timeout, $config['model'] );

		$last_error = null;

		for ( $attempt = 1; $attempt <= self::MAX_ATTEMPTS; $attempt++ ) {
			$response = wp_remote_post(
				self::OPENAI_ENDPOINT,
				array(
					'timeout' => $timeout,
					'headers' => array(
						'Content-Type'  => 'application/json',
						'Authorization' => 'Bearer ' . $config['api_key'],
					),
					'body'    => wp_json_encode( $body ),
				)
			);

			if ( is_wp_error( $response ) ) {
				return $response;
			}

			$code = wp_remote_retrieve_response_code( $response );
			$data = json_decode( wp_remote_retrieve_body( $response ), true );

			if ( $code >= 200 && $code < 300 ) {
				if ( ! isset( $data['choices'][0]['message']['content'] ) ) {
					return new \WP_Error( 'betterlinks_ai_empty', __( 'OpenAI returned an empty response.', 'betterlinks' ) );
				}
				return (string) $data['choices'][0]['message']['content'];
			}

			$message    = isset( $data['error']['message'] ) ? $data['error']['message'] : __( 'OpenAI request failed.', 'betterlinks' );
			$last_error = new \WP_Error( 'betterlinks_ai_openai_error', $message, array( 'status' => $code ) );

			if ( ! in_array( (int) $code, self::$retryable, true ) || $attempt >= self::MAX_ATTEMPTS ) {
				break;
			}
			sleep( $attempt ); // simple linear backoff: 1s, 2s.
		}

		return $last_error;
	}

	/**
	 * Call the Google Gemini generateContent API.
	 *
	 * @param array  $config        Resolved config.
	 * @param string $system_prompt System message.
	 * @param string $user_prompt   User message.
	 * @param array  $args          Request args.
	 *
	 * @return string|\WP_Error
	 */
	private static function request_gemini( $config, $system_prompt, $user_prompt, $args ) {
		$endpoint = self::GEMINI_ENDPOINT . rawurlencode( $config['model'] ) . ':generateContent?key=' . rawurlencode( $config['api_key'] );

		$generation_config = array(
			'temperature'     => floatval( $args['temperature'] ),
			'maxOutputTokens' => intval( $args['max_tokens'] ),
		);

		if ( ! empty( $args['json'] ) ) {
			$generation_config['responseMimeType'] = 'application/json';
		}

		$body = array(
			'systemInstruction' => array(
				'parts' => array(
					array( 'text' => $system_prompt ),
				),
			),
			'contents'          => array(
				array(
					'role'  => 'user',
					'parts' => array(
						array( 'text' => $user_prompt ),
					),
				),
			),
			'generationConfig'  => $generation_config,
		);

		$last_error = null;

		for ( $attempt = 1; $attempt <= self::MAX_ATTEMPTS; $attempt++ ) {
			$response = wp_remote_post(
				$endpoint,
				array(
					'timeout' => 45,
					'headers' => array(
						'Content-Type' => 'application/json',
					),
					'body'    => wp_json_encode( $body ),
				)
			);

			if ( is_wp_error( $response ) ) {
				return $response;
			}

			$code = wp_remote_retrieve_response_code( $response );
			$data = json_decode( wp_remote_retrieve_body( $response ), true );

			if ( $code >= 200 && $code < 300 ) {
				if ( ! isset( $data['candidates'][0]['content']['parts'] ) || ! is_array( $data['candidates'][0]['content']['parts'] ) ) {
					return new \WP_Error( 'betterlinks_ai_empty', __( 'Gemini returned an empty response.', 'betterlinks' ) );
				}

				$text = '';
				foreach ( $data['candidates'][0]['content']['parts'] as $part ) {
					if ( isset( $part['text'] ) ) {
						$text .= $part['text'];
					}
				}
				return $text;
			}

			$message    = isset( $data['error']['message'] ) ? $data['error']['message'] : __( 'Gemini request failed.', 'betterlinks' );
			$last_error = new \WP_Error( 'betterlinks_ai_gemini_error', $message, array( 'status' => $code ) );

			if ( ! in_array( (int) $code, self::$retryable, true ) || $attempt >= self::MAX_ATTEMPTS ) {
				break;
			}
			sleep( $attempt ); // simple linear backoff: 1s, 2s.
		}

		return $last_error;
	}

	/**
	 * Best-effort extraction of a JSON object/array from a model response.
	 *
	 * Handles responses that wrap JSON in markdown code fences or surrounding
	 * prose.
	 *
	 * @param string $text Raw model output.
	 *
	 * @return array|null Decoded array, or null when no valid JSON was found.
	 */
	public static function extract_json( $text ) {
		$text = trim( (string) $text );

		if ( '' === $text ) {
			return null;
		}

		// Strip markdown code fences if present.
		if ( preg_match( '/```(?:json)?\s*(.+?)\s*```/is', $text, $matches ) ) {
			$text = trim( $matches[1] );
		}

		$decoded = json_decode( $text, true );
		if ( is_array( $decoded ) ) {
			return $decoded;
		}

		// Fall back to the first balanced JSON object/array in the string.
		$start = strpos( $text, '{' );
		$end   = strrpos( $text, '}' );
		if ( false !== $start && false !== $end && $end > $start ) {
			$decoded = json_decode( substr( $text, $start, $end - $start + 1 ), true );
			if ( is_array( $decoded ) ) {
				return $decoded;
			}
		}

		return null;
	}
}

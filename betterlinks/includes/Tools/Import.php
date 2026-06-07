<?php
namespace BetterLinks\Tools;
if ( ! defined( 'ABSPATH' ) ) { exit; }

class Import
{
    public function __construct()
    {
        add_action('admin_init', [$this, 'import_data']);
        add_action('wp_ajax_betterlinks/tools/get_import_info', [$this, 'get_import_info']);
    }
    public function import_data()
    {
        $can_access_settings = apply_filters("betterlinks/admin/" . BETTERLINKS_PLUGIN_SLUG . "-settings_menu_capability", 'manage_options');
        $nonce = isset($_GET['nonce']) ? sanitize_text_field( wp_unslash( $_GET['nonce'] ) ) : '';
        if( !wp_verify_nonce($nonce, 'betterlinks_admin_nonce') || !is_user_logged_in() || !current_user_can($can_access_settings)){
            return false;
        }
        $page = isset($_GET['page']) ? sanitize_text_field( wp_unslash( $_GET['page'] ) ) : '';
        $import = isset($_GET['import']) ? sanitize_text_field( wp_unslash( $_GET['import'] ) ) : false;
        if ($page === 'betterlinks-settings' && $import == true) {
            \BetterLinks\Helper::clear_query_cache();
            if (!empty($_FILES['upload_file']['tmp_name'])) {
                // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- $_FILES sanitization handled per-key below.
                $file_raw = $_FILES['upload_file'];
                $file = array(
                    'name'     => isset( $file_raw['name'] ) ? sanitize_file_name( $file_raw['name'] ) : '',
                    'tmp_name' => isset( $file_raw['tmp_name'] ) ? $file_raw['tmp_name'] : '',
                );
                $mode = isset( $_POST['mode'] ) ? sanitize_text_field( wp_unslash( $_POST['mode'] ) ) : '';
                if ('csv' === pathinfo($file['name'])[ 'extension' ]) {
                    // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_fopen -- reading PHP-managed temp upload; WP_Filesystem does not cover $_FILES tmp_name.
                    $fileContent = fopen($file['tmp_name'], "r");
                    if (!empty($fileContent)) {
                        $this->run_csv_importer($fileContent, $mode);
                    }
                }
            }
            do_action('betterlinks/admin/after_import_data');
        }
    }
    public function run_csv_importer($fileContent, $type = 'default')
    {
        // phpcs:disable WordPress.Security.NonceVerification.Missing -- caller import_data() verifies the nonce before invoking this private CSV runner.
        $results = '';
        $mode    = isset( $_POST['mode'] ) ? sanitize_text_field( wp_unslash( $_POST['mode'] ) ) : '';
        if ($type == 'default') {
            $BetterLinks = new  Migration\BLImportCSV();
            $results = $BetterLinks->start_importing($fileContent);
        } elseif ( $mode == 'prettylinks' ) {
            $PrettyLinks = new Migration\PTLImportCSV();
            $results = $PrettyLinks->start_importing($fileContent);
        } elseif ($type == 'thirstyaffiliates') {
            $ta_link_prefix = isset($_POST["ta_prefix"]) ? sanitize_text_field(wp_unslash( $_POST["ta_prefix"] )) : "";
            $ThirstyAffiliates = new Migration\TAImportCSV();
            $results = $ThirstyAffiliates->start_importing($fileContent, $ta_link_prefix);
        } elseif ($type == 'simple301redirects') {
            $migrator = new Migration\S30RImportCSV();
            $results = $migrator->start_importing($fileContent);
        }
        set_transient('betterlinks_import_info', json_encode($results), 60 * 60 * 5);
        // phpcs:enable WordPress.Security.NonceVerification.Missing
    }

    public function get_import_info()
    {
        check_ajax_referer('wp_rest', 'security');
        $results = json_encode([]);
        if (get_transient('betterlinks_import_info')) {
            \BetterLinks\Helper::clear_query_cache();
            \BetterLinks\Helper::create_cron_jobs_for_json_links();
            $results = get_transient('betterlinks_import_info');
            delete_transient('betterlinks_import_info');
        }
        wp_send_json_success($results);
        wp_die();
    }
}

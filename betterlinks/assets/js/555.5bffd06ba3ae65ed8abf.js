"use strict";(self.webpackChunkbetterlinks=self.webpackChunkbetterlinks||[]).push([[555],{84831:(e,t,n)=>{n.d(t,{A:()=>u});var r=n(51609),a=n.n(r),o=n(20053),s=["children","className","disabled","disabledClassName","focus","id","panelId","selected","selectedClassName","tabIndex","tabRef"];function l(){return l=Object.assign||function(e){for(var t=1;t<arguments.length;t++){var n=arguments[t];for(var r in n)Object.prototype.hasOwnProperty.call(n,r)&&(e[r]=n[r])}return e},l.apply(this,arguments)}function c(e,t){return c=Object.setPrototypeOf||function(e,t){return e.__proto__=t,e},c(e,t)}var i="react-tabs__tab",u=function(e){var t,n;function r(){return e.apply(this,arguments)||this}n=e,(t=r).prototype=Object.create(n.prototype),t.prototype.constructor=t,c(t,n);var i=r.prototype;return i.componentDidMount=function(){this.checkFocus()},i.componentDidUpdate=function(){this.checkFocus()},i.checkFocus=function(){var e=this.props,t=e.selected,n=e.focus;t&&n&&this.node.focus()},i.render=function(){var e,t=this,n=this.props,r=n.children,c=n.className,i=n.disabled,u=n.disabledClassName,d=(n.focus,n.id),p=n.panelId,f=n.selected,b=n.selectedClassName,h=n.tabIndex,v=n.tabRef,y=function(e,t){if(null==e)return{};var n,r,a={},o=Object.keys(e);for(r=0;r<o.length;r++)n=o[r],t.indexOf(n)>=0||(a[n]=e[n]);return a}(n,s);return a().createElement("li",l({},y,{className:(0,o.A)(c,(e={},e[b]=f,e[u]=i,e)),ref:function(e){t.node=e,v&&v(e)},role:"tab",id:d,"aria-selected":f?"true":"false","aria-disabled":i?"true":"false","aria-controls":p,tabIndex:h||(f?"0":null),"data-rttab":!0}),r)},r}(r.Component);u.defaultProps={className:i,disabledClassName:i+"--disabled",focus:!1,id:null,panelId:null,selected:!1,selectedClassName:i+"--selected"},u.propTypes={},u.tabsRole="Tab"},43687:(e,t,n)=>{n.d(t,{A:()=>i});var r=n(51609),a=n.n(r),o=n(20053),s=["children","className"];function l(){return l=Object.assign||function(e){for(var t=1;t<arguments.length;t++){var n=arguments[t];for(var r in n)Object.prototype.hasOwnProperty.call(n,r)&&(e[r]=n[r])}return e},l.apply(this,arguments)}function c(e,t){return c=Object.setPrototypeOf||function(e,t){return e.__proto__=t,e},c(e,t)}var i=function(e){var t,n;function r(){return e.apply(this,arguments)||this}return n=e,(t=r).prototype=Object.create(n.prototype),t.prototype.constructor=t,c(t,n),r.prototype.render=function(){var e=this.props,t=e.children,n=e.className,r=function(e,t){if(null==e)return{};var n,r,a={},o=Object.keys(e);for(r=0;r<o.length;r++)n=o[r],t.indexOf(n)>=0||(a[n]=e[n]);return a}(e,s);return a().createElement("ul",l({},r,{className:(0,o.A)(n),role:"tablist"}),t)},r}(r.Component);i.defaultProps={className:"react-tabs__tab-list"},i.propTypes={},i.tabsRole="TabList"},61529:(e,t,n)=>{n.d(t,{A:()=>u});var r=n(51609),a=n.n(r),o=n(20053),s=["children","className","forceRender","id","selected","selectedClassName","tabId"];function l(){return l=Object.assign||function(e){for(var t=1;t<arguments.length;t++){var n=arguments[t];for(var r in n)Object.prototype.hasOwnProperty.call(n,r)&&(e[r]=n[r])}return e},l.apply(this,arguments)}function c(e,t){return c=Object.setPrototypeOf||function(e,t){return e.__proto__=t,e},c(e,t)}var i="react-tabs__tab-panel",u=function(e){var t,n;function r(){return e.apply(this,arguments)||this}return n=e,(t=r).prototype=Object.create(n.prototype),t.prototype.constructor=t,c(t,n),r.prototype.render=function(){var e,t=this.props,n=t.children,r=t.className,c=t.forceRender,i=t.id,u=t.selected,d=t.selectedClassName,p=t.tabId,f=function(e,t){if(null==e)return{};var n,r,a={},o=Object.keys(e);for(r=0;r<o.length;r++)n=o[r],t.indexOf(n)>=0||(a[n]=e[n]);return a}(t,s);return a().createElement("div",l({},f,{className:(0,o.A)(r,(e={},e[d]=u,e)),role:"tabpanel",id:i,"aria-labelledby":p}),c||u?n:null)},r}(r.Component);u.defaultProps={className:i,forceRender:!1,selectedClassName:i+"--selected"},u.propTypes={},u.tabsRole="TabPanel"},30138:(e,t,n)=>{n.d(t,{A:()=>i});var r=n(51609),a=n.n(r),o=(n(99855),n(35639)),s=n(28058),l=["children","defaultIndex","defaultFocus"];function c(e,t){return c=Object.setPrototypeOf||function(e,t){return e.__proto__=t,e},c(e,t)}var i=function(e){var t,n;function r(t){var n;return(n=e.call(this,t)||this).handleSelected=function(e,t,r){var a=n.props.onSelect,o=n.state.mode;if("function"!=typeof a||!1!==a(e,t,r)){var s={focus:"keydown"===r.type};1===o&&(s.selectedIndex=e),n.setState(s)}},n.state=r.copyPropsToState(n.props,{},t.defaultFocus),n}return n=e,(t=r).prototype=Object.create(n.prototype),t.prototype.constructor=t,c(t,n),r.getDerivedStateFromProps=function(e,t){return r.copyPropsToState(e,t)},r.getModeFromProps=function(e){return null===e.selectedIndex?1:0},r.copyPropsToState=function(e,t,n){void 0===n&&(n=!1);var a={focus:n,mode:r.getModeFromProps(e)};if(1===a.mode){var o,l=Math.max(0,(0,s.i)(e.children)-1);o=null!=t.selectedIndex?Math.min(t.selectedIndex,l):e.defaultIndex||0,a.selectedIndex=o}return a},r.prototype.render=function(){var e=this.props,t=e.children,n=(e.defaultIndex,e.defaultFocus,function(e,t){if(null==e)return{};var n,r,a={},o=Object.keys(e);for(r=0;r<o.length;r++)n=o[r],t.indexOf(n)>=0||(a[n]=e[n]);return a}(e,l)),r=this.state,s=r.focus,c=r.selectedIndex;return n.focus=s,n.onSelect=this.handleSelected,null!=c&&(n.selectedIndex=c),a().createElement(o.A,n,t)},r}(r.Component);i.defaultProps={defaultFocus:!1,forceRenderTabPanel:!1,selectedIndex:null,defaultIndex:null,environment:null,disableUpDownKeys:!1},i.propTypes={},i.tabsRole="Tabs"},35639:(e,t,n)=>{n.d(t,{A:()=>y});var r,a=n(51609),o=n.n(a),s=n(20053),l=n(30710),c=(n(99855),n(28058)),i=n(24636),u=n(62088),d=["children","className","disabledTabClassName","domRef","focus","forceRenderTabPanel","onSelect","selectedIndex","selectedTabClassName","selectedTabPanelClassName","environment","disableUpDownKeys"];function p(){return p=Object.assign||function(e){for(var t=1;t<arguments.length;t++){var n=arguments[t];for(var r in n)Object.prototype.hasOwnProperty.call(n,r)&&(e[r]=n[r])}return e},p.apply(this,arguments)}function f(e,t){return f=Object.setPrototypeOf||function(e,t){return e.__proto__=t,e},f(e,t)}function b(e){return e&&"getAttribute"in e}function h(e){return b(e)&&e.getAttribute("data-rttab")}function v(e){return b(e)&&"true"===e.getAttribute("aria-disabled")}var y=function(e){var t,n;function b(){for(var t,n=arguments.length,r=new Array(n),a=0;a<n;a++)r[a]=arguments[a];return(t=e.call.apply(e,[this].concat(r))||this).tabNodes=[],t.handleKeyDown=function(e){var n=t.props,r=n.direction,a=n.disableUpDownKeys;if(t.isTabFromContainer(e.target)){var o=t.props.selectedIndex,s=!1,l=!1;32!==e.keyCode&&13!==e.keyCode||(s=!0,l=!1,t.handleClick(e)),37===e.keyCode||!a&&38===e.keyCode?(o="rtl"===r?t.getNextTab(o):t.getPrevTab(o),s=!0,l=!0):39===e.keyCode||!a&&40===e.keyCode?(o="rtl"===r?t.getPrevTab(o):t.getNextTab(o),s=!0,l=!0):35===e.keyCode?(o=t.getLastTab(),s=!0,l=!0):36===e.keyCode&&(o=t.getFirstTab(),s=!0,l=!0),s&&e.preventDefault(),l&&t.setSelected(o,e)}},t.handleClick=function(e){var n=e.target;do{if(t.isTabFromContainer(n)){if(v(n))return;var r=[].slice.call(n.parentNode.children).filter(h).indexOf(n);return void t.setSelected(r,e)}}while(null!=(n=n.parentNode))},t}n=e,(t=b).prototype=Object.create(n.prototype),t.prototype.constructor=t,f(t,n);var y=b.prototype;return y.setSelected=function(e,t){if(!(e<0||e>=this.getTabsCount())){var n=this.props;(0,n.onSelect)(e,n.selectedIndex,t)}},y.getNextTab=function(e){for(var t=this.getTabsCount(),n=e+1;n<t;n++)if(!v(this.getTab(n)))return n;for(var r=0;r<e;r++)if(!v(this.getTab(r)))return r;return e},y.getPrevTab=function(e){for(var t=e;t--;)if(!v(this.getTab(t)))return t;for(t=this.getTabsCount();t-- >e;)if(!v(this.getTab(t)))return t;return e},y.getFirstTab=function(){for(var e=this.getTabsCount(),t=0;t<e;t++)if(!v(this.getTab(t)))return t;return null},y.getLastTab=function(){for(var e=this.getTabsCount();e--;)if(!v(this.getTab(e)))return e;return null},y.getTabsCount=function(){var e=this.props.children;return(0,c.i)(e)},y.getPanelsCount=function(){var e=this.props.children;return(0,c.v)(e)},y.getTab=function(e){return this.tabNodes["tabs-"+e]},y.getChildren=function(){var e=this,t=0,n=this.props,s=n.children,c=n.disabledTabClassName,d=n.focus,p=n.forceRenderTabPanel,f=n.selectedIndex,b=n.selectedTabClassName,h=n.selectedTabPanelClassName,v=n.environment;this.tabIds=this.tabIds||[],this.panelIds=this.panelIds||[];for(var y=this.tabIds.length-this.getTabsCount();y++<0;)this.tabIds.push((0,l.A)()),this.panelIds.push((0,l.A)());return(0,i.B)(s,(function(n){var s=n;if((0,u.Uv)(n)){var l=0,y=!1;null==r&&function(e){var t=e||("undefined"!=typeof window?window:void 0);try{r=!(void 0===t||!t.document||!t.document.activeElement)}catch(e){r=!1}}(v),r&&(y=o().Children.toArray(n.props.children).filter(u.KG).some((function(t,n){var r=v||("undefined"!=typeof window?window:void 0);return r&&r.document.activeElement===e.getTab(n)}))),s=(0,a.cloneElement)(n,{children:(0,i.B)(n.props.children,(function(t){var n="tabs-"+l,r=f===l,o={tabRef:function(t){e.tabNodes[n]=t},id:e.tabIds[l],panelId:e.panelIds[l],selected:r,focus:r&&(d||y)};return b&&(o.selectedClassName=b),c&&(o.disabledClassName=c),l++,(0,a.cloneElement)(t,o)}))})}else if((0,u._V)(n)){var m={id:e.panelIds[t],tabId:e.tabIds[t],selected:f===t};p&&(m.forceRender=p),h&&(m.selectedClassName=h),t++,s=(0,a.cloneElement)(n,m)}return s}))},y.isTabFromContainer=function(e){if(!h(e))return!1;var t=e.parentElement;do{if(t===this.node)return!0;if(t.getAttribute("data-rttabs"))break;t=t.parentElement}while(t);return!1},y.render=function(){var e=this,t=this.props,n=(t.children,t.className),r=(t.disabledTabClassName,t.domRef),a=(t.focus,t.forceRenderTabPanel,t.onSelect,t.selectedIndex,t.selectedTabClassName,t.selectedTabPanelClassName,t.environment,t.disableUpDownKeys,function(e,t){if(null==e)return{};var n,r,a={},o=Object.keys(e);for(r=0;r<o.length;r++)n=o[r],t.indexOf(n)>=0||(a[n]=e[n]);return a}(t,d));return o().createElement("div",p({},a,{className:(0,s.A)(n),onClick:this.handleClick,onKeyDown:this.handleKeyDown,ref:function(t){e.node=t,r&&r(t)},"data-rttabs":!0}),this.getChildren())},b}(a.Component);y.defaultProps={className:"react-tabs",focus:!1},y.propTypes={}},24636:(e,t,n)=>{n.d(t,{B:()=>s,x:()=>l});var r=n(51609),a=n(62088);function o(){return o=Object.assign||function(e){for(var t=1;t<arguments.length;t++){var n=arguments[t];for(var r in n)Object.prototype.hasOwnProperty.call(n,r)&&(e[r]=n[r])}return e},o.apply(this,arguments)}function s(e,t){return r.Children.map(e,(function(e){return null===e?null:function(e){return(0,a.KG)(e)||(0,a.Uv)(e)||(0,a._V)(e)}(e)?t(e):e.props&&e.props.children&&"object"==typeof e.props.children?(0,r.cloneElement)(e,o({},e.props,{children:s(e.props.children,t)})):e}))}function l(e,t){return r.Children.forEach(e,(function(e){null!==e&&((0,a.KG)(e)||(0,a._V)(e)?t(e):e.props&&e.props.children&&"object"==typeof e.props.children&&((0,a.Uv)(e)&&t(e),l(e.props.children,t)))}))}},28058:(e,t,n)=>{n.d(t,{i:()=>o,v:()=>s});var r=n(24636),a=n(62088);function o(e){var t=0;return(0,r.x)(e,(function(e){(0,a.KG)(e)&&t++})),t}function s(e){var t=0;return(0,r.x)(e,(function(e){(0,a._V)(e)&&t++})),t}},62088:(e,t,n)=>{function r(e){return function(t){return!!t.type&&t.type.tabsRole===e}}n.d(t,{KG:()=>a,Uv:()=>o,_V:()=>s});var a=r("Tab"),o=r("TabList"),s=r("TabPanel")},99855:(e,t,n)=>{n(24636),n(62088)},30710:(e,t,n)=>{n.d(t,{A:()=>a});var r=0;function a(){return"react-tabs-"+r++}},19555:(e,t,n)=>{n.d(t,{Kp:()=>s.A,oz:()=>o.A,tU:()=>r.A,wb:()=>a.A});var r=n(30138),a=n(43687),o=n(84831),s=n(61529)}}]);
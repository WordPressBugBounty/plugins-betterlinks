"use strict";(globalThis.webpackChunkbetterlinks=globalThis.webpackChunkbetterlinks||[]).push([[499],{16560:(e,t,l)=>{l.d(t,{A:()=>L});var n=l(3453),a=l(80045),s=l(51609),r=l.n(s),c=l(49924),o=l(68238),i=l(27723),u=l(19735),m=l(74086),d=l(67154),b=l(58766),p=l(7400),v=l(20312),k=l.n(v),_=l(46005),y=[{label:(0,i.__)("Delete All","betterlinks"),value:!1},{label:(0,i.__)("Delete clicks older than 30 days","betterlinks"),value:30},{label:(0,i.__)("Delete clicks older than 90 days","betterlinks"),value:90}];const E=(0,c.Ng)((function(){return{}}),(function(e){return{fetchCustomClicksData:(0,o.zH)(b.lC,e),dispatch_new_links_data:(0,o.zH)(p.jT,e)}}))((function(e){var t=e.fetchCustomClicksData,l=e.dispatch_new_links_data,a=(e.propsForAnalytics||{}).customDateFilter,r=(0,s.useState)(0),c=(0,n.A)(r,2),o=c[0],i=c[1],m=(0,s.useState)(!1),d=(0,n.A)(m,2),b=d[0],p=d[1],v=(0,s.useState)(0),E=(0,n.A)(v,2),f=E[0],h=E[1],g=(0,s.useState)("reset_modal_step_1"),N=(0,n.A)(g,2),w=N[0],C=N[1],L=(0,s.useState)(y[0]),A=(0,n.A)(L,2),F=A[0],S=A[1];(0,s.useEffect)((function(){var e,t;return b?null===(e=document)||void 0===e||null===(e=e.body)||void 0===e||null===(e=e.classList)||void 0===e||e.add("betterlinks-delete-clicks-modal-popup-opened"):null===(t=document)||void 0===t||null===(t=t.body)||void 0===t||null===(t=t.classList)||void 0===t||t.remove("betterlinks-delete-clicks-modal-popup-opened"),function(){var e;null===(e=document)||void 0===e||null===(e=e.body)||void 0===e||null===(e=e.classList)||void 0===e||e.remove("betterlinks-delete-clicks-modal-popup-opened")}}),[b]);var T=function(){clearTimeout(o),C("reset_modal_step_1"),p(!1),S(y[0])};return(0,s.createElement)("div",{className:"btl-analytic-reset-wrapeer betterlinks"},(0,s.createElement)("button",{className:"button-primary btl-reset-analytics-initial-button",onClick:function(){p(!0),C("reset_modal_step_1")}},"Reset"),(0,s.createElement)(k(),{isOpen:b,onRequestClose:T,ariaHideApp:!1},(0,s.createElement)("div",{className:"btl-reset-modal-popup-wrapper "},(0,s.createElement)("span",{className:"btl-close-modal",onClick:T},(0,s.createElement)("i",{className:"btl btl-cancel"})),"reset_modal_step_1"===w&&(0,s.createElement)("div",{className:"btl-reset-modal-popup btl-reset-modal-popup-step-1 betterlinks-body"},(0,s.createElement)("h2",null,"Pick the range of BetterLinks Analytics that you want to reset."),(0,s.createElement)("div",{className:"select_apply"},(0,s.createElement)(_.Ay,{className:"btl-modal-select--full ",classNamePrefix:"btl-react-select",onChange:function(e){S(e)},options:y,value:F,isMulti:!1}),(0,s.createElement)("button",{className:"button-primary btl-btn-reset-analytics btl-btn-reset-apply-1",onClick:function(){C("reset_modal_step_2")}},"Apply"))),"reset_modal_step_2"===w&&(0,s.createElement)("div",{className:"btl-reset-modal-popup btl-reset-modal-popup-step-2 betterlinks-body"},(0,s.createElement)("h2",null,"This Action Cannot be undone. Are you sure you want to continue?"),(0,s.createElement)("h4",null,"Clicking ",(0,s.createElement)("span",{style:{fontWeight:700}},"Reset Clicks")," will permanently delete the clicks data from database and it cannot be restored again.",(0,s.createElement)("span",{style:{display:"Block"}},"Click 'cancel' to abort.")),(0,s.createElement)("div",{className:"btl-btn-reset-popup-step-2-buttons"},(0,s.createElement)("button",{className:"button-primary btl-btn-reset-apply-2",onClick:function(){if(a){var e=(0,u.Yq)(a[0].startDate,"yyyy-mm-dd"),n=(0,u.Yq)(a[0].endDate,"yyyy-mm-dd");C("deleting");var s=(null==F?void 0:F.value)||!1;(0,u.Xq)(s,e,n).then((function(e){var n,a,s,r,c=setTimeout((function(){T()}),3e3);i(c),null!=e&&null!==(n=e.data)&&void 0!==n&&n.success?(h(null==e||null===(a=e.data)||void 0===a||null===(a=a.data)||void 0===a?void 0:a.count),t({data:null==e||null===(s=e.data)||void 0===s||null===(s=s.data)||void 0===s?void 0:s.new_clicks_data}),l({data:null==e||null===(r=e.data)||void 0===r||null===(r=r.data)||void 0===r?void 0:r.new_links_data}),C("success")):C("failed")})).catch((function(e){console.log("---caught error on DeleteClicks",{err:e});var t=setTimeout((function(){T()}),3e3);i(t)}))}}},"Reset Clicks"),(0,s.createElement)("button",{className:"button-primary btl-btn-reset-cancel",onClick:function(){return C("reset_modal_step_1")}},"Cancel"))),"deleting"===w&&(0,s.createElement)("h2",null,"Deleting..."),"success"===w&&0!==f&&(0,s.createElement)("h2",null,"Success!!! ",(0,s.createElement)("span",{className:"success_delete_count"},f)," clicks record Deleted!!!"),"success"===w&&0===f&&(0,s.createElement)("h2",null,!1===(null==F?void 0:F.value)&&"You don't have any clicks data",30===(null==F?void 0:F.value)&&"You don't have clicks data older than 30 days",90===(null==F?void 0:F.value)&&"You don't have clicks data older than 90 days"),"failed"===w&&(0,s.createElement)("h2",null,"Failed!!"))))}));var f=l(5556),h=l.n(f),g=l(40150),N=["is_pro","render"],w={label:h().string,render:h().func},C=function(e){var t=e.is_pro,l=void 0!==t&&t,c=e.render,o=void 0===c?function(){}:c,m=(0,a.A)(e,N),d=m.propsForAnalytics,b=m.activity.darkMode,p=(0,s.useState)(b),v=(0,n.A)(p,2),k=v[0],_=v[1];(0,s.useEffect)((function(){b?document.body.classList.add("betterlinks-dark-mode"):document.body.classList.remove("betterlinks-dark-mode")}),[]);var y=betterLinksQuery.get("page"),f=m.favouriteSort.sortByFav;return(0,s.createElement)("div",{className:"topbar"},(0,s.createElement)("div",{className:"topbar__logo_container"},(0,s.createElement)("div",{className:"topbar__logo"},(0,s.createElement)("img",{src:u.hq+"assets/images/logo-large".concat(k?"-white":"",".svg"),alt:"logo"}),(0,s.createElement)("span",{className:"topbar__logo__text"},m.label),l&&(0,s.createElement)(g.A,null)),o()),(0,s.createElement)("div",{className:"topbar-inner"},"betterlinks"===y&&(0,s.createElement)(r().Fragment,null,(0,s.createElement)("div",{className:"btl-view-control"},(0,s.createElement)("button",{title:(0,i.__)("Favorite Links","betterlinks"),className:"btl-link-view-toggler btl-sortby-fav ".concat(f?"active":""),onClick:function(){return m.sortFavourite(!f)}},(0,s.createElement)("svg",{xmlns:"http://www.w3.org/2000/svg",className:"favorite-svg",viewBox:"0 0 512 512",xmlSpace:"preserve"},(0,s.createElement)("path",{className:"fav-icon-svg-path",d:"M392.2 317.5c-3 2.9-4.4 7.1-3.7 11.3L414 477.4c1.2 7-3.5 13.6-10.5 14.9-2.8.5-5.6 0-8.1-1.3L262 420.9c-3.7-2-8.2-2-12 0L116.6 491c-3.1 1.7-6.8 1.9-10.1.8-6-2.1-9.5-8.1-8.5-14.4l25.4-148.5c.7-4.2-.7-8.4-3.7-11.4L11.9 212.4c-5.1-5-5.2-13.1-.2-18.2 2-2 4.6-3.3 7.3-3.7l149.1-21.7c4.2-.6 7.8-3.2 9.7-7l66.7-135c2.6-5.3 8.4-8.1 14.2-6.9 3.9.7 7.2 3.3 8.9 6.9l66.7 135c1.9 3.8 5.5 6.4 9.7 7l149 21.6c7 1 11.9 7.6 10.9 14.6-.4 2.7-1.7 5.3-3.7 7.2l-108 105.3z"}))),(0,s.createElement)("button",{title:(0,i.__)("List View","betterlinks"),className:"btl-link-view-toggler ".concat("list"==m.activity.linksView?"active":""),onClick:function(){return m.linksView("list")}},(0,s.createElement)("i",{className:"btl btl-list"})),(0,s.createElement)("button",{title:(0,i.__)("Grid View","betterlinks"),className:"btl-link-view-toggler ".concat("grid"==m.activity.linksView?"active":""),onClick:function(){return m.linksView("grid")}},(0,s.createElement)("i",{className:"btl btl-grid"})))),(null==d?void 0:d.isResetAnalytics)&&(0,s.createElement)(E,{propsForAnalytics:d}),(0,s.createElement)("label",{className:"theme-mood-button",htmlFor:"theme-mood",title:(0,i.__)("Theme Mode","betterlinks")},(0,s.createElement)("input",{type:"checkbox",name:"theme-mood",id:"theme-mood",value:k,onChange:function(){return function(e){e?document.body.classList.add("betterlinks-dark-mode"):document.body.classList.remove("betterlinks-dark-mode"),m.update_theme_mode(e),_(e)}(!k)},checked:k}),(0,s.createElement)("span",{className:"theme-mood"},(0,s.createElement)("span",{className:"icon"},(0,s.createElement)("i",{className:"btl btl-sun"})),(0,s.createElement)("span",{className:"icon"},(0,s.createElement)("i",{className:"btl btl-moon"}))))))};C.propTypes=w;const L=(0,c.Ng)((function(e){return{activity:e.activity,favouriteSort:e.favouriteSort}}),(function(e){return{linksView:(0,o.zH)(m.xb,e),sortFavourite:(0,o.zH)(d.sortFavourite,e),update_theme_mode:(0,o.zH)(m.Q7,e)}}))(C)},74138:(e,t,l)=>{l.r(t),l.d(t,{default:()=>d});var n=l(51609),a=l(27723),s=l(40150),r=l(19555),c=l(19735),o=(0,n.lazy)((function(){return Promise.all([l.e(949),l.e(216)]).then(l.bind(l,89726))})),i=(0,n.lazy)((function(){return Promise.all([l.e(757),l.e(118),l.e(488)]).then(l.bind(l,80123))}));const u=function(){var e=[{label:(0,a.__)("Full Site Link Scanner","betterlinks"),type:"pro"},{label:(0,a.__)("BetterLinks Broken Link Scanner","betterlinks"),type:"pro"}],t=[(0,n.createElement)(i,null),(0,n.createElement)(o,null)],l=betterLinksHooks.applyFilters("betterLinksSettingsBrokenLinkCheckerTabList",e),u=betterLinksHooks.applyFilters("betterLinksSettingsOptionsTabPanelList",t);return(0,n.createElement)(n.Fragment,null,(0,n.createElement)(r.tU,null,(0,n.createElement)(r.wb,null,l.map((function(e,t){return(0,n.createElement)(r.oz,{key:t},e.label,"pro"===e.type&&!c.JT&&(0,n.createElement)(s.A,null))}))),u.map((function(e,t){return(0,n.createElement)(r.Kp,{key:t},e)}))))};var m=l(16560);const d=function(){return(0,n.createElement)(n.Fragment,null,(0,n.createElement)(m.A,{label:(0,a.__)("Link Scanner","betterlinks")}),(0,n.createElement)(u,null))}}}]);
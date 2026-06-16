
(function(){
 const css=document.createElement('link'); css.rel='stylesheet'; css.href='../core/layout.css'; document.head.appendChild(css);
 const body=[...document.body.childNodes];
 document.body.innerHTML='<div class="layout"><aside id="sidebar" class="sidebar"></aside><main class="content"></main></div>';
 const main=document.querySelector('.content'); body.forEach(n=>main.appendChild(n));
 const s=document.createElement('script'); s.src='../core/sidebar.js'; document.body.appendChild(s);
 const g=document.createElement('script'); g.src='../core/globals.js'; document.body.appendChild(g);
})();

/* Shared language selector — Google Website Translator driven by our own dropdown. */
(function(){
  var L=[['ko','한국어'],['en','English'],['zh-CN','中文(简体)'],['vi','Tiếng Việt'],['mn','Монгол']];
  var KEY='tl911_lang', cur=localStorage.getItem(KEY)||'ko';
  function setCookie(v){var d=location.hostname;
    var ex=v?'':';expires=Thu, 01 Jan 1970 00:00:00 GMT';
    document.cookie='googtrans='+(v||'')+';path=/'+ex;
    if(d&&d.indexOf('.')>0){document.cookie='googtrans='+(v||'')+';path=/;domain='+d+ex;document.cookie='googtrans='+(v||'')+';path=/;domain=.'+d.replace(/^www\./,'')+ex;}}
  function combo(){return document.querySelector('select.goog-te-combo');}
  function apply(code){
    localStorage.setItem(KEY,code);
    if(code==='ko'){setCookie('');var c=combo();if(document.documentElement.classList.contains('translated-ltr')||document.documentElement.classList.contains('translated-rtl')){location.reload();}return;}
    setCookie('/ko/'+code);
    var n=0,t=setInterval(function(){var c=combo(),h=document.documentElement.classList;
      if(h.contains('translated-ltr')&&c&&c.value===code){clearInterval(t);return;}
      if(c&&c.options.length>1){c.value=code;c.dispatchEvent(new Event('change'));}
      if(++n>40)clearInterval(t);},400);
  }
  // UI
  var li=document.createElement('li');li.className='lang notranslate';li.setAttribute('translate','no');
  var sel=document.createElement('select');sel.id='langSel';sel.setAttribute('aria-label','Language / 언어');
  L.forEach(function(x){var o=document.createElement('option');o.value=x[0];o.textContent=x[1];sel.appendChild(o);});
  sel.value=cur;sel.onchange=function(){cur=sel.value;apply(cur);};
  li.appendChild(sel);
  var ul=document.querySelector('#nav ul');if(ul)ul.appendChild(li);
  var st=document.createElement('style');st.textContent=
   '.lang select{font:inherit;font-size:12px;padding:4px 22px 4px 8px;border:1px solid var(--line2,#ccc);border-radius:14px;background:var(--panel,#fff) url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2710%27 height=%276%27%3E%3Cpath d=%27M0 0l5 6 5-6z%27 fill=%27%23666%27/%3E%3C/svg%3E") no-repeat right 8px center;-webkit-appearance:none;appearance:none;color:inherit;cursor:pointer}'+
   '#google_translate_element,.goog-te-banner-frame,.skiptranslate iframe,.goog-te-gadget,#goog-gt-tt,.goog-te-balloon-frame,.VIpgJd-ZVi9od-ORHb-OEVmcd,.VIpgJd-ZVi9od-aZ2wEe-wOHMyf{display:none!important}'+
'@media(min-width:901px){.nav .wrap{align-items:center}.nav ul{grid-column:4/13;flex-wrap:nowrap;align-items:center;justify-content:flex-start;min-width:0;overflow-x:auto;scrollbar-width:none}.nav ul::-webkit-scrollbar{display:none}.nav ul li:first-child{margin-left:auto}.nav ul li.lang{position:sticky;right:0;background:linear-gradient(90deg,transparent,var(--bg) 14px);padding-left:20px;z-index:1}html.translated-ltr .nav ul a{font-size:12px}html.translated-ltr[lang=mn] .nav ul a,html.translated-ltr[lang=vi] .nav ul a{font-size:11.5px;letter-spacing:-.01em}html.translated-ltr[lang=mn] .nav ul{gap:8px}html.translated-ltr .nav .logo{grid-column:1/3}html.translated-ltr .nav ul{grid-column:3/13}.nav ul a,.nav ul li{white-space:nowrap}html.translated-ltr .nav ul{gap:clamp(8px,1vw,16px)}html.translated-ltr .nav ul a{font-size:12.5px}}'+
   'body{top:0!important;position:static!important}.goog-text-highlight{background:none!important;box-shadow:none!important}font{background:none!important}';
  document.head.appendChild(st);
  var g=document.createElement('div');g.id='google_translate_element';document.body.appendChild(g);
  window.googleTranslateElementInit=function(){
    new google.translate.TranslateElement({pageLanguage:'ko',includedLanguages:'en,zh-CN,vi,mn,ko',autoDisplay:false},'google_translate_element');
    if(cur!=='ko')apply(cur);
  };
  if(cur!=='ko')setCookie('/ko/'+cur); else setCookie('');
  var s=document.createElement('script');s.src='https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';s.async=true;
  s.onerror=function(){window.TL_LANG_ERROR='translate script failed to load';sel.title='자동 번역을 불러오지 못했습니다';};
  document.head.appendChild(s);
  window.TL_LANG={apply:apply};
})();

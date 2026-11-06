/* Shared language selector — Google Website Translator driven by our own dropdown.
   Each choice reloads from the original Korean DOM. The widget keeps a translated
   tree, so a second language (or a return to Korean) must not run on that tree. */
(function(){
  var L=[['ko','한국어'],['en','English'],['zh-CN','中文(简体)'],['vi','Tiếng Việt'],['mn','Монгол']];
  var KEY='tl911_lang';
  var cur=localStorage.getItem(KEY)||'ko';
  if(!L.some(function(x){return x[0]===cur;})) cur='ko';

  function domains(){
    var host=location.hostname||'';
    var list=[''];
    if(!host) return list;
    list.push(host, '.'+host);
    var parts=host.split('.');
    for(var i=1;i<parts.length-1;i++){
      var d=parts.slice(i).join('.');
      list.push(d, '.'+d);
    }
    return list;
  }
  function writeCookie(name, value, domain){
    var dom=domain?';domain='+domain:'';
    if(value) document.cookie=name+'='+value+';path=/'+dom;
    else document.cookie=name+'=;path=/'+dom+';expires=Thu, 01 Jan 1970 00:00:00 GMT;max-age=0';
  }
  function clearGoogTrans(){
    domains().forEach(function(domain){
      writeCookie('googtrans','',domain);
      writeCookie('googtransopt','',domain);
    });
  }
  /* One host-only cookie. Domain copies of an older language otherwise win. */
  function setGoogTrans(code){
    clearGoogTrans();
    if(code && code!=='ko') writeCookie('googtrans','/ko/'+code,'');
  }
  function stripHash(){
    if(/googtrans/i.test(location.hash)){
      try{ history.replaceState(null,'', location.pathname+location.search); }catch(e){}
    }
  }
  function combo(){return document.querySelector('select.goog-te-combo');}
  function translated(){
    var h=document.documentElement.classList;
    return h.contains('translated-ltr')||h.contains('translated-rtl');
  }
  /* User choice: store, fix cookies, reload the original page. */
  function choose(code){
    if(!L.some(function(x){return x[0]===code;})) code='ko';
    localStorage.setItem(KEY, code);
    setGoogTrans(code);
    stripHash();
    location.reload();
  }
  /* Fresh load only. Stop once Google has translated; never change language in place. */
  function syncOnce(code){
    if(!code || code==='ko') return;
    var n=0, fired=false;
    var t=setInterval(function(){
      if(translated()){ clearInterval(t); return; }
      var c=combo();
      if(!fired && c && c.options.length>1){
        fired=true;
        if(c.value!==code) c.value=code;
        c.dispatchEvent(new Event('change'));
      }
      if(++n>30) clearInterval(t);
    }, 250);
  }

  var li=document.createElement('li');li.className='lang notranslate';li.setAttribute('translate','no');
  var sel=document.createElement('select');sel.id='langSel';sel.setAttribute('aria-label','Language / 언어');
  L.forEach(function(x){var o=document.createElement('option');o.value=x[0];o.textContent=x[1];sel.appendChild(o);});
  sel.value=cur;
  sel.onchange=function(){ choose(sel.value); };
  li.appendChild(sel);
  var ul=document.querySelector('#nav ul');if(ul)ul.appendChild(li);
  var st=document.createElement('style');st.textContent=
   '.lang select{font:inherit;font-size:12px;padding:4px 22px 4px 8px;border:1px solid var(--line2,#ccc);border-radius:14px;background:transparent url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2710%27 height=%276%27%3E%3Cpath d=%27M0 0l5 6 5-6z%27 fill=%27%23666%27/%3E%3C/svg%3E") no-repeat right 8px center;-webkit-appearance:none;appearance:none;color:inherit;cursor:pointer}'+
   '#google_translate_element,.goog-te-banner-frame,.skiptranslate iframe,.goog-te-gadget,#goog-gt-tt,.goog-te-balloon-frame,.VIpgJd-ZVi9od-ORHb-OEVmcd,.VIpgJd-ZVi9od-aZ2wEe-wOHMyf{display:none!important}'+
'@media(min-width:901px){.nav .wrap{align-items:center}.nav ul{grid-column:8/13;flex-wrap:nowrap;align-items:center;justify-content:flex-start;min-width:0;overflow-x:auto;scrollbar-width:none}.nav ul::-webkit-scrollbar{display:none}.nav ul li:first-child{margin-left:auto}.nav ul li.lang{position:sticky;right:0;background:transparent;padding-left:20px;z-index:1}html.translated-ltr .nav ul a{font-size:12px}html.translated-ltr[lang=mn] .nav ul a,html.translated-ltr[lang=vi] .nav ul a{font-size:11.5px;letter-spacing:-.01em}html.translated-ltr[lang=mn] .nav ul{gap:8px}.nav ul a,.nav ul li{white-space:nowrap}html.translated-ltr .nav ul{gap:clamp(8px,1vw,16px)}html.translated-ltr .nav ul a{font-size:12.5px}}'+
   'body{top:0!important;position:static!important}.goog-text-highlight{background:none!important;box-shadow:none!important}font{background:none!important}';
  document.head.appendChild(st);
  var g=document.createElement('div');g.id='google_translate_element';document.body.appendChild(g);
  /* Dynamic pages (논문·구성원·지도 표) inject Korean after first paint.
     Start the translator only once that HTML is in the document, so the first
     pass translates it. A later in-place language change is not used. */
  var scriptLoaded=false;
  function loadTranslator(){
    if(scriptLoaded) return;
    scriptLoaded=true;
    clearTimeout(bootTimer);
    clearTimeout(readyTimer);
    var s=document.createElement('script');
    s.src='https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
    s.async=true;
    s.onerror=function(){window.TL_LANG_ERROR='translate script failed to load';sel.title='자동 번역을 불러오지 못했습니다';};
    document.head.appendChild(s);
  }
  var dynamic=/(?:^|\/)(?:theses|members|index)\.html$|\/$/.test(location.pathname);
  var bootTimer=setTimeout(loadTranslator, dynamic?3000:40);
  var readyTimer=null;
  window.googleTranslateElementInit=function(){
    new google.translate.TranslateElement({pageLanguage:'ko',includedLanguages:'en,zh-CN,vi,mn',autoDisplay:false},'google_translate_element');
    var code=localStorage.getItem(KEY)||cur;
    if(code!=='ko') syncOnce(code);
  };
  setGoogTrans(cur);
  window.addEventListener('pageshow', function(e){
    if(!e.persisted) return;
    var want=localStorage.getItem(KEY)||'ko';
    if(want==='ko' && translated()) location.reload();
  });
  window.TL_LANG={apply:choose, afterContent:function(){
    clearTimeout(bootTimer);
    clearTimeout(readyTimer);
    readyTimer=setTimeout(loadTranslator, 60);
  }};
})();

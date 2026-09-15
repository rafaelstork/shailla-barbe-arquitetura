import {createChoreography} from './choreography.js';
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const projects = {
  mudra: {name:'Apartamento Mudra', type:'FOTOGRAFIAS / RESIDENCIAL', copy:'Madeira clara, texturas e formas suaves em uma composição de interiores que convida a permanecer.', source:'https://archtrends.com/projeto/shailla-fernandes/apartamento-mudra/109868', alts:['Sala de estar do Apartamento Mudra, com madeira clara e mobiliário de linhas curvas','Detalhe da bancada, marcenaria e prateleiras no Apartamento Mudra']},
  clinica: {name:'Clínica de cirurgia plástica', type:'FOTOGRAFIAS / BARRA DA TIJUCA', copy:'Preto, branco e madeira compõem os ambientes desta clínica de cirurgia plástica na Barra da Tijuca, no Rio de Janeiro.', source:'https://archtrends.com/projeto/shailla-fernandes/clinica-cirurgia-plrastica-rio-de-janeiro/101541', alts:['Recepção de clínica com sofá curvo branco, balcão escuro e grandes janelas','Consultório com bancada em pedra escura e painel de linhas verticais']},
  posto04: {name:'Cobertura Posto 04', type:'FOTOGRAFIAS / BARRA DA TIJUCA', copy:'Um percurso entre a área externa, o verde e os detalhes dos interiores nesta cobertura na Barra da Tijuca.', source:'https://archtrends.com/projeto/shailla-fernandes/cobertura-posto-04-barra-da-tijuca/102277', alts:['Piscina da Cobertura Posto 04 junto a um jardim vertical e palmeiras','Lavabo da Cobertura Posto 04 com pedra iluminada e metais dourados']},
  copa: {name:'Cozinha em Copacabana', type:'FOTOGRAFIAS / COPACABANA', copy:'O azul da marcenaria encontra superfícies claras em uma cozinha com desenho contínuo e iluminação integrada.', source:'https://archtrends.com/projeto/shailla-fernandes/cozinha-apartamento-copacabana-rj/83850', alts:['Cozinha em Copacabana com armários inferiores azuis e bancada clara','Vista frontal da bancada e da marcenaria azul da cozinha em Copacabana']},
  laviano: {name:'Clínica Laviano Experience', type:'VISUALIZAÇÕES DO PROJETO / SAÚDE', copy:'Pedra, madeira e linhas precisas desenham a proposta de interiores da Clínica Laviano Experience.', source:'https://archtrends.com/projeto/shailla-fernandes/clinica-laviano-experience/83855', alts:['Visualização da recepção da Clínica Laviano com balcão de pedra escura','Visualização de consultório da Clínica Laviano com mobiliário e painéis amadeirados']},
  acquabela: {name:'Cobertura Acquabela', type:'VISUALIZAÇÕES DO PROJETO / BARRA DA TIJUCA', copy:'A proposta do living combina superfícies claras, detalhes amadeirados e o contraste do painel em pedra escura.', source:'https://archtrends.com/projeto/shailla-fernandes/cobertura-acquabela-barra-da-tijuca-rj/83846', alts:['Visualização do living da Cobertura Acquabela com estofados claros e iluminação linear','Visualização do painel de televisão em pedra escura da Cobertura Acquabela']}
};
const appEvents = new AbortController();
const on = (target, event, callback, options = {}) => target.addEventListener(event, callback, {...options, signal:appEvents.signal});
const systemReduce = matchMedia('(prefers-reduced-motion: reduce)');
let userPaused = false;
try {userPaused = localStorage.getItem('shailla-motion') === 'off';} catch {}
const reduced = () => systemReduce.matches || userPaused;
const menu = $('#menu'), lightbox = $('#lightbox');
let lenis, motionContext, motionMedia, cleanupScene, sceneObserver, ticker, refreshTimer, generation = 0;
let projectSequence = 0, activeProject = 'mudra', imageProject = 'mudra', imageIndex = 0;
let pendingMenuHash;
const indexLinks = $$('[data-project]');
const marker=document.createElement('span');marker.className='project-marker';marker.setAttribute('aria-hidden','true');
indexLinks[0].append(marker);$('.project-index').dataset.marker='true';
const dialogAnimations=new WeakMap();
const headerShell=$('.header-shell');
let previousScroll=window.scrollY,scrollDirection=0,directionTravel=0,headerHeight=$('.header').offsetHeight;
const showHeader=()=>{headerShell.dataset.hidden='false';};
const headerSizeObserver=new ResizeObserver(()=>{headerHeight=$('.header').offsetHeight;document.documentElement.style.setProperty('--nav-offset',`${headerHeight+20}px`);});headerSizeObserver.observe($('.header'));
on(window,'scroll',()=>{
  const position=Math.max(0,window.scrollY),delta=position-previousScroll;previousScroll=position;
  headerShell.dataset.scrolled=String(position>12);
  if(menu.open||lightbox.open||position<headerHeight){showHeader();return;}
  if(Math.abs(delta)<1)return;
  const direction=Math.sign(delta);directionTravel=direction===scrollDirection?directionTravel+Math.abs(delta):Math.abs(delta);scrollDirection=direction;
  if(direction<0&&directionTravel>8)showHeader();
  else if(direction>0&&directionTravel>22&&!headerShell.contains(document.activeElement))headerShell.dataset.hidden='true';
},{passive:true});
on(headerShell,'focusin',showHeader);
const lock = () => {showHeader();lenis?.stop(); document.body.classList.add('modal-open');};
const unlock = () => {if (!menu.open && !lightbox.open) {document.body.classList.remove('modal-open');lenis?.start();}};
const refresh = () => {clearTimeout(refreshTimer);refreshTimer = setTimeout(() => {lenis?.resize();window.ScrollTrigger?.refresh();},100);};
const animate = callback => {if(!reduced() && motionContext) motionContext.add(callback);};
function showDialog(dialog) {
  dialog.showModal();lock();
  animate(() => {
    const timeline=gsap.timeline({defaults:{ease:'power3.out'}});
    if(dialog===menu){
      timeline.fromTo(dialog,{clipPath:'inset(0 0 100% 0 round 0 0 36px 36px)'},{clipPath:'inset(0 0 0% 0 round 0 0 36px 36px)',duration:.5},0)
        .fromTo($$('.menu-inner nav a'),{y:24,opacity:0},{y:0,opacity:1,duration:.4,stagger:.055},.15);
      if(window.DrawSVGPlugin)timeline.fromTo($$('.menu-inner svg path'),{drawSVG:0},{drawSVG:'100%',duration:.5,stagger:.04},.22);
    }else{
      timeline.fromTo(dialog,{opacity:0},{opacity:1,duration:.3},0)
        .fromTo($('.lightbox-stage'),{scale:.965,clipPath:'inset(0 5% 0 5%)'},{scale:1,clipPath:'inset(0 0% 0 0%)',duration:.55},0);
    }
    dialogAnimations.set(dialog,timeline);
  });
}
const closingDialogs = new WeakSet();
function closeDialog(dialog) {
  if (!dialog.open || closingDialogs.has(dialog)) return;
  closingDialogs.add(dialog);
  const finish = () => {dialog.close();dialogAnimations.get(dialog)?.kill();dialogAnimations.delete(dialog);dialog.removeAttribute('style');closingDialogs.delete(dialog);unlock();};
  const timeline=dialogAnimations.get(dialog);
  if (!reduced() && timeline && timeline.totalTime()>0) {timeline.eventCallback('onReverseComplete',finish);timeline.timeScale(1.7).reverse();} else finish();
}
on($('.menu-toggle'),'click',() => {showDialog(menu);$('.menu-toggle').setAttribute('aria-expanded','true');});
on($('.menu-close'),'click',() => closeDialog(menu));
on(menu,'close',() => {$('.menu-toggle').setAttribute('aria-expanded','false');unlock();if(pendingMenuHash){const hash=pendingMenuHash;pendingMenuHash=undefined;goToAnchor(hash);}});
on($('.lightbox-close'),'click',() => closeDialog(lightbox));
on(lightbox,'close',unlock);
for(const dialog of [menu,lightbox]) {
  on(dialog,'cancel',event => {event.preventDefault();closeDialog(dialog);});
  on(dialog,'click',event => {if(event.target===dialog) {const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)closeDialog(dialog);}});
}
function goToAnchor(hash, push = true) {
  const target = document.getElementById(hash.slice(1));if(!target)return;
  if(push && location.hash!==hash) history.pushState(null,'',hash);
  const finish=()=>{if(!target.hasAttribute('tabindex'))target.setAttribute('tabindex','-1');target.focus({preventScroll:true});previousScroll=window.scrollY;directionTravel=0;showHeader();};
  if(lenis && !reduced())lenis.scrollTo(target,{offset:0,immediate:!push,onComplete:finish});else{target.scrollIntoView({behavior:'instant',block:'start'});finish();}
}
on(document,'click',event => {
  const a=event.target.closest('a[href^="#"]');if(!a || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button!==0)return;
  if(!document.getElementById(a.hash.slice(1)))return;event.preventDefault();
  if(menu.open){pendingMenuHash=a.hash;closeDialog(menu);}else goToAnchor(a.hash);
});
on(window,'popstate',()=>{if(location.hash)goToAnchor(location.hash,false);else {lenis?.scrollTo(0,{immediate:true});window.scrollTo({top:0,behavior:'instant'});}});
async function selectProject(key) {
  const project = projects[key];if(!project)return;
  const sequence=++projectSequence;
  $('.project-board').setAttribute('aria-busy','true');
  const sources=[`assets/${key}-01.webp`,`assets/${key}-02-800.webp`];
  await Promise.all(sources.map(src=>{const im=new Image();im.src=src;return im.decode().catch(()=>{});}));
  if(sequence!==projectSequence)return;
  activeProject=key;
  let markerState;
  if(!reduced()&&window.Flip){Flip.killFlipsOf(marker,true);markerState=Flip.getState(marker);}
  for(const link of indexLinks) {if(link.dataset.project===key)link.setAttribute('aria-current','true');else link.removeAttribute('aria-current');}
  indexLinks.find(link=>link.dataset.project===key).append(marker);
  ['main','detail'].forEach((role,i)=>{const el=$(`#project-${role}-image`);el.src=sources[i];el.alt=project.alts[i];el.parentElement.href=`assets/${key}-0${i+1}-full.webp`;el.parentElement.dataset.image=`${key}-0${i+1}`;});
  $('#project-type').textContent=project.type;$('#project-name').textContent=project.name;$('#project-copy').textContent=project.copy;$('#project-source').href=project.source;
  $('#project-announcement').textContent=`${project.name}. Duas imagens disponíveis para ampliar.`;
  $('.project-board').removeAttribute('aria-busy');
  animate(()=>{
    if(markerState)Flip.from(markerState,{duration:.55,ease:'power3.inOut',absolute:true});
    const photos=[$('#project-main-image'),$('#project-detail-image')];gsap.killTweensOf(photos);
    const transition=gsap.timeline();
    transition.fromTo(photos[0],{clipPath:'inset(0 100% 0 0)'},{clipPath:'inset(0 0% 0 0)',duration:.65,ease:'power3.inOut',clearProps:'clipPath'},0)
      .fromTo(photos[1],{clipPath:'inset(0 0 0 100%)'},{clipPath:'inset(0 0 0 0%)',duration:.6,ease:'power3.inOut',clearProps:'clipPath'},.09)
      .fromTo($('#project-name'),{y:8,opacity:.5},{y:0,opacity:1,duration:.4,clearProps:'transform,opacity',overwrite:true},.15);
  });refresh();
}
indexLinks.forEach((link,i)=>{
  on(link,'click',event=>{if(event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;event.preventDefault();selectProject(link.dataset.project);});
  on(link,'keydown',event=>{const directions={ArrowDown:1,ArrowRight:1,ArrowUp:-1,ArrowLeft:-1};let next;if(event.key in directions)next=(i+directions[event.key]+indexLinks.length)%indexLinks.length;else if(event.key==='Home')next=0;else if(event.key==='End')next=indexLinks.length-1;else return;event.preventDefault();indexLinks[next].focus();selectProject(indexLinks[next].dataset.project);});
});
function renderLightbox() {
  const project=projects[imageProject];$('#lightbox-title').textContent=project.name;
  $('#lightbox-image').src=`assets/${imageProject}-0${imageIndex+1}-full.webp`;$('#lightbox-image').alt=project.alts[imageIndex];
  $('#image-count').textContent=`${imageIndex+1} / 2`;$('#image-source').href=project.source;
  $('#image-prev').disabled=imageIndex===0;$('#image-next').disabled=imageIndex===1;
}
on(document,'click',event=>{const link=event.target.closest('.lightbox-link');if(!link||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;event.preventDefault();const [key,n]=link.dataset.image.split('-');imageProject=key;imageIndex=Number(n)-1;renderLightbox();showDialog(lightbox);});
on($('#image-prev'),'click',()=>{if(imageIndex>0){imageIndex--;renderLightbox();}});
on($('#image-next'),'click',()=>{if(imageIndex<1){imageIndex++;renderLightbox();}});
on(lightbox,'keydown',event=>{if(event.key==='ArrowLeft'&&imageIndex>0){event.preventDefault();imageIndex--;renderLightbox();}if(event.key==='ArrowRight'&&imageIndex<1){event.preventDefault();imageIndex++;renderLightbox();}});
function disposeMotion() {
  generation++;sceneObserver?.disconnect();sceneObserver=null;cleanupScene?.();cleanupScene=null;
  if(ticker)window.gsap?.ticker.remove(ticker);ticker=null;
  lenis?.destroy();lenis=null;motionMedia?.revert();motionMedia=null;motionContext?.revert();motionContext=null;
  for(const dialog of [menu,lightbox]){dialogAnimations.get(dialog)?.kill();dialogAnimations.delete(dialog);}
  for(const dialog of [menu,lightbox]) if(closingDialogs.has(dialog)){dialog.close();closingDialogs.delete(dialog);}unlock();
}
async function configureMotion() {
  disposeMotion();const current= generation;
  const paused=reduced();document.body.dataset.motion=paused?'off':'on';
  $('#motion-toggle').setAttribute('aria-pressed',String(paused));$('#motion-toggle').innerHTML=paused?'Ativar animações <span aria-hidden="true">▷</span>':'Pausar animações <span aria-hidden="true">Ⅱ</span>';
  $('#motion-toggle').disabled=systemReduce.matches;
  if(systemReduce.matches)$('#motion-toggle').textContent='Movimento reduzido pelo sistema';
  if(paused)return;
  if(!window.gsap||!window.ScrollTrigger){document.body.dataset.motion='off';$('#motion-toggle').textContent='Animações indisponíveis';$('#motion-toggle').setAttribute('aria-pressed','true');$('#motion-toggle').disabled=true;return;}
  try {
    gsap.registerPlugin(ScrollTrigger,...[window.DrawSVGPlugin,window.SplitText,window.Flip].filter(Boolean));gsap.ticker.lagSmoothing(0);
    const {default:Lenis}=await import('./vendor/lenis.mjs');if(current!==generation)return;
    lenis=new Lenis({autoRaf:false,smoothWheel:true,syncTouch:false,duration:1.05,anchors:false});lenis.on('scroll',ScrollTrigger.update);
    ticker=time=>lenis?.raf(time*1000);gsap.ticker.add(ticker);
    motionContext=gsap.context(()=>{motionMedia=createChoreography();},document.body);
    sceneObserver=new IntersectionObserver(async entries=>{
      if(!entries.some(e=>e.isIntersecting))return;sceneObserver?.disconnect();
      try {const {mountScene}=await import('./material-scene.js');if(current!==generation)return;cleanupScene=mountScene($('#spatial-scene'),gsap,ScrollTrigger);}catch {$('#spatial-scene').removeAttribute('data-ready');}
    },{rootMargin:'350px'});sceneObserver.observe($('#spatial-scene'));
    if(menu.open||lightbox.open)lenis.stop();refresh();
  }catch {disposeMotion();document.body.dataset.motion='off';$('#motion-toggle').setAttribute('aria-pressed','true');$('#motion-toggle').textContent='Animações indisponíveis';$('#motion-toggle').disabled=true;}
}
on($('#motion-toggle'),'click',()=>{userPaused=!userPaused;try{localStorage.setItem('shailla-motion',userPaused?'off':'on');}catch{}configureMotion();});
on(systemReduce,'change',configureMotion);
on(window,'resize',refresh);
for(const img of $$('img'))on(img,'load',refresh);
document.fonts.ready.then(refresh);
on(window,'load',()=>{if(location.hash)goToAnchor(location.hash,false);refresh();},{once:true});
on(window,'pagehide',()=>{disposeMotion();clearTimeout(refreshTimer);});
on(window,'pageshow',event=>{if(event.persisted)configureMotion();});
configureMotion();


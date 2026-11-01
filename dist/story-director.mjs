/**
 * StorySiap / Scroll Film Director v7
 * One timeline: viewport travel drives hero, portal, chapter choreography and a
 * persistent ambient light field. No independent scroll animation loops.
 * Premium Rebuild's original WebGL shaders remain untouched.
 */
const root=document.documentElement;
const chapters=[...document.querySelectorAll('main > section')];
const hero=document.querySelector('.hero');
const portal=document.querySelector('.cinema-portal');
const phase=document.getElementById('portalPhase');
const lineItems=[...(portal?.querySelectorAll('.portal-line')||[])];
const photoA=portal?.querySelector('.portal-photo-a');
const photoB=portal?.querySelector('.portal-photo-b');
const sphere=portal?.querySelector('.portal-sphere');
const haloA=portal?.querySelector('.halo-outer');
const haloB=portal?.querySelector('.halo-inner');
const track=document.getElementById('portalTrack');
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const clamp=(v,min=0,max=1)=>Math.max(min,Math.min(max,v));
const lerp=(a,b,t)=>a+(b-a)*t;
const smooth=v=>{v=clamp(v);return v*v*(3-2*v)};
const range=(v,a,b)=>smooth((v-a)/(b-a));
const colors=[
  {c:[152,114,224],x:72,y:51,z:1.05,r:-15},
  {c:[193,145,241],x:63,y:47,z:1.29,r:118},
  {c:[131,103,200],x:78,y:46,z:.82,r:198},
  {c:[107,151,204],x:75,y:54,z:.98,r:270},
  {c:[219,153,189],x:24,y:42,z:.85,r:374},
  {c:[165,146,225],x:77,y:55,z:.82,r:455},
  {c:[208,174,139],x:72,y:50,z:.91,r:556},
  {c:[154,143,210],x:28,y:45,z:.80,r:647},
  {c:[157,153,219],x:77,y:53,z:.69,r:737},
  {c:[191,151,237],x:53,y:46,z:1.18,r:900}
];
const atmosphere=document.createElement('div');
atmosphere.className='story-director-world';
atmosphere.id='storyDirectorWorld';
atmosphere.setAttribute('aria-hidden','true');
atmosphere.innerHTML='<div class="story-director-haze"></div><div class="story-director-ring"></div><div class="story-director-ring ring-two"></div><div class="story-director-sheen"></div>';
document.body.append(atmosphere);
let geometry=[],viewport=innerHeight,scrollYNow=scrollY;
let pointer={x:.5,y:.5},pointerS={x:.5,y:.5};
let raf=0,active=!document.hidden,lastScene=-1;
const movable=chapters.map(section=>{
  section.classList.add('director-section');
  const h=section.querySelector('h2');
  if(h)h.classList.add('director-headline');
  return section;
});
function measure(){
  viewport=innerHeight;
  geometry=chapters.map(section=>{
    const rect=section.getBoundingClientRect();
    return {section,top:rect.top+window.scrollY,height:rect.height,center:rect.top+window.scrollY+Math.min(rect.height,viewport*1.6)*.5};
  });
}
function sample(globalFocus){
  let index=0;
  while(index<geometry.length-2&&globalFocus>geometry[index+1].center)index++;
  const start=geometry[index],end=geometry[Math.min(index+1,geometry.length-1)];
  const t=index===geometry.length-1?1:smooth((globalFocus-start.center)/Math.max(1,end.center-start.center));
  const a=colors[Math.min(index,colors.length-1)],b=colors[Math.min(index+1,colors.length-1)];
  return {index,t,x:lerp(a.x,b.x,t),y:lerp(a.y,b.y,t),z:lerp(a.z,b.z,t),r:lerp(a.r,b.r,t),c:a.c.map((value,k)=>Math.round(lerp(value,b.c[k],t)))};
}
function setLine(el,opacity,offset,scale){
  if(!el)return;
  el.style.opacity=opacity.toFixed(5);
  el.style.transform='translate3d(0,'+offset.toFixed(2)+'px,0) scale('+scale.toFixed(4)+')';
  const visible=opacity>.09;
  el.style.pointerEvents=visible?'auto':'none';
  if(el.getAttribute('aria-hidden')!==String(!visible))el.setAttribute('aria-hidden',String(!visible));
  const link=el.querySelector('a');
  if(link&&link.tabIndex!==(visible?0:-1))link.tabIndex=visible?0:-1;
}
function directPortal(p,allow){
  if(!portal)return;
  const a=1-range(p,.12,.38);
  const b=range(p,.20,.42)*(1-range(p,.59,.78));
  const c=range(p,.62,.84);
  portal.style.setProperty('--act',p.toFixed(5));
  portal.style.setProperty('--opacity-a',a.toFixed(5));
  portal.style.setProperty('--opacity-b',b.toFixed(5));
  portal.style.setProperty('--opacity-c',c.toFixed(5));
  portal.style.setProperty('--spin',(p*335).toFixed(2)+'deg');
  if(track)track.style.transform='scaleX('+p.toFixed(5)+')';
  if(phase)phase.textContent=p<.34?'01 — FEEL':p<.71?'02 — CREATE':'03 — SHARE';
  if(!allow)return;
  setLine(lineItems[0],a,-p*96,1-p*.15);
  setLine(lineItems[1],b,(.50-p)*122,.92+p*.10);
  setLine(lineItems[2],c,(.85-p)*94,.89+p*.12);
  if(sphere){
    sphere.style.opacity=(1-range(p,.2,.46)*.93).toFixed(4);
    sphere.style.transform='translate(-50%,-50%) translateZ('+(p*205).toFixed(2)+'px) rotate('+(p*286).toFixed(2)+'deg) scale('+(1+p*.18).toFixed(4)+')';
  }
  if(haloA)haloA.style.transform='translate(-50%,-50%) rotate('+(p*344).toFixed(2)+'deg) rotateX('+(63+p*12).toFixed(2)+'deg)';
  if(haloB)haloB.style.transform='translate(-50%,-50%) rotate('+(-p*291).toFixed(2)+'deg) rotateY('+(58+p*13).toFixed(2)+'deg)';
  if(photoA){
    const t=range(p,.12,.72);
    photoA.style.opacity=(range(p,.14,.32)*(1-range(p,.63,.85))).toFixed(4);
    photoA.style.transform='translate(-50%,-50%) translate3d('+lerp(135,-42,t).toFixed(2)+'px,'+lerp(88,-35,t).toFixed(2)+'px,'+lerp(-220,165,t).toFixed(2)+'px) rotateY('+lerp(-43,20,t).toFixed(2)+'deg) rotateZ('+lerp(-19,11,t).toFixed(2)+'deg) scale('+lerp(.68,1.13,t).toFixed(4)+')';
  }
  if(photoB){
    const t=range(p,.55,.97);
    photoB.style.opacity=range(p,.60,.82).toFixed(4);
    photoB.style.transform='translate(-50%,-50%) translate3d('+lerp(-170,125,t).toFixed(2)+'px,'+lerp(105,-75,t).toFixed(2)+'px,'+lerp(-265,195,t).toFixed(2)+'px) rotateY('+lerp(38,-32,t).toFixed(2)+'deg) rotateZ('+lerp(18,-12,t).toFixed(2)+'deg) scale('+lerp(.72,1.1,t).toFixed(4)+')';
  }
}
function render(){
  raf=0;if(!active)return;
  const allow=!reduced.matches&&!root.classList.contains('motion-off');
  root.classList.toggle('director-reduced',!allow);
  const focus=scrollYNow+viewport*.53;
  const maxScroll=Math.max(1,document.documentElement.scrollHeight-viewport);
  const global=clamp(scrollYNow/maxScroll);
  const pose=sample(focus);
  lastScene=pose.index;
  root.style.setProperty('--story-progress',global.toFixed(6));
  root.style.setProperty('--story-color',pose.c.join(','));
  root.style.setProperty('--story-camera-rotation',pose.r.toFixed(3)+'deg');
  pointerS.x=lerp(pointerS.x,pointer.x,.17);
  pointerS.y=lerp(pointerS.y,pointer.y,.17);
  atmosphere.style.setProperty('--story-x',(pose.x+(pointerS.x-.5)*5).toFixed(2)+'%');
  atmosphere.style.setProperty('--story-y',(pose.y+(pointerS.y-.5)*4).toFixed(2)+'%');
  atmosphere.style.setProperty('--story-scale',pose.z.toFixed(4));
  atmosphere.style.setProperty('--story-angle',pose.r.toFixed(3)+'deg');
  atmosphere.style.opacity=allow?'1':'0';
  if(hero&&geometry[0]){
    const p=clamp((scrollYNow-geometry[0].top)/Math.max(1,geometry[0].height));
    hero.style.setProperty('--story-hero-exit',range(p,.18,.91).toFixed(5));
    hero.style.setProperty('--story-hero-p',p.toFixed(5));
  }
  if(portal&&geometry[1]){
    const scene=geometry[1];
    const p=clamp((scrollYNow-scene.top)/Math.max(1,scene.height-viewport));
    directPortal(p,allow);
  }
  geometry.forEach((m,i)=>{
    if(i===0||i===1)return;
    const p=clamp((focus-m.top)/Math.max(1,m.height));
    const enter=range(p,0,.30);
    const exit=range(p,.77,1);
    m.section.style.setProperty('--story-local',p.toFixed(5));
    m.section.style.setProperty('--story-enter',enter.toFixed(5));
    m.section.style.setProperty('--story-exit',exit.toFixed(5));
    m.section.style.setProperty('--story-drift',(lerp(36,-36,p)).toFixed(2)+'px');
    m.section.style.setProperty('--story-spin',(lerp(-2.8,2.8,p)).toFixed(2)+'deg');
  });
  if(Math.abs(pointerS.x-pointer.x)+Math.abs(pointerS.y-pointer.y)>.004)request();
}
function request(){if(!raf&&active)raf=requestAnimationFrame(render)}
function onScroll(){scrollYNow=window.scrollY;request()}
addEventListener('scroll',onScroll,{passive:true});
addEventListener('resize',()=>{measure();onScroll()},{passive:true});
addEventListener('pointermove',event=>{if(event.pointerType==='mouse'){pointer.x=event.clientX/Math.max(1,innerWidth);pointer.y=event.clientY/Math.max(1,innerHeight);request()}},{passive:true});
document.addEventListener('visibilitychange',()=>{active=!document.hidden;if(active){measure();onScroll()}});
reduced.addEventListener?.('change',request);
new MutationObserver(request).observe(root,{attributes:true,attributeFilter:['class']});
if('ResizeObserver' in window){const ro=new ResizeObserver(()=>{measure();request()});chapters.forEach(section=>ro.observe(section))}
window.__storySiapDirector=Object.freeze({version:'v7',get progress(){return clamp(scrollYNow/Math.max(1,document.documentElement.scrollHeight-viewport))},get chapters(){return chapters.length},get currentChapter(){return lastScene+1}});
measure();onScroll();

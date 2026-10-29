'use strict';
(()=>{
 const filter=key=>{document.querySelectorAll('[data-meta]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.meta===key)));document.querySelectorAll('[data-character-meta]').forEach(c=>c.hidden=!!key&&c.dataset.characterMeta!==key);document.querySelectorAll('[data-banner]').forEach(b=>{b.hidden=b.dataset.banner!==key;if(!b.hidden){const img=b.querySelector('.oc-banner');if(img&&!img.src)img.src=img.dataset.src}});document.querySelectorAll('.oc-collection').forEach(area=>{const n=area.querySelectorAll('.oc-card:not([hidden])').length;const count=area.querySelector('.oc-gallery-heading small');if(count)count.textContent=n+(n===1?' CARD':' CARDS')})};
 const initial=new URLSearchParams(location.search).get('oc')||'';
 filter([...document.querySelectorAll('[data-meta]')].some(b=>b.dataset.meta===initial)?initial:'');
 document.querySelectorAll('[data-meta]').forEach(b=>b.addEventListener('click',()=>{filter(b.dataset.meta);if(!document.getElementById('oc-collection-dialog')){const url=new URL(location.href);if(b.dataset.meta)url.searchParams.set('oc',b.dataset.meta);else url.searchParams.delete('oc');history.replaceState(null,'',url)}}));
 const dialog=document.getElementById('oc-collection-dialog');
 if(dialog){const open=document.getElementById('oc-open-collection');open.addEventListener('click',()=>dialog.showModal());document.getElementById('oc-close-collection').addEventListener('click',()=>dialog.close());dialog.addEventListener('close',()=>open.focus())}
})();
(()=>{
 document.querySelectorAll('.oc-card').forEach(card=>{
  let drag=null,moved=false;
  const reset=()=>{drag=null;card.classList.remove('oc-pressed');card.style.removeProperty('--tilt-x');card.style.removeProperty('--tilt-y')};
  const paint=ev=>{const r=card.getBoundingClientRect(),x=Math.max(0,Math.min(1,(ev.clientX-r.left)/r.width)),y=Math.max(0,Math.min(1,(ev.clientY-r.top)/r.height));card.style.setProperty('--tilt-x',((.5-y)*14)+'deg');card.style.setProperty('--tilt-y',((x-.5)*14)+'deg');card.style.setProperty('--shine-x',(x*100)+'%');card.style.setProperty('--shine-y',(y*100)+'%')};
  card.addEventListener('pointerdown',ev=>{if(!ev.isPrimary||ev.button!==0)return;moved=false;drag={x:ev.clientX,y:ev.clientY,id:ev.pointerId};card.setPointerCapture(ev.pointerId);card.classList.add('oc-pressed');paint(ev)});
  card.addEventListener('pointermove',ev=>{if(!drag||ev.pointerId!==drag.id)return;if(Math.hypot(ev.clientX-drag.x,ev.clientY-drag.y)>5)moved=true;paint(ev)});
  for(const event of ['pointerup','pointercancel','lostpointercapture'])card.addEventListener(event,reset);
  card.addEventListener('click',ev=>{if(moved&&ev.detail!==0){ev.preventDefault();moved=false}});
  card.addEventListener('dragstart',ev=>ev.preventDefault());
 });
})();

// The hero card uses the same pointer tilt as collection cards; video playback disables it.
(()=>{document.querySelectorAll('.oc-art.oc-decorated').forEach(card=>{let drag=null,start=null,moved=false;const reset=()=>{drag=null;start=null;card.classList.remove('oc-pressed');card.style.removeProperty('--tilt-x');card.style.removeProperty('--tilt-y')};const playing=()=>!!card.querySelector('.y1-animated-video');const sync=()=>{const active=playing();if(card.classList.contains('oc-video-active')!==active)card.classList.toggle('oc-video-active',active);if(active&&(drag!==null||card.classList.contains('oc-pressed')))reset()};new MutationObserver(sync).observe(card,{childList:true,subtree:true,attributes:true,attributeFilter:['hidden','class']});card.addEventListener('play',sync,true);card.addEventListener('pause',sync,true);card.addEventListener('ended',sync,true);card.addEventListener('pointerdown',ev=>{if(playing()||ev.button!==0||!ev.isPrimary||ev.target.closest('button,video'))return;drag=ev.pointerId;start={x:ev.clientX,y:ev.clientY};moved=false;card.setPointerCapture(ev.pointerId);card.classList.add('oc-pressed')});card.addEventListener('pointermove',ev=>{if(drag!==ev.pointerId||playing())return;if(start&&Math.hypot(ev.clientX-start.x,ev.clientY-start.y)>5)moved=true;const r=card.getBoundingClientRect(),x=Math.max(0,Math.min(1,(ev.clientX-r.left)/r.width)),y=Math.max(0,Math.min(1,(ev.clientY-r.top)/r.height));card.style.setProperty('--tilt-x',((.5-y)*14)+'deg');card.style.setProperty('--tilt-y',((x-.5)*14)+'deg');card.style.setProperty('--shine-x',(x*100)+'%');card.style.setProperty('--shine-y',(y*100)+'%')});['pointerup','pointercancel','lostpointercapture'].forEach(k=>card.addEventListener(k,reset));card.addEventListener('click',ev=>{if(moved&&ev.detail!==0){ev.preventDefault();ev.stopImmediatePropagation();moved=false}},true);sync()})})();

// B Gallery: the stable shared WWW player still owns audio, track switching and lyric data.
// OC only moves the lyric panel into the page flow and adds close-on-second-click behavior.
document.addEventListener?.('DOMContentLoaded',()=>{
 const player=document.querySelector('#get-music-player[data-inline="true"]');
 const panel=player?.querySelector('[data-music-lyrics-panel]');
 const soundtrack=document.querySelector('.oc-soundtrack');
 if(!player||!panel||!soundtrack)return;
 panel.classList.add('oc-lyrics-slot');
 soundtrack.after(panel);
 const main=player.querySelector('[data-music-main-panel]');
 const toggle=player.querySelector('[data-music-lyrics-button]');
 const close=panel.querySelector('[data-music-lyrics-back]');
 const title=panel.querySelector('[data-music-lyrics-title]');
 const heading=panel.querySelector('.get-music-lyrics-head');
 const body=panel.querySelector('.get-music-lyrics-text');
 const preserveDisc=()=>{if(main?.hidden)main.hidden=false};
 if(main){new MutationObserver(preserveDisc).observe(main,{attributes:true,attributeFilter:['hidden']});preserveDisc()}
 if(heading&&body){
   const scroller=document.createElement('div');scroller.className='oc-lyrics-scroll';
   body.before(scroller);scroller.append(body);
 }
 if(close)close.textContent='Close';
 if(title){
   const label='Lyrics · Base Script';
   const keepHeading=()=>{if(title.textContent!==label)title.textContent=label};
   new MutationObserver(keepHeading).observe(title,{childList:true,characterData:true,subtree:true});
   keepHeading();
 }
 // When opening, allow the existing player's original handler to populate lyrics.
 // When closing by the same icon, intercept ONLY that action.
 toggle?.addEventListener('click',ev=>{
   if(!panel.hidden){
     ev.stopImmediatePropagation();
     panel.hidden=true;
     player.classList.remove('is-lyrics-open');
     toggle.setAttribute('aria-expanded','false');
   } else {
     toggle.setAttribute('aria-expanded','true');
   }
 },true);
 close?.addEventListener('click',()=>{
   toggle?.setAttribute('aria-expanded','false');
   toggle?.focus();
 });
 new MutationObserver(()=>toggle?.setAttribute('aria-expanded',String(!panel.hidden)))
   .observe(panel,{attributes:true,attributeFilter:['hidden']});
});

'use strict';
(()=>{
 const filter=key=>{
   document.querySelectorAll('[data-meta]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.meta===key)));
   document.querySelectorAll('[data-character-meta]').forEach(c=>c.hidden=!!key&&c.dataset.characterMeta!==key);
   document.querySelectorAll('[data-banner]').forEach(b=>{
     b.hidden=b.dataset.banner!==key;
     if(!b.hidden){const img=b.querySelector('.oc-banner');if(img&&!img.src)img.src=img.dataset.src}
   });
   document.querySelectorAll('.oc-collection').forEach(area=>{
     const heading=area.querySelector('[data-oc-gallery-title]');
     const selected=[...area.querySelectorAll('[data-meta]')].find(b=>b.dataset.meta===key);
     if(heading)heading.textContent=selected?.dataset.metaName||'ALL COLLECTION';
     const n=area.querySelectorAll('.oc-card:not([hidden])').length;
     const count=area.querySelector('.oc-gallery-heading small');
     if(count)count.textContent=n+(n===1?' CARD':' CARDS');
   });
 };
 // Keep the publisher's inherited Rank/Effect/Frame sort until the visitor
 // explicitly selects one of the four alternate ordering modes.
 document.querySelectorAll('.oc-collection').forEach(area=>{
   const grid=area.querySelector('.oc-grid');
   if(!grid)return;
   const original=[...grid.querySelectorAll('.oc-card')];
   const stable=new Map(original.map((card,i)=>[card,i]));
   const collator=new Intl.Collator('en',{numeric:true,sensitivity:'base'});
   // Persist only the visitor's visual density; it does not modify card data.
   const columnsKey='y1-oc-gallery-columns';
   let selectedSize='s';
   try{const saved=localStorage.getItem(columnsKey);if(['s','m','l'].includes(saved))selectedSize=saved}catch(_e){}
  // HTML always starts with the small image. Full-size URLs in data attributes
  // are inert until the visitor chooses four or three columns and scrolls near a card.
  const richCards=original.map(card=>({card,media:card.querySelector('.oc-card-media[data-oc-aim-url]')})).filter(row=>row.media);
  const loaded=new WeakSet(),pending=new WeakSet(),failed=new WeakSet();
  const showImage=(media,high)=>{media.style.backgroundImage='url('+JSON.stringify(media.dataset[high?'ocAimUrl':'ocAixsUrl'])+')'};
  const fetchAim=row=>{
    const media=row.media;
    if(loaded.has(media)){if(area.dataset.ocColumns!=='s')showImage(media,true);return}
    if(pending.has(media)||failed.has(media))return;
    pending.add(media);
    const probe=new Image();
    probe.onload=()=>{
      const ready=()=>{
        pending.delete(media);loaded.add(media);
        // Never let a late download overwrite the forced-AIXS five-column mode.
        if(area.dataset.ocColumns!=='s')showImage(media,true);
      };
      if(typeof probe.decode==='function')probe.decode().then(ready,ready);
      else ready();
    };
    probe.onerror=()=>{pending.delete(media);failed.add(media)};
    probe.src=media.dataset.ocAimUrl;
  };
  const observer=typeof IntersectionObserver==='function'?new IntersectionObserver(entries=>{
    if(area.dataset.ocColumns==='s')return;
    for(const entry of entries){
      if(!entry.isIntersecting)continue;
      observer.unobserve(entry.target);
      const row=richCards.find(v=>v.card===entry.target);
      if(row)fetchAim(row);
    }
  },{rootMargin:'100px 0px'}):null;
  // Compatibility fallback: still restrict requests to cards near the viewport.
  const loadVisible=()=>{
    if(observer||area.dataset.ocColumns==='s')return;
    for(const row of richCards){
      if(row.card.hidden)continue;
      const r=row.card.getBoundingClientRect();
      if(r.bottom>=-100&&r.top<=window.innerHeight+100&&r.right>=0&&r.left<=window.innerWidth)fetchAim(row);
    }
  };
  if(!observer&&richCards.length){
    window.addEventListener('scroll',loadVisible,{passive:true,capture:true});
    window.addEventListener('resize',loadVisible);
  }
   const setColumns=(size,persist)=>{
     if(!['s','m','l'].includes(size))return;
     area.dataset.ocColumns=size;
     area.querySelectorAll('[data-oc-size]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.ocSize===size)));
    if(size==='s'){
      for(const row of richCards){
        if(observer)observer.unobserve(row.card);
        showImage(row.media,false);
      }
    }else{
      for(const row of richCards){
        if(loaded.has(row.media))showImage(row.media,true);
        else if(observer&&!failed.has(row.media))observer.observe(row.card);
      }
      loadVisible();
    }
     if(persist){try{localStorage.setItem(columnsKey,size)}catch(_e){}}
   };
   setColumns(selectedSize,false);
   area.querySelectorAll('[data-oc-size]').forEach(button=>button.addEventListener('click',()=>setColumns(button.dataset.ocSize,true)));
   area.querySelectorAll('[data-oc-sort]').forEach(button=>button.addEventListener('click',()=>{
     const mode=button.dataset.ocSort;
     if(!['name-asc','name-desc','stars-desc','stars-asc'].includes(mode))return;
     // The publisher already orders cards by effective Rank > Effect > Frame
     // > META peak stars > META group > child name. Reuse that exact order
     // rather than recomputing it differently in the browser.
     const ordered=mode==='stars-desc'?original.slice():
       mode==='stars-asc'?original.slice().reverse():
       original.slice().sort((a,b)=>{
         const order=collator.compare(a.dataset.sortName||'',b.dataset.sortName||'');
         return (mode==='name-desc'?-order:order)||stable.get(a)-stable.get(b);
       });
     for(const card of ordered)grid.appendChild(card);
     area.querySelectorAll('[data-oc-sort]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
   }));
 });
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
(()=>{document.querySelectorAll('.oc-art.oc-decorated:not(.oc-flip-face)').forEach(card=>{let drag=null,start=null,moved=false;const reset=()=>{drag=null;start=null;card.classList.remove('oc-pressed');card.style.removeProperty('--tilt-x');card.style.removeProperty('--tilt-y')};const playing=()=>!!card.querySelector('.y1-animated-video');const sync=()=>{const active=playing();if(card.classList.contains('oc-video-active')!==active)card.classList.toggle('oc-video-active',active);if(active&&(drag!==null||card.classList.contains('oc-pressed')))reset()};new MutationObserver(sync).observe(card,{childList:true,subtree:true,attributes:true,attributeFilter:['hidden','class']});card.addEventListener('play',sync,true);card.addEventListener('pause',sync,true);card.addEventListener('ended',sync,true);card.addEventListener('pointerdown',ev=>{if(playing()||ev.button!==0||!ev.isPrimary||ev.target.closest('button,video'))return;drag=ev.pointerId;start={x:ev.clientX,y:ev.clientY};moved=false;card.setPointerCapture(ev.pointerId);card.classList.add('oc-pressed')});card.addEventListener('pointermove',ev=>{if(drag!==ev.pointerId||playing())return;if(start&&Math.hypot(ev.clientX-start.x,ev.clientY-start.y)>5)moved=true;const r=card.getBoundingClientRect(),x=Math.max(0,Math.min(1,(ev.clientX-r.left)/r.width)),y=Math.max(0,Math.min(1,(ev.clientY-r.top)/r.height));card.style.setProperty('--tilt-x',((.5-y)*14)+'deg');card.style.setProperty('--tilt-y',((x-.5)*14)+'deg');card.style.setProperty('--shine-x',(x*100)+'%');card.style.setProperty('--shine-y',(y*100)+'%')});['pointerup','pointercancel','lostpointercapture'].forEach(k=>card.addEventListener(k,reset));card.addEventListener('click',ev=>{if(moved&&ev.detail!==0){ev.preventDefault();ev.stopImmediatePropagation();moved=false}},true);sync()})})();

// GET-only double-sided card. The card's front retains the existing video plugin.
(()=>{
 const scene=document.querySelector?.('[data-oc-flip]');
 if(!scene)return;
 const buttons=[...document.querySelectorAll('.oc-flip-tab[data-oc-face]')];
 const front=scene.querySelector('.oc-flip-front');
 let gesture=null,suppressNextClick=false;
 const playing=()=>!!front?.querySelector('.y1-animated-video');
 const resetTilt=()=>{
   gesture=null;scene.classList.remove('oc-pressed');
   scene.style.removeProperty('--tilt-x');scene.style.removeProperty('--tilt-y');
 };
 const syncVideo=()=>{
   const active=playing();scene.classList.toggle('oc-video-active',active);
   if(active)resetTilt();
 };
 const setFace=face=>{
   if(face!== 'full'&&face!=='focus')return;
   if(face==='focus'&&playing()){
     // Let the original plugin cleanly stop and unload its video.
     front.querySelector('.y1-animation-toggle')?.click();
   }
   resetTilt();
   scene.dataset.face=face;
   for(const b of buttons)b.setAttribute('aria-pressed',String(b.dataset.ocFace===face));
   syncVideo();
 };
 for(const b of buttons)b.addEventListener('click',()=>setFace(b.dataset.ocFace));
 const paint=ev=>{
   const r=scene.getBoundingClientRect();
   if(!r.width||!r.height)return;
   const x=Math.max(0,Math.min(1,(ev.clientX-r.left)/r.width));
   const y=Math.max(0,Math.min(1,(ev.clientY-r.top)/r.height));
   scene.style.setProperty('--tilt-x',((.5-y)*12)+'deg');
   scene.style.setProperty('--tilt-y',((x-.5)*12)+'deg');
   scene.querySelectorAll('.oc-flip-face').forEach(face=>{
     face.style.setProperty('--shine-x',(x*100)+'%');
     face.style.setProperty('--shine-y',(y*100)+'%');
   });
 };
 scene.addEventListener('pointerdown',ev=>{
   if(!ev.isPrimary||ev.button!==0||ev.target.closest('button,video'))return;
   suppressNextClick=false;
   gesture={id:ev.pointerId,x:ev.clientX,y:ev.clientY,dx:0,dy:0};
   scene.setPointerCapture(ev.pointerId);
   scene.classList.add('oc-pressed');
   if(!playing())paint(ev);
 });
 scene.addEventListener('pointermove',ev=>{
   if(!gesture||gesture.id!==ev.pointerId)return;
   gesture.dx=ev.clientX-gesture.x;gesture.dy=ev.clientY-gesture.y;
   if(!playing())paint(ev);
 });
 scene.addEventListener('pointerup',ev=>{
   if(!gesture||gesture.id!==ev.pointerId)return;
   const dx=ev.clientX-gesture.x,dy=ev.clientY-gesture.y;
   const flip=Math.abs(dx)>=55&&Math.abs(dx)>Math.abs(dy)*1.3;
   // Any real drag is a card interaction, never a video click.
   suppressNextClick=Math.hypot(dx,dy)>6;
   resetTilt();
   if(flip)setFace(scene.dataset.face==='focus'?'full':'focus');
 });
 for(const name of ['pointercancel','lostpointercapture'])scene.addEventListener(name,resetTilt);
 // Pointer capture targets the scene, not always the front image. Route a
 // deliberate click to the original OC video plugin (without duplicating it).
 // The plugin retains ownership of loading, stopping and unloading the video.
 scene.addEventListener('click',ev=>{
   if(ev.target.closest('button'))return; // FULL/FOCUS and video icon work independently.
   if(suppressNextClick){
     ev.preventDefault();ev.stopImmediatePropagation();suppressNextClick=false;
     return;
   }
   if(scene.dataset.face!=='full')return;
   const toggle=front?.querySelector('.y1-animation-toggle');
   if(!toggle)return;
   ev.preventDefault();ev.stopImmediatePropagation();
   toggle.click();
 },true);
 new MutationObserver(syncVideo).observe(front,{childList:true,subtree:true});
 syncVideo();
})();

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

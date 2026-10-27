'use strict';
(()=>{
 const filter=key=>{document.querySelectorAll('[data-meta]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.meta===key)));document.querySelectorAll('[data-character-meta]').forEach(c=>c.hidden=!!key&&c.dataset.characterMeta!==key);document.querySelectorAll('[data-banner]').forEach(b=>{b.hidden=b.dataset.banner!==key;if(!b.hidden&&!b.src)b.src=b.dataset.src})};
 const initial=new URLSearchParams(location.search).get('oc')||'';
 filter([...document.querySelectorAll('[data-meta]')].some(b=>b.dataset.meta===initial)?initial:'');
 document.querySelectorAll('[data-meta]').forEach(b=>b.addEventListener('click',()=>{filter(b.dataset.meta);if(!document.getElementById('oc-collection-dialog')){const url=new URL(location.href);if(b.dataset.meta)url.searchParams.set('oc',b.dataset.meta);else url.searchParams.delete('oc');history.replaceState(null,'',url)}}));
 const dialog=document.getElementById('oc-collection-dialog');
 if(dialog){const open=document.getElementById('oc-open-collection');open.addEventListener('click',()=>dialog.showModal());document.getElementById('oc-close-collection').addEventListener('click',()=>dialog.close());dialog.addEventListener('close',()=>open.focus())}
})();

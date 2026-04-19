const ICONS = {'Ambulance':'🚑','Police Unit':'🚔','Fire Brigade':'🚒','Disaster Response':'⛑️','Traffic Police':'🚦','Coast Guard':'⚓'};

function getRecords(){ return JSON.parse(localStorage.getItem('dispatchRecords')||'[]'); }
function saveRecords(r){ localStorage.setItem('dispatchRecords', JSON.stringify(r)); }

function tick(){
  const t = new Date().toLocaleString('en-IN',{weekday:'short',day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false});
  document.getElementById('clock1').textContent = t;
  document.getElementById('clock2').textContent = t;
}
tick(); setInterval(tick,1000);

function updateBadges(){
  const n = getRecords().length;
  document.getElementById('rec-count-badge').textContent = n;
  document.getElementById('rec-count-badge2').textContent = n;
}

// ═══ PAGE SWITCHING ═══
function showPage(id){
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  window.scrollTo(0,0);
  if(id==='pg-records'){ renderStats(); renderRecs(); }
  updateBadges();
  // Update nav buttons on both headers
  document.querySelectorAll('.nav-btn').forEach(b=>{
    b.classList.remove('active');
    if((id==='pg-form' && b.textContent.includes('New Dispatch')) ||
       (id==='pg-records' && b.textContent.includes('Records'))) b.classList.add('active');
  });
}

// ═══ FORM STATE ═══
let sev='high', units=new Set(['Ambulance']);
const etaMap={high:[5,10],medium:[10,20],low:[20,35]};

function setSev(btn){
  document.querySelectorAll('.sev-btn').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active'); sev=btn.dataset.level; calcETA();
}

function toggleUnit(card){
  const u=card.dataset.unit;
  units.has(u)?(units.delete(u),card.classList.remove('selected')):(units.add(u),card.classList.add('selected'));
  renderPreview();
  document.getElementById('unit-err').style.display='none';
}

function renderPreview(){
  const el=document.getElementById('uprev');
  if(!units.size){el.innerHTML='<span style="font-size:12px;color:var(--muted)">No units selected</span>';return;}
  el.innerHTML=[...units].map(u=>`<span class="ptag">${ICONS[u]||''}${u}</span>`).join('');
}

function calcETA(){
  const [mn,mx]=etaMap[sev];
  const v=Math.floor(Math.random()*(mx-mn+1))+mn;
  document.getElementById('eta-val').textContent=v+' min';
  document.getElementById('eta-sub').textContent=({high:'Critical',medium:'Moderate',low:'Standard'})[sev]+' priority response';
  return v;
}
calcETA();

// Set form reference
function setFormRef(){ document.getElementById('form-ref').textContent='IDF-'+Math.random().toString(36).substring(2,7).toUpperCase(); }
setFormRef();

// ═══ VALIDATION ═══
function validate(){
  let ok=true;
  [['v-name','fg-name',v=>v.trim().length>0],
   ['v-age','fg-age',v=>v&&+v>=0&&+v<=120],
   ['v-gender','fg-gender',v=>v!==''],
   ['v-loc','fg-loc',v=>v.trim().length>0],
   ['v-prob','fg-prob',v=>v.trim().length>0]
  ].forEach(([id,fgId,test])=>{
    const fg=document.getElementById(fgId),val=document.getElementById(id).value;
    test(val)?fg.classList.remove('invalid'):(fg.classList.add('invalid'),ok=false);
  });
  if(!units.size){document.getElementById('unit-err').style.display='block';ok=false;}
  return ok;
}

// ═══ DISPATCH ═══
function doDispatch(){
  if(!validate()){
    document.querySelector('.fg.invalid, #unit-err[style*="block"]')?.scrollIntoView({behavior:'smooth',block:'center'});
    return;
  }
  const btn=document.getElementById('disp-btn');
  btn.disabled=true; btn.innerHTML='<span style="font-size:16px">⏳</span> Processing Dispatch…';

  const name    =document.getElementById('v-name').value.trim();
  const age     =document.getElementById('v-age').value;
  const gender  =document.getElementById('v-gender').value;
  const loc     =document.getElementById('v-loc').value.trim();
  const prob    =document.getElementById('v-prob').value.trim();
  const contact =document.getElementById('v-contact').value.trim();
  const notes   =document.getElementById('v-notes').value.trim();
  const eta     =calcETA();
  const incId   ='INC-'+Date.now().toString(36).toUpperCase();
  const ts      =new Date().toISOString();

  // Save
  const rec={id:incId,name,age,gender,location:loc,problem:prob,contact,notes,severity:sev,units:[...units],eta,timestamp:ts,status:'Active'};
  const all=getRecords(); all.unshift(rec); saveRecords(all);
  updateBadges();

  // Populate modal
  document.getElementById('fm-incid').textContent=incId;
  const sc={high:'ph',medium:'pm',low:'pl'}[sev];
  const sl={high:'Critical',medium:'Moderate',low:'Low'}[sev];
  const unitsStr=[...units].map(u=>(ICONS[u]||'')+' '+u).join(' · ');
  const rows=[['Victim',`${name}, ${age} yrs, ${gender}`],['Location',loc],['Emergency',prob],
    ['Severity',`<span class="pill ${sc}">${sl}</span>`],['Units',unitsStr],
    ['Est. ETA',`<strong style="color:var(--amber)">${eta} min</strong>`],
    ['Timestamp',new Date(ts).toLocaleString('en-IN',{hour12:false})],
    ...(notes?[['Remarks',notes]]:[])];
  document.getElementById('fm-tbl').innerHTML=rows.map(([k,v])=>`<tr><td>${k}</td><td>${v}</td></tr>`).join('');

  setTimeout(()=>document.getElementById('form-modal').classList.add('active'),320);
}

function closeFormModal(){
  document.getElementById('form-modal').classList.remove('active');
  // Reset form
  ['v-name','v-age','v-loc','v-prob','v-contact','v-notes'].forEach(id=>document.getElementById(id).value='');
  document.getElementById('v-gender').value='';
  document.querySelectorAll('.sev-btn').forEach(b=>{b.classList.remove('active');if(b.dataset.level==='high')b.classList.add('active');});
  sev='high';
  units=new Set(['Ambulance']);
  document.querySelectorAll('.unit-card').forEach(c=>{c.classList.remove('selected');if(c.dataset.unit==='Ambulance')c.classList.add('selected');});
  document.querySelectorAll('.fg').forEach(fg=>fg.classList.remove('invalid'));
  document.getElementById('unit-err').style.display='none';
  renderPreview(); calcETA(); setFormRef();
  const btn=document.getElementById('disp-btn');
  btn.disabled=false; btn.innerHTML='<span style="font-size:16px">🚨</span> Authorise &amp; Send Dispatch';
}

document.getElementById('form-modal').addEventListener('click',e=>{if(e.target===e.currentTarget)closeFormModal();});

// ═══ SEED DEMO DATA ═══
function seedDemo(){
  if(getRecords().length>0)return;
  const demo=[
    {id:'INC-LX7K2M',name:'Rajesh Sharma',age:'45',gender:'Male',location:'Freeganj, Ujjain, MP',problem:'Cardiac arrest — patient unconscious, breathing irregular',contact:'9876543210',notes:'Fourth floor, lift not working',severity:'high',units:['Ambulance','Police Unit'],eta:7,timestamp:new Date(Date.now()-7200000).toISOString(),status:'Active'},
    {id:'INC-MN3P9Q',name:'Priya Verma',age:'28',gender:'Female',location:'Mahakal Mandir Road, Ujjain',problem:'Road accident — 2 vehicles, multiple casualties',contact:'',notes:'Blocking main road',severity:'high',units:['Ambulance','Fire Brigade','Traffic Police'],eta:6,timestamp:new Date(Date.now()-18000000).toISOString(),status:'Resolved'},
    {id:'INC-RT8W4Z',name:'Anil Patel',age:'60',gender:'Male',location:'Scheme 54, Indore Road',problem:'House fire — smoke visible, residents trapped',contact:'8765432109',notes:'LPG cylinder inside',severity:'high',units:['Fire Brigade','Ambulance'],eta:9,timestamp:new Date(Date.now()-28800000).toISOString(),status:'Resolved'},
    {id:'INC-ZQ2B5V',name:'Sunita Rao',age:'35',gender:'Female',location:'Chardham Naka, Ujjain',problem:'Domestic violence — victim injured',contact:'',notes:'',severity:'medium',units:['Police Unit'],eta:12,timestamp:new Date(Date.now()-86400000).toISOString(),status:'Resolved'},
    {id:'INC-CK6H1N',name:'Mohan Das',age:'72',gender:'Male',location:'Tower Chowk, Ujjain',problem:'Fell on street — possible fracture, elderly',contact:'7654321098',notes:'Diabetic patient',severity:'medium',units:['Ambulance'],eta:15,timestamp:new Date(Date.now()-129600000).toISOString(),status:'Resolved'},
    {id:'INC-PF4J7Y',name:'Unknown',age:'—',gender:'Prefer not to say',location:'Kshipra Ghat No. 3, Ujjain',problem:'Person struggling in water',contact:'',notes:'Reported by bystander',severity:'high',units:['Coast Guard','Ambulance'],eta:8,timestamp:new Date(Date.now()-172800000).toISOString(),status:'Cancelled'},
  ];
  saveRecords(demo);
}
seedDemo();
updateBadges();

// ═══ RECORDS ═══
let sortKey='timestamp', sortDir=-1, page=1;
const PER=10;
let activeStatusId=null;

function renderStats(){
  const r=getRecords();
  document.getElementById('st-total').textContent=r.length;
  document.getElementById('st-crit').textContent=r.filter(x=>x.severity==='high').length;
  document.getElementById('st-mod').textContent=r.filter(x=>x.severity==='medium').length;
  document.getElementById('st-low').textContent=r.filter(x=>x.severity==='low').length;
}

function getFiltered(){
  const q=document.getElementById('srch').value.toLowerCase();
  const fs=document.getElementById('f-sev').value;
  const fst=document.getElementById('f-st').value;
  const fu=document.getElementById('f-unit').value;
  let r=getRecords();
  if(q) r=r.filter(x=>x.id.toLowerCase().includes(q)||x.name.toLowerCase().includes(q)||x.location.toLowerCase().includes(q)||(x.problem||'').toLowerCase().includes(q));
  if(fs) r=r.filter(x=>x.severity===fs);
  if(fst) r=r.filter(x=>x.status===fst);
  if(fu) r=r.filter(x=>x.units&&x.units.includes(fu));
  r.sort((a,b)=>{
    let av=a[sortKey],bv=b[sortKey];
    if(sortKey==='eta'){av=+av;bv=+bv;}
    if(sortKey==='timestamp'){av=new Date(av);bv=new Date(bv);}
    if(av<bv)return-1*sortDir; if(av>bv)return 1*sortDir; return 0;
  });
  return r;
}

function sortBy(key){
  sortKey===key?sortDir*=-1:(sortKey=key,sortDir=-1);
  document.querySelectorAll('.si2').forEach(e=>e.textContent='↕');
  const el=document.getElementById('s-'+key);
  if(el){el.textContent=sortDir===-1?'↓':'↑'; el.closest('th').classList.add('sorted');}
  document.querySelectorAll('thead th').forEach(th=>{if(!th.querySelector('#s-'+key))th.classList.remove('sorted');});
  page=1; renderRecs();
}

function renderRecs(){
  const filtered=getFiltered();
  const total=filtered.length;
  const totalPages=Math.max(1,Math.ceil(total/PER));
  if(page>totalPages)page=totalPages;
  const slice=filtered.slice((page-1)*PER,page*PER);
  document.getElementById('cbadge').textContent=total+' record'+(total!==1?'s':'');
  const tbody=document.getElementById('rec-body');
  const empty=document.getElementById('rec-empty');
  const pag=document.getElementById('pag');

  if(!total){tbody.innerHTML='';empty.style.display='';pag.innerHTML='';return;}
  empty.style.display='none';

  tbody.innerHTML=slice.map(r=>{
    const sc={high:'ph',medium:'pm',low:'pl'}[r.severity]||'pl';
    const sl={high:'Critical',medium:'Moderate',low:'Low'}[r.severity]||r.severity;
    const stc={'Active':'s-act','Resolved':'s-res','Cancelled':'s-can'}[r.status]||'s-act';
    const ts=new Date(r.timestamp).toLocaleString('en-IN',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit',hour12:false});
    const utags=(r.units||[]).map(u=>`<span class="utag">${ICONS[u]||''}${u}</span>`).join('');
    return`<tr>
      <td class="td-id">${r.id}</td>
      <td><div class="td-name">${r.name}</div><div class="td-sub">${r.age!=='—'?r.age+' yrs':'—'} · ${r.gender}</div></td>
      <td class="td-loc" title="${r.location}">${r.location}</td>
      <td><span class="pill ${sc}">${sl}</span></td>
      <td><div class="units-cell">${utags||'<span style="color:var(--muted);font-size:11px">—</span>'}</div></td>
      <td class="eta-c">${r.eta} min</td>
      <td><div class="sd"><span class="spill ${stc}" onclick="openSM(event,'${r.id}')"><span class="sdot"></span>${r.status}</span></div></td>
      <td style="font-size:12px;color:var(--text2);white-space:nowrap">${ts}</td>
      <td><div class="racts">
        <button class="ibtn" title="View Details" onclick="openDM('${r.id}')">👁</button>
        <button class="ibtn del" title="Delete" onclick="deleteRec('${r.id}')">🗑</button>
      </div></td>
    </tr>`;
  }).join('');

  pag.innerHTML=`
    <div class="pag-info">Showing ${(page-1)*PER+1}–${Math.min(page*PER,total)} of ${total}</div>
    <div class="pag-btns">
      <button class="pb" onclick="goPage(${page-1})" ${page===1?'disabled':''}>‹</button>
      ${Array.from({length:totalPages},(_,i)=>`<button class="pb ${i+1===page?'active':''}" onclick="goPage(${i+1})">${i+1}</button>`).join('')}
      <button class="pb" onclick="goPage(${page+1})" ${page===totalPages?'disabled':''}>›</button>
    </div>`;
}

function goPage(p){page=p;renderRecs();}

// STATUS MENU
function openSM(e,id){
  e.stopPropagation();
  activeStatusId=id;
  const menu=document.getElementById('status-menu');
  const rect=e.currentTarget.getBoundingClientRect();
  menu.style.top=(rect.bottom+window.scrollY+4)+'px';
  menu.style.left=rect.left+'px';
  menu.classList.add('open');
}
function setStatus(status){
  const recs=getRecords(), rec=recs.find(r=>r.id===activeStatusId);
  if(rec){rec.status=status;saveRecords(recs);}
  document.getElementById('status-menu').classList.remove('open');
  activeStatusId=null;
  renderStats(); renderRecs(); updateBadges();
}
document.addEventListener('click',()=>document.getElementById('status-menu').classList.remove('open'));

// DETAIL MODAL
function openDM(id){
  const r=getRecords().find(x=>x.id===id); if(!r)return;
  document.getElementById('dm-title').textContent=r.id;
  document.getElementById('dm-sub').textContent=new Date(r.timestamp).toLocaleString('en-IN',{weekday:'long',day:'2-digit',month:'long',year:'numeric',hour:'2-digit',minute:'2-digit',hour12:false});
  const sc={high:'ph',medium:'pm',low:'pl'}[r.severity];
  const sl={high:'Critical',medium:'Moderate',low:'Low'}[r.severity];
  const stc={'Active':'s-act','Resolved':'s-res','Cancelled':'s-can'}[r.status]||'s-act';
  const utags=(r.units||[]).map(u=>`<span class="utag">${ICONS[u]||''}${u}</span>`).join(' ');
  document.getElementById('dm-grid').innerHTML=`
    <div class="dg-f"><div class="dg-l">Victim Name</div><div class="dg-v">${r.name}</div></div>
    <div class="dg-f"><div class="dg-l">Age / Gender</div><div class="dg-v">${r.age!=='—'?r.age+' yrs':'—'} · ${r.gender}</div></div>
    <div class="dg-f dg-full"><div class="dg-l">Incident Location</div><div class="dg-v">${r.location}</div></div>
    <div class="dg-f dg-full"><div class="dg-l">Nature of Emergency</div><div class="dg-v">${r.problem}</div></div>
    <div class="dg-f"><div class="dg-l">Severity</div><div class="dg-v"><span class="pill ${sc}">${sl}</span></div></div>
    <div class="dg-f"><div class="dg-l">Status</div><div class="dg-v"><span class="spill ${stc}"><span class="sdot"></span>${r.status}</span></div></div>
    <div class="dg-f dg-full"><div class="dg-l">Dispatched Units</div><div class="dg-v" style="display:flex;flex-wrap:wrap;gap:5px;margin-top:2px">${utags}</div></div>
    <div class="dg-f"><div class="dg-l">Estimated Arrival</div><div class="dg-v" style="color:var(--amber);font-family:var(--mono);font-weight:600">${r.eta} minutes</div></div>
    <div class="dg-f"><div class="dg-l">Contact Number</div><div class="dg-v">${r.contact||'—'}</div></div>
    ${r.notes?`<div class="dg-f dg-full"><div class="dg-l">Dispatcher Remarks</div><div class="dg-v">${r.notes}</div></div>`:''}
  `;
  document.getElementById('dm-ov').classList.add('active');
}
function closeDM(){document.getElementById('dm-ov').classList.remove('active');}
document.getElementById('dm-ov').addEventListener('click',e=>{if(e.target===e.currentTarget)closeDM();});

// DELETE
function deleteRec(id){
  saveRecords(getRecords().filter(r=>r.id!==id));
  renderStats(); renderRecs(); updateBadges();
}

// CLEAR ALL
function openConfirmClear(){document.getElementById('conf-ov').classList.add('active');}
function closeConf(){document.getElementById('conf-ov').classList.remove('active');}
function clearAll(){localStorage.removeItem('dispatchRecords');closeConf();renderStats();renderRecs();updateBadges();}

// CSV EXPORT
function exportCSV(){
  const r=getFiltered();
  if(!r.length){alert('No records to export.');return;}
  const h=['Incident ID','Name','Age','Gender','Location','Emergency','Severity','Units','ETA(min)','Status','Contact','Remarks','Timestamp'];
  const rows=r.map(x=>[x.id,x.name,x.age,x.gender,x.location,`"${(x.problem||'').replace(/"/g,'""')}"`,x.severity,(x.units||[]).join('; '),x.eta,x.status,x.contact||'',`"${(x.notes||'').replace(/"/g,'""')}"`,new Date(x.timestamp).toLocaleString('en-IN',{hour12:false})]);
  const csv=[h,...rows].map(r=>r.join(',')).join('\n');
  const a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv'})); a.download='dispatch-records-'+new Date().toISOString().slice(0,10)+'.csv'; a.click();
}
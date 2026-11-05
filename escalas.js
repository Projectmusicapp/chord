// ===== PANTALLA: ESCALAS (personas, equipos por día, modo edición) =====
import {$,esc,guardar,crear,escuchar,eliminar,vistas,ic,modal} from "./base.js";

const st=document.createElement('style');
st.textContent=`[data-vista=escalas] .c2{margin-bottom:22px}
.pgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:10px}
.per{display:flex;align-items:center;gap:12px;background:var(--capa);border-radius:var(--r-m);padding:10px 12px}.per small{display:block;color:var(--gris);font-weight:500}
.av{width:40px;height:40px;border-radius:50%;background:var(--azul);color:#fff;display:grid;place-items:center;font-weight:700;font-size:13.5px;flex:none}
.av.voz{background:var(--oro);color:var(--azul)}
.dia{background:var(--capa);border-radius:16px;padding:16px;margin-top:14px}
[data-vista=escalas] .dh{display:flex;align-items:center;gap:8px;margin-bottom:12px}[data-vista=escalas] .dh h3{margin:0;flex:1;font-size:20px}
.eq{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:12px}
.tm{background:var(--blanco);border-radius:var(--r-m);padding:12px;position:relative;box-shadow:var(--sombra-1)}.th{display:flex;align-items:center;gap:6px;margin-bottom:8px;min-height:32px}
.th b{font-size:15px}.th .cuenta{margin-left:auto;color:var(--gris);font-size:12.5px;font-weight:700;background:var(--capa);border-radius:999px;padding:1px 9px}
.mem{width:100%;min-height:64px;background:transparent;color:var(--tx);border-radius:var(--r-s);padding:6px 8px;display:flex;flex-direction:column;align-items:stretch;justify-content:flex-start;gap:0;text-align:left;font-weight:600;border:1px solid var(--linea);cursor:pointer}
.mem:hover{filter:none;border-color:var(--linea-2);background:var(--capa)}
.mem em{color:var(--gris);font-weight:600;font-style:normal;display:flex;align-items:center;gap:6px;margin:auto;padding:10px 0}
[data-vista=escalas] .mrow{display:grid;grid-template-columns:1fr auto;width:100%;gap:12px;align-items:center;padding:6px 2px;border-bottom:1px solid var(--linea)}
[data-vista=escalas] .mrow:last-child{border-bottom:0}
[data-vista=escalas] .mrow small{color:var(--gris);font-weight:500;text-align:right;font-size:12.5px}
.pop{position:absolute;left:8px;right:8px;top:100%;z-index:6;background:var(--blanco);border:1px solid var(--linea);border-radius:var(--r-m);box-shadow:var(--sombra-2);padding:8px;display:grid;gap:2px;max-height:300px;overflow:auto;margin-top:-6px}
.pop label{display:flex;gap:10px;align-items:center;padding:8px;border-radius:var(--r-s);cursor:pointer}.pop label:hover{background:var(--capa)}.pop small{color:var(--gris);margin-left:auto}
.fp{display:flex;gap:6px;flex-wrap:wrap;background:var(--capa);padding:8px;border-radius:var(--r-m);margin-bottom:8px}
.fp input{flex:1;min-width:110px}
.fp button{flex:none}
.pbar{flex:1;display:flex;align-items:center;justify-content:space-between;gap:8px;min-height:40px;margin-right:10px;padding:8px 14px;background:var(--capa);color:var(--azul);border-radius:var(--r-m);text-align:left}
.pbar:hover{filter:none;background:var(--suave)}
.pbar .pt{font-size:20px;font-weight:800}.pbar .pt small{font-size:13px;font-weight:700;color:var(--gris);margin-left:6px}
.pbar svg{flex:none;transition:transform .2s}.pbar[aria-expanded=false] svg{transform:rotate(-90deg)}
.pop .bq{width:100%;margin-bottom:4px}
.pop label[hidden],.pop .sinres[hidden]{display:none}`;
document.head.append(st);

let P=[],X=[],el=null,edit=false,abre=null,man=null,perAbierto=true,busq='',abrePrev=null;

const equipos=()=>['A','B','C','D'].map(x=>({nombre:'Equipo '+x,miembros:[]}));
const norm=t=>String(t||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();   // para buscar sin importar tildes ni mayúsculas
const ini=n=>(n||'').trim().split(/\s+/).slice(0,2).map(x=>x[0]).join('').toUpperCase();

// Ordenar personas dando prioridad a "Voz"
const ordenarPersonas=(arr)=>{
  return [...arr].sort((a,b)=>{
    const ocA=(a.ocupacion||'').trim().toLowerCase();
    const ocB=(b.ocupacion||'').trim().toLowerCase();

    const aEsVoz=ocA.includes('voz');
    const bEsVoz=ocB.includes('voz');

    if(aEsVoz && !bEsVoz) return -1;
    if(!aEsVoz && bEsVoz) return 1;

    if(ocA!==ocB) return ocA.localeCompare(ocB);
    return a.nombre.localeCompare(b.nombre);
  });
};

// Ordenar los miembros de un equipo (Voz primero)
const ordenarMiembros=(miembrosIds)=>{
  return [...miembrosIds].sort((idA,idB)=>{
    const pA=P.find(x=>x.id===idA)||{};
    const pB=P.find(x=>x.id===idB)||{};
    const ocA=(pA.ocupacion||'').trim().toLowerCase();
    const ocB=(pB.ocupacion||'').trim().toLowerCase();

    const aEsVoz=ocA.includes('voz');
    const bEsVoz=ocB.includes('voz');

    if(aEsVoz && !bEsVoz) return -1;
    if(!aEsVoz && bEsVoz) return 1;

    if(ocA!==ocB) return ocA.localeCompare(ocB);
    return (pA.nombre||'').localeCompare(pB.nombre||'');
  });
};

escuchar('personas',l=>{
  P=ordenarPersonas(l);
  pintar();
  pMan();
});

escuchar('escalas',l=>{
  X=l.sort((a,b)=>(a.orden||0)-(b.orden||0));
  if(!l.length)[['sabado','S\u00e1bado'],['domingo','Domingo']].forEach(([id,n],o)=>guardar('escalas',id,{nombre:n,orden:o,equipos:equipos()}));
  pintar();
});

vistas.escalas=e=>{el=e;edit=false;abre=null;el.onclick=clic;el.onchange=cambia;
  el.oninput=ev=>{if(ev.target.dataset.pq!=null){busq=ev.target.value;filtrar()}};
  el.onkeydown=ev=>{if(ev.key==='Escape'&&abre){const k=abre;abre=null;pintar();const b=el.querySelector(`[data-el="${k}"]`);if(b)b.focus()}};
  pintar()};
addEventListener('hashchange',()=>{if(location.hash!=='#escalas')el=null});

function pintar(){
  if(!el)return;
  if(abre!==abrePrev){busq='';abrePrev=abre}   // el buscador empieza vacío cada vez que se abre un equipo

  const popPrev=el.querySelector('.pop');
  const scrollTop=popPrev?popPrev.scrollTop:0;
  const act=document.activeElement,foco=act&&act.dataset&&act.dataset.pk?act.dataset.pk+'|'+act.value:null,focoQ=!!(act&&act.dataset&&act.dataset.pq!=null);   // casilla que tenía el cursor

  const dias=X.map(d=>`<div class="dia"><div class="dh">${edit?`<input class="inl" data-dn="${d.id}" value="${esc(d.nombre)}">`:`<h3>${esc(d.nombre)}</h3>`}`
    +(edit?`<button class="sec" data-ea="${d.id}">${ic('pls',15)} Equipo</button><button class="ic rj" data-dx="${d.id}" aria-label="Eliminar el d\u00eda ${esc(d.nombre)}" title="Eliminar d\u00eda">${ic('trs',16)}</button>`:'')+'</div><div class="eq">'
    +d.equipos.map((q,i)=>{
      const k=d.id+':'+i;
      const miembrosOrdenados=ordenarMiembros(q.miembros);
      const n=q.miembros.filter(m=>P.some(x=>x.id===m)).length;
      return `<div class="tm"><div class="th">${edit?`<input class="inl" data-en="${k}" value="${esc(q.nombre)}" aria-label="Nombre del equipo"><button class="ic rj" data-ex="${k}" aria-label="Eliminar ${esc(q.nombre)}" title="Eliminar equipo">${ic('trs',15)}</button>`:`<b>${esc(q.nombre)}</b>${n?`<span class="cuenta">${n}</span>`:''}`}</div>`
        +`<button class="mem" data-el="${k}" aria-expanded="${abre===k}" aria-label="${esc(q.nombre)} de ${esc(d.nombre)}: ${n?n+(n>1?' personas. Cambiar':' persona. Cambiar'):'elegir personas'}">${miembrosOrdenados.map(m=>{const p=P.find(x=>x.id===m);return p?`<span class="mrow"><span>${esc(p.nombre)}</span><small>${esc(p.ocupacion||'')}</small></span>`:''}).join('')||`<em>${ic('pls',15)} Elegir personas</em>`}</button>`
        +(abre===k?`<div class="pop"><input type="search" class="bq" data-pq="${k}" value="${esc(busq)}" placeholder="Escribe para buscar..." aria-label="Buscar persona" autocomplete="off">${P.map(p=>`<label data-n="${esc(norm(p.nombre+' '+(p.ocupacion||'')))}"><input type="checkbox" data-pk="${k}" value="${p.id}" ${q.miembros.includes(p.id)?'checked':''}> ${esc(p.nombre)} <small>${esc(p.ocupacion||'')}</small></label>`).join('')||'<p class="vac">Primero a\u00f1ade personas con el bot\u00f3n \u00abGestionar\u00bb.</p>'}<p class="vac sinres" hidden>Nadie coincide con la b\u00fasqueda.</p><button data-cl style="margin-top:6px;">Listo</button></div>`:'')+'</div>';
    }).join('')+'</div></div>').join('');

  // Secciones ordenadas: Personas ARRIBA, Escalas por d\u00eda ABAJO
  el.innerHTML=`<section class="c2"><div class="ch2"><h1 style="font-size:26px">Escalas</h1><div class="mb"><button class="${edit?'':'sec'}" id="ed" aria-pressed="${edit}">${edit?'Listo':ic('edt',16)+' Editar'}</button><button id="da">${ic('pls',16)} A\u00f1adir d\u00eda</button></div></div>${dias||'<p class="vac">A\u00fan no hay d\u00edas. Pulsa \u00abA\u00f1adir d\u00eda\u00bb.</p>'}</section>`
  +`<section class="c2"><div class="ch2"><button class="pbar" id="tp" aria-expanded="${perAbierto}" aria-controls="pg"><span class="pt">Personas<small>${P.length}</small></span><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg></button><button class="sec" id="gp">${ic('usr',16)} Gestionar personas</button></div>`
    +(perAbierto?`<div class="pgrid" id="pg">`+(P.map(p=>`<div class="per"><span class="av${(p.ocupacion||'').toLowerCase().includes('voz')?' voz':''}" aria-hidden="true">${esc(ini(p.nombre))}</span><div><b>${esc(p.nombre)}</b><small>${esc(p.ocupacion||'Sin ocupaci\u00f3n')}</small></div></div>`).join('')||'<p class="vac">A\u00fan no hay personas. Pulsa \u00abGestionar personas\u00bb para a\u00f1adirlas.</p>')+`</div>`:'')
    +`</section>`;

  const popNew=el.querySelector('.pop');
  if(popNew&&scrollTop)popNew.scrollTop=scrollTop;
  filtrar();
  if(focoQ){const q=el.querySelector('.pop [data-pq]');if(q){q.focus();q.setSelectionRange(999,999)}}
  if(foco){const [k,v]=foco.split('|'),c=el.querySelector(`[data-pk="${k}"][value="${v}"]`);if(c)c.focus()}
}

// Oculta a quienes no coinciden con lo escrito (sin volver a dibujar, así el cursor no se pierde)
function filtrar(){
  const q=norm(busq),p=el&&el.querySelector('.pop');if(!p)return;
  let hay=0;
  p.querySelectorAll('label[data-n]').forEach(l=>{const ok=!q||l.dataset.n.includes(q);l.hidden=!ok;if(ok)hay++});
  const s=p.querySelector('.sinres');if(s)s.hidden=hay>0||!p.querySelector('label[data-n]');
}

function clic(e){
  const t=e.target.closest('button,[data-el]');
  if(abre&&!e.target.closest('.tm')){abre=null;pintar()}
  if(!t)return;const d=t.dataset,dia=id=>X.find(x=>x.id===id);
  if(t.id==='gp')gestionar();
  else if(t.id==='tp'){perAbierto=!perAbierto;pintar()}
  else if(t.id==='ed'){edit=!edit;abre=null;pintar()}
  else if(t.id==='da'){const n=prompt('Nombre del d\u00eda (ej: Viernes)');if(n&&n.trim())crear('escalas',{nombre:n.trim(),orden:X.length,equipos:equipos()})}
  else if(d.ea){const x=dia(d.ea),n=prompt('Nombre del equipo','Equipo '+String.fromCharCode(65+x.equipos.length));if(n&&n.trim())guardar('escalas',x.id,{equipos:[...x.equipos,{nombre:n.trim(),miembros:[]}]})}
  else if(d.dx){const x=dia(d.dx);eliminar('escalas',x,'el d\u00eda "'+x.nombre+'"')}
  else if(d.ex){const [id,i]=d.ex.split(':'),x=dia(id);if(confirm('\u00bfEliminar el equipo "'+x.equipos[i].nombre+'"?'))guardar('escalas',id,{equipos:x.equipos.filter((_,k)=>k!=i)})}
  else if(d.el!=null){abre=abre===d.el?null:d.el;pintar();if(abre){const q=el.querySelector('.pop [data-pq]');if(q)q.focus()}}
  else if(d.cl!=null){abre=null;pintar()}
}

function cambia(e){
  const t=e.target,d=t.dataset,v=t.value.trim();
  if(d.dn){if(v)guardar('escalas',d.dn,{nombre:v});else pintar()}
  else if(d.en){const [id,i]=d.en.split(':'),targetDia=X.find(x=>x.id===id);if(!targetDia)return;const eq=structuredClone(targetDia.equipos);if(v){eq[i].nombre=v;guardar('escalas',id,{equipos:eq})}else pintar()}
  else if(d.pk){
    const [id,i]=d.pk.split(':'),targetDia=X.find(x=>x.id===id);
    if(!targetDia)return;
    const eq=structuredClone(targetDia.equipos);
    const m=new Set(eq[i].miembros);t.checked?m.add(t.value):m.delete(t.value);   // se parte de los que ya estaban (así no se pierde a quien el buscador oculta)
    eq[i].miembros=ordenarMiembros([...m]);
    guardar('escalas',id,{equipos:eq});
  }
}

// Mini ventana para añadir, editar y eliminar personas
function gestionar(){
  man=modal(`<div class="mh"><h2>Personas</h2><button class="ic" data-cx aria-label="Cerrar">${ic('x')}</button></div>
    <form id="fadd" class="barra" onsubmit="return false;">
      <input id="mn" placeholder="Nombre" aria-label="Nombre" required>
      <input id="mo2" placeholder="Ocupaci\u00f3n (Voz, Guitarra...)" aria-label="Ocupaci\u00f3n">
      <button id="ma" type="submit">${ic('pls',16)} A\u00f1adir</button>
    </form><div id="lp"></div>`);
  pMan();

  const addPersona=()=>{
    const n=$('#mn',man).value.trim();
    if(!n)return alert('Escribe un nombre.');
    crear('personas',{nombre:n,ocupacion:$('#mo2',man).value.trim()});
    $('#mn',man).value='';$('#mo2',man).value='';
    $('#mn',man).focus();
  };

  const form=$('#fadd',man);
  if(form)form.onsubmit=addPersona;

  man.onclick=e=>{
    const t=e.target.closest('button');if(!t)return;
    if(t.dataset.cx!=null)man.remove();
    else if(t.id==='ma')addPersona();
    else if(t.dataset.px){const p=P.find(x=>x.id===t.dataset.px);if(p)eliminar('personas',p,'a "'+p.nombre+'"')}
  };
  man.onchange=e=>{
    const t=e.target,d=t.dataset;
    if(d.pn){if(t.value.trim())guardar('personas',d.pn,{nombre:t.value.trim()});else pMan()}
    else if(d.po)guardar('personas',d.po,{ocupacion:t.value.trim()});
  };
}

function pMan(){
  if(!man||!man.isConnected)return;
  $('#lp',man).innerHTML=P.map(p=>`<div class="fp"><input data-pn="${p.id}" value="${esc(p.nombre)}" aria-label="Nombre"><input data-po="${p.id}" value="${esc(p.ocupacion||'')}" placeholder="Ocupaci\u00f3n" aria-label="Ocupaci\u00f3n"><button class="ic rj" data-px="${p.id}" aria-label="Eliminar a ${esc(p.nombre)}" title="Eliminar">${ic('trs',15)}</button></div>`).join('')||'<p class="vac">Sin personas todav\u00eda.</p>';
}
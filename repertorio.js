// ===== PANTALLA: REPERTORIO (misa y evento, vista previa y PDF) =====
import {$,esc,guardar,crear,escuchar,eliminar,vistas,ic,modal,aviso} from "./base.js";
import {MOM,MES,fechaLarga,cancion,textosDespues,esPeticiones,lineasTx,lineasTxHtml,fcss,OKC} from "./hoja.js";
import {FIJAS,PROPOR,colorOk,CT} from "./formato.js";
import {elegirEscala,textoEquipo,equipoDe,alCambiarEquipos} from "./equipos.js";

const st=document.createElement('style');
st.textContent=`[data-vista=repertorio] .rcols{display:grid;grid-template-columns:400px minmax(0,1fr);gap:24px;align-items:start}
[data-vista=repertorio] .mrow{display:flex;align-items:center;gap:6px;padding:9px 0;border-bottom:1px solid var(--linea)}
[data-vista=repertorio] .mrow:last-child{border-bottom:0}
.mn{flex:1;min-width:0;display:flex;flex-direction:column;gap:1px}.mn b{font-size:14.5px}.mn span{color:var(--azul);font-weight:600;font-size:14.5px}.mn small,.fila small{color:var(--gris);font-weight:500;font-size:12.5px}
[data-vista=repertorio] .mrow .ic{width:34px;height:34px}
.sec2{background:var(--capa);border-radius:var(--r-m);padding:12px;margin-top:12px;display:grid;gap:8px}[data-vista=repertorio] .dh{display:flex;align-items:center;gap:6px}
.seg{display:flex;background:var(--suave);border-radius:var(--r-m);padding:3px;gap:2px}.seg button{background:transparent;color:var(--azul);flex:1;min-height:34px;border-radius:9px}.seg button.on{background:var(--azul);color:#fff}
.rhead{display:grid;gap:12px;margin-bottom:6px}
.rtabs{display:flex;align-items:center;gap:8px}
.rtabs .seg{min-width:200px}
.rtabs .seg button{padding:6px 16px}
.rtabs [data-nuevo]{width:40px;padding:0}
.tipochip{display:inline-block;background:var(--suave);color:var(--azul);border-radius:999px;padding:3px 12px;font-size:13px;font-weight:700}
.azesc{display:grid;grid-template-columns:1fr auto;gap:8px;margin-top:8px}.azesc button{min-width:0}
.escmisa{margin-top:8px}
.besc{min-width:0}.besc span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.besc.elegida{background:var(--oro-claro);color:var(--azul);border:1px solid #E6CF9E}
.escsec{display:flex;align-items:center;gap:6px;font-size:13px;font-weight:700;color:var(--azul);background:var(--oro-claro);border:1px solid #E6CF9E;border-radius:999px;padding:3px 6px 3px 10px;justify-self:start;max-width:100%}
.escsec span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.escsec button{width:24px;height:24px;min-height:0;padding:0;background:transparent;color:var(--azul)}.rhead .dos{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.momentos{margin-top:8px}
.escsec button.escver{display:flex;align-items:center;gap:6px;min-width:0;width:auto;height:auto;min-height:24px;padding:0;background:transparent;color:inherit;font:inherit;border:0;text-align:left;cursor:pointer}
.escsec button.escver:hover{filter:none;text-decoration:underline}
.eqpop{position:fixed;z-index:70;width:min(280px,calc(100vw - 16px));max-height:60vh;overflow:auto;background:var(--blanco);border:1px solid var(--linea);border-radius:var(--r-l);box-shadow:var(--sombra-2);padding:12px 14px;font-size:14px;color:var(--tx)}
.eqpop h3{font-size:14px;font-weight:800;color:var(--azul);margin:0 0 8px}
.eqpop ul{list-style:none;margin:0;padding:0;display:grid;gap:6px}
.eqpop li{display:flex;justify-content:space-between;gap:10px}.eqpop li small{color:var(--gris);font-weight:600;font-size:12.5px}
.eqpop p{margin:0;color:var(--gris);font-size:13px}
[data-vista=repertorio] .mrow .ic:disabled{opacity:.35;cursor:default!important}
.rcard{text-align:left;padding:16px 50px 16px 16px;display:flex;gap:14px;align-items:center}
.rcard .cf{flex:none;min-width:54px;padding:6px 6px!important;border-radius:var(--r-m);background:var(--capa);text-align:center;padding:6px 0;line-height:1.1}
.rcard .cf b{margin:0;font-size:20px;font-family:var(--fuente-titulo);color:var(--azul)}.rcard .cf span{font-size:11.5px;font-weight:700;color:var(--gris);text-transform:capitalize}
.rcard .ri{min-width:0}.rcard .ri b{margin:0;font-size:15px}
.rcard small{display:block;color:var(--gris);margin-top:2px;font-weight:500}.rcard .ic{position:absolute;top:50%;right:10px;transform:translateY(-50%)}
.rcard .tipo{display:inline-block;background:var(--suave);color:var(--azul);border-radius:999px;padding:1px 9px;font-size:12px;font-weight:700;margin-top:4px}
.fila{display:flex;flex-direction:column;align-items:flex-start;width:100%;background:var(--capa);color:var(--tx);margin-bottom:6px;text-align:left;font-weight:600}.fila:hover{background:var(--suave);filter:none}
.lista2{max-height:50vh;overflow:auto;margin-top:10px}
.txl{display:flex;align-items:center;justify-content:space-between;gap:8px}.txl [data-tt]{flex:1;min-width:0}
.txc{display:flex;gap:2px;opacity:.55}.txed:hover .txc,.txed:focus-within .txc{opacity:1}.txc .ic{width:26px;height:26px;min-height:0;padding:0}
.txed [contenteditable]{outline:none;border-radius:4px}.txed [contenteditable]:hover{background:var(--capa)}.txed [contenteditable]:focus{background:var(--oro-claro)}
.txed .txn{min-height:1.4em;margin-bottom:14px;padding:2px 0}
[data-ph]:empty::before{content:attr(data-ph);color:var(--gris);opacity:.7;text-transform:none;letter-spacing:0;font-weight:500}
.txed .tbx{display:none;gap:6px;align-items:center;overflow-x:auto;white-space:nowrap;margin:-8px 0 12px;padding:6px 2px;scrollbar-width:thin;-webkit-overflow-scrolling:touch;border-top:1px solid var(--linea)}
.txed:focus-within .tbx{display:flex}
.tbx select{flex:none;height:32px;min-height:0;padding:3px 6px;max-width:150px}
.tbx button{flex:none;min-width:32px;height:32px;min-height:0;padding:3px 7px}
.tbx button.on{background:var(--azul);color:#fff}
.tbx button.sw{width:22px;min-width:22px;height:22px;padding:0;border-radius:50%;border:2px solid #fff;box-shadow:0 0 0 1px #9aa3bf}
.tbx .sp{flex:none;width:1px;height:22px;background:var(--linea)}
.tbx .cs{display:none;flex:none;gap:6px;align-items:center}.tbx.col .cs{display:flex}
@media(max-width:960px){[data-vista=repertorio] .rcols{grid-template-columns:minmax(0,1fr)}.hojap{padding:24px 20px;min-height:300px}}
@media print{header,#aviso,#izq,.eqpop,.noprint,.mo,.falta,.blk:has(.falta){display:none!important}main{padding:0;max-width:none}.rcols{display:block!important}.hojap{box-shadow:none;padding:0}.txed[data-vacio]{display:none!important}.txed [data-ph]:empty{display:none}.txed [contenteditable]:hover,.txed [contenteditable]:focus{background:none}
@page{size:A4;margin:14mm}*{-webkit-print-color-adjust:exact;print-color-adjust:exact}}`;
document.head.append(st);

const ico=(p,s=16)=>`<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
const SHF='<path d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5"/>';
const PRN='<path d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><path d="M6 14h12v8H6z"/>';
const EXP='<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>';
const SHR='<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4"/>';
const UP='<path d="M12 19V5M5 12l7-7 7 7"/>';
const DN='<path d="M12 5v14M19 12l-7 7-7-7"/>';
const CPY='<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>';

const fechaCorta=f=>{if(!f)return'Sin fecha';const [y,m,d]=f.split('-');return d+'/'+m+'/'+y};

let C=[],T=[],A=[],R=[],el=null,rep=null,tm=null;
let pestana='misa';try{if(localStorage.getItem('pestanaRep')==='evento')pestana='evento'}catch(e){}   // pestaña Misas | Eventos de la lista
const alb=c=>A.find(a=>a.id===c.albumId)?.nombre||'';
const titAlb=c=>`<span>${esc(c.titulo)}</span>`+(alb(c)?`<small>${esc(alb(c))}</small>`:'');
const ref=()=>{if(el)rep?pder():lista()};
alCambiarEquipos(()=>{if(el&&rep){pizq();pder()}});
escuchar('canciones',l=>{C=l;ref()});escuchar('etiquetas',l=>{T=l;ref()});escuchar('albumes',l=>{A=l});escuchar('repertorios',l=>{R=l.filter(r=>!r.miLista);ref()});   // Chigo: la lista de repertorios ya no incluye las de «Mi lista» (miLista:true)
const rand=()=>Math.random().toString(36).slice(2,8);
const sec=id=>rep.secciones.find(s=>s.id===id);
// ===== CHIGO · Etiquetas separadas en «Misas» y «Otros» (ver etiquetas.js) =====
// En las secciones de un evento solo se ofrecen las etiquetas del grupo «Otros» (grupo:'otro').
// Si una sección ya tenía elegida una etiqueta de misa antes de este cambio, se conserva para no perderla.
const etiquetasEvento=s=>T.filter(t=>t.grupo==='otro'||t.id===s.tag);
// ===== FIN CHIGO =====
const tagId=n=>T.find(t=>t.nombre.toLowerCase()===n.toLowerCase())?.id;
const candMom=id=>{const g=tagId(MOM.find(m=>m[0]===id)[1]);return g?C.filter(c=>(c.etiquetas||[]).includes(g)):[]};
const candSec=s=>s.tag?C.filter(c=>(c.etiquetas||[]).includes(s.tag)):C;
const usadas=()=>[...Object.values(rep.misa),...rep.secciones.flatMap(s=>s.canciones)];
const azar=(l,u)=>{const d=l.filter(c=>!u.includes(c.id)),b=d.length?d:l;return b.length?b[Math.floor(Math.random()*b.length)].id:null};
const guarda=()=>{clearTimeout(tm);tm=setTimeout(flush,300)};
function flush(){clearTimeout(tm);tm=null;if(rep){const {id,...d}=rep;guardar('repertorios',id,d,false)}}

vistas.repertorio=e=>{
  el=e;rep=null;el.onclick=clic;el.oninput=entra;el.onchange=entra;el.onkeydown=teclaTx;el.onpaste=pegaTx;el.onmousedown=e=>{if(e.target.closest('.fbx'))e.preventDefault()};   // los botones de formato no le quitan la selección al texto
  const a=sessionStorage.getItem('repAbrir'),f=sessionStorage.getItem('repFecha'),n=sessionStorage.getItem('repNuevo');
  sessionStorage.removeItem('repAbrir');sessionStorage.removeItem('repFecha');sessionStorage.removeItem('repNuevo');
  if(a&&R.find(x=>x.id===a))abrir(a);
  else if(n){try{const v=JSON.parse(n);nuevo(v.fecha,v.tipo,v.nombre,v.evento)}catch(err){lista()}}   // creado desde el Calendario
  else if(f)nuevo(f,pestana);else lista();
};
addEventListener('hashchange',()=>{if(location.hash!=='#repertorio'){cerrarEq();flush();el=null;rep=null}});
addEventListener('reinicio',e=>{if(e.detail==='repertorio'&&el){flush();rep=null;lista()}});

function lista(){
  el.className="";
  const cuadro=f=>{if(!f)return '<b>\u2013</b><span>Sin fecha</span>';const [y,m,d]=f.split('-').map(Number);return `<b>${d}</b><span>${MES[m-1].slice(0,3)}${y!==new Date().getFullYear()?' '+y:''}</span>`};
  const cuantas=r=>{const n=r.tipo==='evento'?(r.secciones||[]).reduce((a,x)=>a+(x.canciones||[]).length,0):Object.values(r.misa||{}).filter(Boolean).length;return n?n+(n>1?' canciones':' canci\u00f3n'):'Sin canciones'};
  el.innerHTML=`<div class="ch2"><h1>Repertorios</h1><div class="rtabs"><div class="seg" role="group" aria-label="Tipo de repertorio"><button data-pest="misa" class="${pestana==='misa'?'on':''}" aria-pressed="${pestana==='misa'}">Misas</button><button data-pest="evento" class="${pestana==='evento'?'on':''}" aria-pressed="${pestana==='evento'}">Eventos</button></div><button data-nuevo aria-label="${pestana==='evento'?'Nuevo repertorio de evento':'Nuevo repertorio de misa'}" title="${pestana==='evento'?'Nuevo repertorio de evento':'Nuevo repertorio de misa'}">${ic('pls',18)}</button></div></div><div class="grid" style="grid-template-columns:repeat(auto-fill,minmax(260px,1fr))">`
    +R.filter(r=>(r.tipo==='evento'?'evento':'misa')===pestana).sort((a,b)=>(b.fecha||'').localeCompare(a.fecha||'')).map(r=>`<div class="card rcard" data-open="${r.id}" role="button" tabindex="0"><div class="cf" aria-hidden="true">${cuadro(r.fecha)}</div><div class="ri"><b>${esc(r.nombre||'Sin nombre')}</b><small>${cuantas(r)}</small><span class="tipo">${r.tipo==='evento'?'Evento':'Misa'}</span></div><button class="ic rj" data-del="${r.id}" aria-label="Eliminar \u00ab${esc(r.nombre||'Sin nombre')}\u00bb" title="Eliminar">${ic('trs',16)}</button></div>`).join('')
    +'</div>'+(R.some(r=>(r.tipo==='evento'?'evento':'misa')===pestana)?'':`<p class="vacio">A\u00fan no hay repertorios de ${pestana==='evento'?'eventos':'misas'}. Pulsa \u00ab+\u00bb para crear el primero.</p>`);
}
// nuevo(fecha, tipo, nombre, evento): crea un repertorio. El tipo (misa o evento) queda fijo.
// Si viene de un evento del Calendario, el evento guarda el id de este repertorio.
async function nuevo(f,tipo,nombre,evento){
  const d={nombre:nombre||'Nuevo repertorio',fecha:f||'',tipo:tipo==='evento'?'evento':'misa',acordes:false,misa:{},secciones:[],textos:{},textosOrd:[]};
  const r=await crear('repertorios',d);
  if(evento)guardar('eventos',evento,{repertorioId:r.id});
  pestana=d.tipo;rep={id:r.id,...d};editor();
}
function abrir(id){rep=structuredClone(R.find(x=>x.id===id));pestana=rep.tipo==='evento'?'evento':'misa';rep.misa=rep.misa||{};rep.secciones=rep.secciones||[];rep.textos=rep.textos||{};rep.textosOrd=rep.textosOrd||[];editor()}
function editor(){
  el.className='';
  el.innerHTML=`<div class="rcols"><section class="c2" id="izq"></section><section><div class="ch2 noprint"><h2>Vista previa</h2><div class="mb"><button class="ic" data-share aria-label="Compartir" title="Compartir">${ico(SHR,18)}</button><button class="ic" data-copy aria-label="Copiar texto" title="Copiar todo el texto">${ico(CPY,18)}</button><button class="ic" data-print aria-label="Descargar PDF" title="Descargar PDF">${ico(EXP,18)}</button></div></div><div class="hojap" id="hoja"></div></section></div>`;
  pizq();pder();
}
function pizq(){
  const i=$('#izq');if(!i||!rep)return;
  const fila=([id,n])=>{const c=C.find(x=>x.id===rep.misa[id]);
    return`<div class="mrow"><div class="mn"><b>${n}</b>${c?titAlb(c):'<em class="falta">Sin canci\u00f3n</em>'}</div><button class="ic" data-pick="${id}" aria-label="Elegir canci\u00f3n para ${n}" title="Elegir">${ic('edt',15)}</button><button class="ic" data-rnd="${id}" aria-label="Canci\u00f3n al azar para ${n}" title="Al azar">${ico(SHF,15)}</button><button class="ic rj" data-rm="${id}" aria-label="Quitar canci\u00f3n de ${n}" title="Quitar"${c?'':' disabled'}>${ic('x',15)}</button></div>`};
  const secs=s=>`<div class="sec2"><div class="dh"><input class="inl" data-sn="${s.id}" value="${esc(s.nombre)}" placeholder="Nombre de la secci\u00f3n"><button class="ic" data-sesc="${s.id}" aria-label="Elegir escala de esta secci\u00f3n" title="Elegir escala">${ic('usr',15)}</button><button class="ic rj" data-sdel="${s.id}" aria-label="Eliminar secci\u00f3n">${ic('trs',15)}</button></div>
    ${textoEquipo(s.escala)?`<div class="escsec"><button class="escver" data-escver="${s.id}" aria-haspopup="dialog" title="Ver integrantes">${ic('usr',14)}<span>${esc(textoEquipo(s.escala))}</span></button><button data-sescq="${s.id}" aria-label="Quitar escala" title="Quitar escala">${ic('x',13)}</button></div>`:''}
    <label class="fl2">Opciones de canciones<select data-st="${s.id}"><option value="">Todas las canciones</option>${etiquetasEvento(s)/* Chigo */.sort((a,b)=>a.nombre.localeCompare(b.nombre,'es',{sensitivity:'base'})).map(t=>`<option value="${t.id}"${s.tag===t.id?'selected':''}>${esc(t.nombre)}</option>`).join('')}</select></label>`   // Chigo: solo etiquetas del grupo «Otros» (ver etiquetasEvento arriba)
    +s.canciones.map(id=>{const c=C.find(x=>x.id===id);return c?`<div class="mrow"><div class="mn">${titAlb(c)}</div><button class="ic rj" data-srm="${s.id}:${id}" aria-label="Quitar">${ic('x',15)}</button></div>`:''}).join('')
    +`<button class="sec" data-spick="${s.id}">${ic('pls',15)} Canci\u00f3n</button></div>`;
  i.innerHTML=`<div class="ch2"><button class="sec" data-back>${ic('lft',16)} Repertorios</button><span class="tipochip">${rep.tipo==='evento'?'Evento':'Misa'}</span></div>
    <div class="rhead"><label class="fl2">Nombre del repertorio<input id="rn" value="${esc(rep.nombre||'')}"></label>
    <label class="fl2">Fecha<input type="date" id="rf" value="${esc(rep.fecha||'')}"></label>
    <label class="chk" style="margin:2px 0"><input type="checkbox" id="ra" ${rep.acordes?'checked':''}> Mostrar acordes</label></div>`
    +(rep.tipo==='evento'?`<div class="azesc" style="grid-template-columns:1fr 1fr;margin-top:8px"><button data-sadd>${ic('pls',16)} A\u00f1adir secci\u00f3n</button><button class="sec" data-xnew>${ic('pls',16)} Texto</button></div>${rep.secciones.map(secs).join('')}`:`<div class="azesc" style="grid-template-columns:1fr 1fr auto"><button class="sec" data-alet>${ico(SHF)} Aleatorio</button><button class="sec" data-xnew>${ic('pls',16)} Texto</button><button class="sec besc${textoEquipo(rep.escala)?' elegida':''}" data-mesc title="Elegir escala para toda la misa">${ic('usr',16)}<span>Escala</span></button></div>${textoEquipo(rep.escala)?`<div class="escsec escmisa"><button class="escver" data-escver="m" aria-haspopup="dialog" title="Ver integrantes">${ic('usr',14)}<span>${esc(textoEquipo(rep.escala))}</span></button><button data-mescq aria-label="Quitar escala" title="Quitar escala">${ic('x',13)}</button></div>`:''}<div class="momentos">${MOM.map(fila).join('')}</div>`);
}
// ===================== esto se puede Borrar =====================
// Muestra el equipo elegido (escala) en la vista previa y en el PDF.
// Si no lo quieren, borra desde aquí hasta «hasta aquí» y también las dos líneas
// marcadas igual dentro de pder() (más abajo).
const stEq=document.createElement('style');
stEq.textContent=`.req{font-size:13.5px;color:var(--gris);margin:-14px 0 20px;line-height:1.45}.req b{color:var(--azul)}.blk .req{margin:0 0 8px}`;
document.head.append(stEq);
const equipoPrevia=sel=>{const e=equipoDe(sel);if(!e)return '';
  return `<div class="req"><b>${esc(e.dia)} \u00b7 ${esc(e.equipo)}</b>${e.miembros.length?': '+e.miembros.map(p=>esc(p.nombre)+(p.ocupacion?' ('+esc(p.ocupacion)+')':'')).join(', '):''}</div>`};
// ===================== hasta aquí =====================

// Ventanita con las personas de la escala elegida (se abre al tocar la escala en la columna izquierda)
let pop=null,popDe=null;
function cerrarEq(){if(pop){pop.remove();pop=null;popDe=null}}
function verEquipo(btn,sel){
  if(pop&&popDe===btn.dataset.escver){cerrarEq();return}
  cerrarEq();
  const e=equipoDe(sel);
  pop=document.createElement('div');pop.className='eqpop';pop.setAttribute('role','dialog');pop.setAttribute('aria-label','Integrantes de la escala');
  pop.innerHTML=e
    ?`<h3>${esc(e.dia)} \u00b7 ${esc(e.equipo)}</h3>`+(e.miembros.length?`<ul>${e.miembros.map(p=>`<li><span>${esc(p.nombre)}</span>${p.ocupacion?`<small>${esc(p.ocupacion)}</small>`:''}</li>`).join('')}</ul>`:'<p>Este equipo no tiene integrantes.</p>')
    :'<p>No se encontr\u00f3 esta escala.</p>';
  document.body.append(pop);popDe=btn.dataset.escver;
  const r=btn.getBoundingClientRect(),w=pop.offsetWidth,h=pop.offsetHeight;
  let y=r.bottom+6;if(y+h>innerHeight-8)y=Math.max(8,r.top-h-6);
  pop.style.left=Math.max(8,Math.min(r.left,innerWidth-w-8))+'px';pop.style.top=y+'px';
}
document.addEventListener('click',e=>{if(pop&&!pop.contains(e.target)&&!e.target.closest('[data-escver]'))cerrarEq()},true);   // tocar fuera la cierra
document.addEventListener('keydown',e=>{if(e.key==='Escape')cerrarEq()});
addEventListener('resize',cerrarEq);
addEventListener('scroll',e=>{if(pop&&!pop.contains(e.target))cerrarEq()},true);

function pder(forzar){
  const h=$('#hoja');if(!h||!rep)return;
  // Si se está escribiendo en un texto de la hoja, no se redibuja (el guardado automático lo hacía y cerraba la barra y el cursor).
  // forzar = true cuando el cambio sí hay que verlo (subir, bajar o quitar un texto, elegir canciones...).
  const ac=document.activeElement;
  if(!forzar&&ac&&ac.closest&&ac.closest('.txed')&&h.contains(ac))return;
  const hay=id=>C.find(x=>x.id===id);
  // sin = true en «Peticiones»: ahí no se muestra el álbum
  const song=(id,sin)=>{const c=hay(id);return c?cancion(c,rep.acordes,{album:sin?'':alb(c)}):''};
  // texto escrito a mano: se escribe directamente aquí (título y contenido), con flechas para moverlo y X para quitarlo. No sale al imprimir.
  const blkTx=t=>{
    const f=fcss(t.fuente),vac=!((t.titulo||'').trim()||(t.texto||'').trim());
    return `<div class="blk txed" data-id="${t.id}"${vac?' data-vacio':''}><div class="lab txl"><span data-tt="${t.id}" contenteditable="true" role="textbox" aria-label="T\u00edtulo del texto" data-ph="T\u00edtulo (ej. Salmo)">${esc(t.titulo||'')}</span><span class="txc noprint"><button class="ic" data-xup="${t.id}" aria-label="Subir texto" title="Subir">${ico(UP,14)}</button><button class="ic" data-xdn="${t.id}" aria-label="Bajar texto" title="Bajar">${ico(DN,14)}</button><button class="ic rj" data-xdel="${t.id}" aria-label="Quitar texto" title="Quitar">${ic('x',14)}</button></span></div><div class="txn" data-tx="${t.id}" contenteditable="true" role="textbox" aria-multiline="true" aria-label="Texto" data-ph="Escribe aqu\u00ed el texto que ver\u00e1n todos" style="${f?'font-family:'+esc(f)+';':''}">${(t.texto||'').trim()?lineasTxHtml(lineasTx(t)):''}</div>${barraTx(t)}</div>`;
  };
  const txm=k=>textosDespues(rep,k,true).map(blkTx).join('');
  const b=(rep.tipo==='evento'
    ?[txm('ini'),...rep.secciones.map(s=>(s.canciones.some(hay)?`<div class="blk"><div class="lab">${esc(s.nombre||'Secci\u00f3n')}</div>${equipoPrevia(s.escala)/* esto se puede Borrar … hasta aquí */}${s.canciones.map(id=>song(id,esPeticiones(s.nombre))).join('')}</div>`:'')+txm(s.id))]
    :[txm('ini'),...MOM.map(([id,n])=>(hay(rep.misa[id])?`<div class="blk"><div class="lab">${n}</div>${song(rep.misa[id],esPeticiones(n))}</div>`:'')+txm(id))]).join('')||'<div class="falta">Elige canciones en la columna de la izquierda para ver aqu\u00ed c\u00f3mo quedar\u00e1 la hoja.</div>';
  h.innerHTML=`<h1 class="rt">${esc(rep.nombre||'')}</h1><div class="rf">${esc(fechaLarga(rep.fecha))}</div>${rep.tipo!=='evento'?equipoPrevia(rep.escala):''/* esto se puede Borrar … hasta aquí */}${b}`;
}

// compartir: en el celular abre el menú de compartir del teléfono (WhatsApp, copiar enlace...).
// En la computadora abre la ventana Compartir en una pestaña nueva y copia el enlace.
async function compartir(){
  flush();                                                   // guarda los últimos cambios antes de compartir
  const url=location.origin+location.pathname+'#ver/'+rep.id,titulo=rep.nombre||'Repertorio';
  const celular=matchMedia('(pointer:coarse)').matches;
  if(celular&&navigator.share){
    try{await navigator.share({title:titulo,text:titulo+(rep.fecha?' \u00b7 '+fechaLarga(rep.fecha):''),url});return}
    catch(e){if(e&&e.name==='AbortError')return}             // el usuario cerró el menú
  }
  let copiado=false;
  try{await navigator.clipboard.writeText(url);copiado=true}catch(e){}   // se copia ANTES de abrir la pestaña (después la página ya no tiene el foco)
  window.open(url,'_blank','noopener');
  aviso(copiado?'Enlace copiado. Ya puedes pegarlo en WhatsApp o en un correo.':'Se abri\u00f3 la ventana para compartir en una pesta\u00f1a nueva.');
}

// copiar: junta el texto de todas las canciones (sin acordes) y lo copia para pegarlo en WhatsApp, etc.
// Formato de cada canción:  MOMENTO  /  Título - Álbum  /  letra
const letraPlana=c=>(c.lineas?c.lineas.map(l=>l.r.map(x=>x.t).join('')):(c.letra||'').split('\n')).join('\n').trim();
// sin = true en «Peticiones»: ahí no se copia el álbum
const bloqueTxt=(momento,id,sin)=>{
  const c=C.find(x=>x.id===id);if(!c)return '';
  const a=sin?'':alb(c);
  return (momento?momento.toUpperCase()+'\n':'')+c.titulo+(a?' - '+a:'')+'\n'+letraPlana(c);
};
// textos escritos a mano que van después de un bloque (k)
const txCopia=k=>textosDespues(rep,k).map(t=>[(t.titulo||'').trim().toUpperCase(),(t.texto||'').trim()].filter(Boolean).join('\n'));
async function copiar(){
  const partes=rep.tipo==='evento'
    ?[...txCopia('ini'),...rep.secciones.flatMap(s=>[...s.canciones.map((id,i)=>bloqueTxt(i===0?s.nombre:'',id,esPeticiones(s.nombre))),...txCopia(s.id)])]   // el nombre de la sección solo antes de su primera canción
    :[...txCopia('ini'),...MOM.flatMap(([id,n])=>[rep.misa[id]?bloqueTxt(n,rep.misa[id],esPeticiones(n)):'',...txCopia(id)])];
  const txt=partes.filter(Boolean).join('\n\n');
  if(!txt){aviso('A\u00fan no hay canciones para copiar.');return}
  try{await navigator.clipboard.writeText(txt);aviso('Texto copiado. Ya puedes pegarlo en WhatsApp o donde quieras.')}
  catch(e){aviso('No se pudo copiar el texto.')}
}

function imprimir(){
  const t=document.title;
  document.title=(rep.nombre||'Repertorio')+(rep.fecha?' '+rep.fecha:'');
  window.print();
  setTimeout(()=>document.title=t,3000);
}

function clic(e){
  const b=e.target.closest('[data-nuevo],[data-open],[data-del],[data-back],[data-print],[data-copy],[data-share],[data-pest],[data-mesc],[data-mescq],[data-escver],[data-sesc],[data-sescq],[data-alet],[data-pick],[data-rnd],[data-rm],[data-sadd],[data-sdel],[data-spick],[data-srm],[data-xnew],[data-xup],[data-xdn],[data-xdel],[data-fx]');
  if(!b)return;const d=b.dataset,ok=()=>{cerrarEq();guarda();pizq();pder(true)};
  if(d.nuevo!=null)nuevo('',pestana);
  else if(d.pest){pestana=d.pest;try{localStorage.setItem('pestanaRep',pestana)}catch(err){}lista();const t=el.querySelector(`[data-pest="${pestana}"]`);if(t)t.focus()}
  else if(d.escver)verEquipo(b,d.escver==='m'?rep.escala:sec(d.escver)?.escala);                  // ventanita con las personas de la escala
  else if(d.mesc!=null)elegirEscala(rep.escala,v=>{rep.escala=v;ok()});                          // una escala para toda la misa
  else if(d.sesc){const s=sec(d.sesc);elegirEscala(s.escala,v=>{s.escala=v;ok()})}                // una escala por sección
  else if(d.sescq){sec(d.sescq).escala=null;ok()}
  else if(d.mescq!=null){rep.escala=null;ok()}
  else if(d.del){const r=R.find(x=>x.id===d.del);eliminar('repertorios',r,'el repertorio "'+(r.nombre||'')+'"')}
  else if(d.open)abrir(d.open);
  else if(d.back!=null){cerrarEq();flush();rep=null;lista()}
  else if(d.print!=null)imprimir();
  else if(d.share!=null)compartir();
  else if(d.copy!=null)copiar();
  else if(d.alet!=null){
    if(Object.keys(rep.misa).length&&!confirm('Esto reemplaza las canciones elegidas. \u00bfContinuar?'))return;
    const nm={};MOM.forEach(([id])=>{const x=azar(candMom(id),Object.values(nm));if(x)nm[id]=x});rep.misa=nm;ok();
  }
  else if(d.pick)elegir(MOM.find(m=>m[0]===d.pick)[1],candMom(d.pick),id=>{rep.misa[d.pick]=id;ok()});
  else if(d.rnd){const id=azar(candMom(d.rnd),usadas());if(!id)return alert('No hay canciones con esa etiqueta.');rep.misa[d.rnd]=id;ok()}
  else if(d.rm){delete rep.misa[d.rm];ok()}
  else if(d.sadd!=null){rep.secciones.push({id:rand(),nombre:'',tag:'',canciones:[]});ok()}
  else if(d.sdel){const an=anclas(),prev=an[an.indexOf(d.sdel)-1]||'ini';Object.values(rep.textos||{}).forEach(t=>{if(t.despues===d.sdel)t.despues=prev});rep.secciones=rep.secciones.filter(s=>s.id!==d.sdel);ok()}   // sus textos pasan al bloque anterior
  else if(d.xnew!=null){const t=nuevoTx();ok();enfocaTx(t)}
  else if(d.xup){moverTx(d.xup,-1);ok()}
  else if(d.xdn){moverTx(d.xdn,1);ok()}
  else if(d.xdel){quitarTx(d.xdel);ok()}
  else if(d.fx==='cm'){const bar=b.closest('.tbx'),on=bar.classList.toggle('col');b.setAttribute('aria-expanded',String(on))}   // muestra u oculta los colores
  else if(d.fx){fmtTx(b.closest('.txed').dataset.id,d.fx);const bar=b.closest('.tbx');if(bar&&d.fx.startsWith('c:')){bar.classList.remove('col');const cb=bar.querySelector('[data-fx="cm"]');if(cb)cb.setAttribute('aria-expanded','false')}}   // al elegir un color se vuelven a ocultar
  else if(d.spick){const s=sec(d.spick);elegir(s.nombre||'Elegir canci\u00f3n',candSec(s),id=>{if(!s.canciones.includes(id))s.canciones.push(id);ok()})}
  else if(d.srm){const [sid,cid]=d.srm.split(':'),s=sec(sid);s.canciones=s.canciones.filter(x=>x!==cid);ok()}
}

// Textos escritos a mano (salmo, comentario...). Se escriben en la vista previa.
// rep.textos = {id:{titulo,texto,despues}}, rep.textosOrd = ids en orden. «despues» = después de qué bloque va ('ini', un momento de la misa o una sección).
const anclas=()=>['ini',...(rep.tipo==='evento'?rep.secciones.map(s=>s.id):MOM.map(m=>m[0]))];
const vivo=k=>k==='ini'||(rep.tipo==='evento'?!!(sec(k)&&sec(k).canciones.some(id=>C.find(x=>x.id===id))):!!C.find(x=>x.id===rep.misa[k]));   // ¿ese bloque se ve en la hoja?
function nuevoTx(){   // el texto nuevo aparece al final de la hoja
  const id='txt_'+rand(),vivas=anclas().filter(vivo);
  rep.textos=rep.textos||{};rep.textosOrd=rep.textosOrd||[];
  rep.textos[id]={titulo:'',texto:'',despues:vivas[vivas.length-1]||'ini'};rep.textosOrd.push(id);
  return id;
}
function moverTx(id,dir){
  const t=rep.textos[id],ord=rep.textosOrd,mismos=ord.filter(x=>rep.textos[x]&&rep.textos[x].despues===t.despues),j=mismos[mismos.indexOf(id)+dir];
  if(j){const a=ord.indexOf(id),b=ord.indexOf(j);[ord[a],ord[b]]=[ord[b],ord[a]];return}   // se cambia de lugar con el texto vecino
  const full=anclas(),ok=full.filter(vivo),i=full.indexOf(t.despues);
  const nuevo=dir<0?ok.filter(k=>full.indexOf(k)<i).pop():ok.find(k=>full.indexOf(k)>i);
  if(nuevo===undefined)return;
  t.despues=nuevo;ord.splice(ord.indexOf(id),1);
  if(dir<0)ord.push(id);else ord.unshift(id);   // al subir queda al final de los textos del bloque de arriba; al bajar, al principio de los de abajo
}
function quitarTx(id){if(rep.textos)delete rep.textos[id];rep.textosOrd=(rep.textosOrd||[]).filter(x=>x!==id)}
const enfocaTx=id=>{const i=el&&el.querySelector(`[data-tt="${id}"]`);if(i){i.focus();i.scrollIntoView({block:'center'})}};
const teclaTx=e=>{if(e.key==='Enter'&&e.target.dataset&&e.target.dataset.tt!=null){e.preventDefault();e.target.blur()}};   // el título es de una sola línea
const pegaTx=e=>{const t=e.target.closest&&e.target.closest('[data-tt],[data-tx]');if(!t)return;e.preventDefault();   // pega solo texto, sin formato
  const s=(e.clipboardData||window.clipboardData).getData('text/plain');document.execCommand('insertText',false,t.dataset.tt!=null?s.replace(/\s*\n\s*/g,' '):s)};

// ===== Formato de los textos escritos a mano (barra deslizante bajo el texto que se está escribiendo) =====
// Usa el mismo modelo que el editor de canciones: cada texto guarda sus líneas {r:[tramos {t,b,i,u,c,s}], s?} y su tipo de letra (fuente).
const TAM=16,DEFC='#1d2233',TAMS=[8,10,12,14,16,18,20,22,24,28,32,36,40,48,60],AL=['center','right','justify'],FUENTES=[...Object.keys(FIJAS),...PROPOR];
const COLORES=[...CT,...['#ff0000','#00ff00','#0000ff','#ffffff'].filter(c=>!CT.some(x=>String(x).toLowerCase()===c))];   // la paleta del editor + rojo, verde y azul puros + blanco
const barraTx=t=>{
  const cur=t.fuente||'Est\u00e1ndar (Arial)',fs=FUENTES.includes(cur)?FUENTES:[...FUENTES,cur];
  return `<div class="tbx noprint" role="toolbar" aria-label="Formato del texto"><select data-fxf title="Tipo de letra" aria-label="Tipo de letra">${fs.map(n=>`<option${n===cur?' selected':''}>${esc(n)}</option>`).join('')}</select>`
    +`<select data-fxz title="Tama\u00f1o de letra" aria-label="Tama\u00f1o de letra">${TAMS.map(n=>`<option value="${n}"${n===TAM?' selected':''}>${n}</option>`).join('')}</select><button class="sec fbx" data-fx="s-" title="Reducir tama\u00f1o" aria-label="Reducir tama\u00f1o">A\u2212</button><button class="sec fbx" data-fx="s+" title="Aumentar tama\u00f1o" aria-label="Aumentar tama\u00f1o">A+</button><span class="sp"></span>`
    +`<button class="sec fbx" data-fx="b" title="Negrita (Ctrl+B)" aria-label="Negrita"><b>B</b></button><button class="sec fbx" data-fx="i" title="Cursiva (Ctrl+I)" aria-label="Cursiva"><i style="font-family:Georgia,serif">I</i></button><button class="sec fbx" data-fx="u" title="Subrayado (Ctrl+U)" aria-label="Subrayado"><u>U</u></button><span class="sp"></span>`
    +`<button class="sec fbx" data-fx="cm" title="Color de texto" aria-label="Color de texto" aria-expanded="false"><span style="border-bottom:3px solid ${DEFC};line-height:1">A</span></button>`
    +`<span class="cs"><button class="sec fbx" data-fx="c:auto" title="Color autom\u00e1tico" aria-label="Color autom\u00e1tico">Auto</button>${COLORES.map(c=>`<button class="fbx sw" data-fx="c:${c}" style="background:${c}" title="${c}" aria-label="Color ${c}"></button>`).join('')}</span></div>`;
};
const pickF=x=>{const o={};for(const k in x)if(k!=='t'&&x[k]!=null)o[k]=x[k];return o};   // el formato de un tramo (todo menos el texto)
const aCh=l=>l.r.flatMap(x=>[...x.t].map(ch=>({ch,...pickF(x)})));                         // una línea como lista de letras, cada una con su formato
const compF=cs=>{const out=[];let ult=null,clave='';
  for(const c of cs){const {ch,...f}=c,o={};Object.keys(f).sort().forEach(k=>{if(f[k]!=null&&f[k]!==false)o[k]=f[k]});const cl=JSON.stringify(o);if(ult&&cl===clave)ult.t+=ch;else{ult={...o,t:ch};clave=cl;out.push(ult)}}
  return out};
const lineaF=(x,s,a,n)=>({r:x,...(s&&s!==TAM?{s}:{}),...(a?{a}:{}),...(n?{n}:{})});
const armarF=(l,chars)=>{const base=l.s||TAM;let z=l.s;
  if(chars.length){const sz=new Set(chars.map(c=>c.s||base));if(sz.size===1){z=[...sz][0];chars.forEach(c=>{delete c.s})}else chars.forEach(c=>{if(c.s===base)delete c.s})}
  return lineaF(compF(chars),z,l.a,l.n)};
const recortaF=ls=>{const o=[...ls];while(o.length>1&&!o[o.length-1].r.length)o.pop();return o};   // quita líneas vacías del final
// Convierte lo escrito en pantalla (un <div> por línea) en líneas con formato (igual que leerDom del editor de canciones).
const leerDomF=root=>{
  const out=[];let cur=[],L={},vivo=false,sb={};
  const fin2=()=>{out.push(lineaF(compF(cur.flatMap(x=>[...x.t].map(ch=>({ch,...pickF(x)})))),L.s,L.a,L.n));cur=[];L={...sb};vivo=false};
  const w=(n,sty,k)=>{
    if(n.nodeType===3){
      const t=n.data.replace(/\u00a0/g,' ');
      if(t){if(!L.s&&k.s)L.s=k.s;const o={...sty,t};if(k.s&&L.s&&k.s!==L.s)o.s=k.s;cur.push(o);vivo=true}
      return}
    if(n.nodeType!==1)return;
    if(n.nodeName==='BR'){fin2();return}
    const q={...sty},cs=n.style,blk=/^(DIV|P)$/.test(n.nodeName),td=cs.textDecoration+cs.textDecorationLine,fw=cs.fontWeight;
    if(/^(B|STRONG)$/.test(n.nodeName)||fw==='bold'||+fw>=600)q.b=1;else if(fw==='normal'||fw==='400')delete q.b;
    if(/^(I|EM)$/.test(n.nodeName)||cs.fontStyle==='italic')q.i=1;else if(cs.fontStyle==='normal')delete q.i;
    if(n.nodeName==='U'||/underline/.test(td))q.u=1;
    if(/^(S|STRIKE|DEL)$/.test(n.nodeName)||/line-through/.test(td))q.x=1;
    if(/none/.test(td)&&!/underline|line-through/.test(td)){delete q.u;delete q.x}
    if(OKC.test(cs.color)){if(colorOk(cs.color)===DEFC)delete q.c;else q.c=cs.color}
    const bg=cs.backgroundColor;if(bg){if(OKC.test(bg)&&!/,\s*0\)$/.test(bg))q.h=bg;else delete q.h}
    const k2=blk?{s:parseFloat(cs.fontSize)||k.s,a:AL.includes(cs.textAlign)?cs.textAlign:k.a,n:(n.dataset&&+n.dataset.n)||k.n}:{...k,s:parseFloat(cs.fontSize)||k.s};
    const sv=sb;
    if(blk){if(vivo)fin2();sb=k2;L={...k2}}
    n.childNodes.forEach(c=>w(c,q,k2));
    if(blk){if(vivo)fin2();sb=sv;L={...sb}}
  };
  w(root,{},{});
  if(vivo||!out.length)fin2();
  return out;
};
const marcaVacio=(nodo,x)=>{const w=nodo.closest('.txed');if(w)w.toggleAttribute('data-vacio',!((x.titulo||'').trim()||(x.texto||'').trim()))};
// leerTx: lee lo que hay escrito en el texto, lo guarda en el repertorio (y se guarda solo). No redibuja, así el cursor no se mueve.
function leerTx(body){
  const x=(rep.textos||{})[body.dataset.tx];if(!x)return;
  const ls=recortaF(leerDomF(body).map(l=>armarF(l,aCh(l))));
  x.texto=ls.map(l=>l.r.map(y=>y.t).join('')).join('\n');
  x.lineas=x.texto.trim()?ls:[];
  marcaVacio(body,x);guarda();
}
// La última selección hecha dentro de un texto: los botones y listas de la barra le quitan la selección al texto, y así se devuelve.
let selTx=null;
document.addEventListener('selectionchange',()=>{
  const x=getSelection();if(!x.rangeCount)return;
  const r=x.getRangeAt(0),n=r.commonAncestorContainer,e=n.nodeType===1?n:n.parentElement,b=e&&e.closest&&e.closest('[data-tx]');
  if(!b)return;selTx={id:b.dataset.tx,r:r.cloneRange()};marcaBarra(b);
});
const tamActual=()=>{const x=getSelection();if(!x.rangeCount)return TAM;const n=x.getRangeAt(0).startContainer,e=n.nodeType===1?n:n.parentElement;return e?parseFloat(getComputedStyle(e).fontSize)||TAM:TAM};
// marcaBarra: enciende B, I, U y muestra en la lista el tamaño donde está el cursor
function marcaBarra(body){
  const w=body.closest('.txed');if(!w)return;
  [['b','bold'],['i','italic'],['u','underline']].forEach(([k,c])=>{const bt=w.querySelector(`[data-fx="${k}"]`);if(!bt)return;let on=false;try{on=document.queryCommandState(c)}catch(err){}bt.classList.toggle('on',on);bt.setAttribute('aria-pressed',String(on))});
  const z=w.querySelector('[data-fxz]');
  if(z){const n=String(Math.round(tamActual()));if(![...z.options].some(o=>o.value===n))z.add(new Option(n,n));z.value=n}
}
function devuelveSel(body){
  const x=getSelection();let rg=null;
  if(x.rangeCount&&body.contains(x.getRangeAt(0).commonAncestorContainer))rg=x.getRangeAt(0).cloneRange();
  else if(selTx&&selTx.id===body.dataset.tx&&body.contains(selTx.r.commonAncestorContainer))rg=selTx.r;
  if(!rg)return false;
  if(document.activeElement!==body){body.focus({preventScroll:true});x.removeAllRanges();x.addRange(rg)}   // la lista de la barra le había quitado el cursor al texto
  return true;
}
// La línea donde está el cursor (si el texto está suelto, sin línea, se mete en una)
function lineaProp(body){
  const x=getSelection(),r=x.getRangeAt(0);let n=r.startContainer;
  if(n===body)n=body.childNodes[r.startOffset]||body.lastChild;
  if(!n){const d=document.createElement('div');d.innerHTML='<br>';body.append(d);const q=document.createRange();q.setStart(d,0);q.collapse(true);x.removeAllRanges();x.addRange(q);return d}
  while(n.parentNode&&n.parentNode!==body)n=n.parentNode;
  if(n.nodeName==='DIV')return n;
  const sn=r.startContainer,so=r.startOffset;
  let a=n,b=n;while(a.previousSibling&&a.previousSibling.nodeName!=='DIV')a=a.previousSibling;while(b.nextSibling&&b.nextSibling.nodeName!=='DIV')b=b.nextSibling;
  const d=document.createElement('div');body.insertBefore(d,a);
  for(let m=a;m;){const nx=m.nextSibling;d.append(m);if(m===b)break;m=nx}
  const q=document.createRange();q.setStart(sn,so);q.collapse(true);x.removeAllRanges();x.addRange(q);
  return d;
}
// Tamaño: con texto seleccionado cambia solo lo seleccionado; sin selección cambia la línea donde está el cursor
function aplicaTam(body,n){
  n=Math.max(6,Math.min(120,n));
  const r=getSelection().getRangeAt(0);
  if(r.collapsed){lineaProp(body).style.fontSize=n+'px';return}
  document.execCommand('styleWithCSS',false,false);document.execCommand('fontSize',false,'7');document.execCommand('styleWithCSS',false,true);
  body.querySelectorAll('font[size="7"]').forEach(f=>{
    const s=document.createElement('span');s.style.fontSize=n+'px';while(f.firstChild)s.append(f.firstChild);
    s.querySelectorAll('[style]').forEach(e=>{e.style.fontSize=''});     // los tamaños anteriores de dentro ya no valen
    f.replaceWith(s);
  });
}
// fmtTx(id, formato): b i u = negrita, cursiva, subrayado · c:#color = color (c:auto = automático) · s:N s+ s- = tamaño
function fmtTx(id,f){
  const body=el&&el.querySelector(`[data-tx="${id}"]`);if(!body||!devuelveSel(body))return;
  const [p,...q]=f.split(':'),v=q.join(':');
  document.execCommand('styleWithCSS',false,true);
  if(p==='b')document.execCommand('bold');
  else if(p==='i')document.execCommand('italic');
  else if(p==='u')document.execCommand('underline');
  else if(p==='c')document.execCommand('foreColor',false,v==='auto'||!OKC.test(v)?DEFC:v);
  else if(p==='s')aplicaTam(body,+v);
  else if(p==='s+'||p==='s-')aplicaTam(body,Math.round(tamActual())+(p==='s+'?2:-2));
  leerTx(body);marcaBarra(body);
}

function entra(e){
  const t=e.target;if(!rep)return;
  if(t.id==='rn'){rep.nombre=t.value;guarda();pder()}
  else if(t.id==='rf'){rep.fecha=t.value;guarda();pder()}
  else if(t.id==='ra'&&e.type==='change'){rep.acordes=t.checked;guarda();pder()}
  else if(t.dataset.tt!=null){const x=(rep.textos||{})[t.dataset.tt];if(!x)return;x.titulo=t.textContent.replace(/\s+/g,' ');marcaVacio(t,x);guarda()}   // título del texto (vista previa)
  else if(t.dataset.tx!=null){if(e.type!=='input')return;if(!t.innerText.trim()&&t.innerHTML)t.innerHTML='';leerTx(t)}                      // contenido del texto (se redibuja solo si queda vacío)
  else if(e.type==='change'&&t.dataset.fxf!=null){const w=t.closest('.txed'),x=(rep.textos||{})[w.dataset.id];if(!x)return;const v=t.value==='Est\u00e1ndar (Arial)'?'':t.value;x.fuente=v;const b=w.querySelector('[data-tx]');if(b)b.style.fontFamily=fcss(v);guarda()}   // tipo de letra de todo el texto
  else if(e.type==='change'&&t.dataset.fxz!=null)fmtTx(t.closest('.txed').dataset.id,'s:'+t.value)
  else if(t.dataset.sn&&e.type==='change'){const s=sec(t.dataset.sn);s.nombre=t.value.trim();const g=T.find(x=>x.nombre.toLowerCase()===s.nombre.toLowerCase());if(g&&!s.tag)s.tag=g.id;guarda();pizq();pder()}
  else if(t.dataset.st&&e.type==='change'){sec(t.dataset.st).tag=t.value;guarda()}
}

function elegir(titulo,cands,cb){
  let todas=false,q='';
  const o=modal('<div id="el2"></div>'),z=$('#el2',o);
  const p=()=>{
    const k=q.toLowerCase(),l=(todas?C:cands).filter(c=>c.titulo.toLowerCase().includes(k)).sort((a,b)=>a.titulo.localeCompare(b.titulo));
    z.innerHTML=`<div class="mh"><h2>${esc(titulo)}</h2><button class="ic" data-cx aria-label="Cerrar">${ic('x')}</button></div><input id="bq" type="search" placeholder="Buscar canci\u00f3n" aria-label="Buscar canci\u00f3n" value="${esc(q)}" style="width:100%" autocomplete="off">`
      +(cands!==C?`<label class="chk"><input type="checkbox" id="vt" ${todas?'checked':''}> Ver todas las canciones</label>`:'')
      +`<div class="lista2">${l.map(c=>`<button class="fila" data-s="${c.id}">${esc(c.titulo)}${alb(c)?`<small>${esc(alb(c))}</small>`:''}</button>`).join('')||'<p class="vac">No hay canciones para elegir.</p>'}</div>`;
  };
  p();
  o.onclick=e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.cx!=null)o.remove();else if(b.dataset.s){o.remove();cb(b.dataset.s)}};
  o.oninput=e=>{if(e.target.id==='bq'){q=e.target.value;p();const i=$('#bq',o);i.focus();i.setSelectionRange(999,999)}};
  o.onchange=e=>{if(e.target.id==='vt'){todas=e.target.checked;p()}};
}
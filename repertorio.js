// ===== PANTALLA: REPERTORIO (misa y evento, vista previa y PDF) =====
import {$,esc,guardar,crear,escuchar,eliminar,vistas,ic,modal,aviso,escucharPropio,visibleBiblioteca,puedeEditar} from "./base.js";
import {MOM,MES,fechaLarga,cancion} from "./hoja.js";
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
.rcard{text-align:left;padding:16px 50px 16px 16px;display:flex;gap:14px;align-items:center}
.rcard .cf{flex:none;min-width:54px;padding:6px 6px!important;border-radius:var(--r-m);background:var(--capa);text-align:center;padding:6px 0;line-height:1.1}
.rcard .cf b{margin:0;font-size:20px;font-family:var(--fuente-titulo);color:var(--azul)}.rcard .cf span{font-size:11.5px;font-weight:700;color:var(--gris);text-transform:capitalize}
.rcard .ri{min-width:0}.rcard .ri b{margin:0;font-size:15px}
.rcard small{display:block;color:var(--gris);margin-top:2px;font-weight:500}.rcard .ic{position:absolute;top:50%;right:10px;transform:translateY(-50%)}
.rcard .tipo{display:inline-block;background:var(--suave);color:var(--azul);border-radius:999px;padding:1px 9px;font-size:12px;font-weight:700;margin-top:4px}
.fila{display:flex;flex-direction:column;align-items:flex-start;width:100%;background:var(--capa);color:var(--tx);margin-bottom:6px;text-align:left;font-weight:600}.fila:hover{background:var(--suave);filter:none}
.lista2{max-height:50vh;overflow:auto;margin-top:10px}
@media(max-width:960px){[data-vista=repertorio] .rcols{grid-template-columns:minmax(0,1fr)}.hojap{padding:24px 20px;min-height:300px}}
@media print{header,#aviso,#izq,.noprint,.mo,.falta,.blk:has(.falta){display:none!important}main{padding:0;max-width:none}.rcols{display:block!important}.hojap{box-shadow:none;padding:0}
@page{size:A4;margin:14mm}*{-webkit-print-color-adjust:exact;print-color-adjust:exact}}`;
document.head.append(st);

const ico=(p,s=16)=>`<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
const SHF='<path d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5"/>';
const PRN='<path d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><path d="M6 14h12v8H6z"/>';
const EXP='<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>';
const SHR='<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4"/>';
const CPY='<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>';

const fechaCorta=f=>{if(!f)return'Sin fecha';const [y,m,d]=f.split('-');return d+'/'+m+'/'+y};

let C=[],T=[],A=[],R=[],el=null,rep=null,tm=null;
let pestana='misa';try{if(localStorage.getItem('pestanaRep')==='evento')pestana='evento'}catch(e){}   // pestaña Misas | Eventos de la lista
const alb=c=>A.find(a=>a.id===c.albumId)?.nombre||'';
const titAlb=c=>`<span>${esc(c.titulo)}</span>`+(alb(c)?`<small>${esc(alb(c))}</small>`:'');
const ref=()=>{if(el)rep?pder():lista()};
alCambiarEquipos(()=>{if(el&&rep){pizq();pder()}});
let crudoA=[],crudoC=[];
function recalcBiblioteca(){
  A=crudoA.filter(visibleBiblioteca);
  const ids=new Set(A.map(a=>a.id));
  C=crudoC.filter(c=>ids.has(c.albumId));
  ref();
}
escuchar('albumes',l=>{crudoA=l;recalcBiblioteca()});
escuchar('canciones',l=>{crudoC=l;recalcBiblioteca()});
addEventListener('ambitocambio',recalcBiblioteca);
escuchar('etiquetas',l=>{T=l;ref()});
escucharPropio('repertorios',l=>{R=l;ref()});
const rand=()=>Math.random().toString(36).slice(2,8);
const sec=id=>rep.secciones.find(s=>s.id===id);
const tagId=n=>T.find(t=>t.nombre.toLowerCase()===n.toLowerCase())?.id;
const candMom=id=>{const g=tagId(MOM.find(m=>m[0]===id)[1]);return g?C.filter(c=>(c.etiquetas||[]).includes(g)):[]};
const candSec=s=>s.tag?C.filter(c=>(c.etiquetas||[]).includes(s.tag)):C;
const usadas=()=>[...Object.values(rep.misa),...rep.secciones.flatMap(s=>s.canciones)];
const azar=(l,u)=>{const d=l.filter(c=>!u.includes(c.id)),b=d.length?d:l;return b.length?b[Math.floor(Math.random()*b.length)].id:null};
const guarda=()=>{clearTimeout(tm);tm=setTimeout(flush,300)};
function flush(){clearTimeout(tm);tm=null;if(rep){const {id,...d}=rep;guardar('repertorios',id,d,false)}}

vistas.repertorio=e=>{
  el=e;rep=null;el.onclick=clic;el.oninput=entra;el.onchange=entra;
  const a=sessionStorage.getItem('repAbrir'),f=sessionStorage.getItem('repFecha'),n=sessionStorage.getItem('repNuevo');
  sessionStorage.removeItem('repAbrir');sessionStorage.removeItem('repFecha');sessionStorage.removeItem('repNuevo');
  if(a&&R.find(x=>x.id===a))abrir(a);
  else if(n){try{const v=JSON.parse(n);nuevo(v.fecha,v.tipo,v.nombre,v.evento)}catch(err){lista()}}   // creado desde el Calendario
  else if(f)nuevo(f,pestana);else lista();
};
addEventListener('hashchange',()=>{if(location.hash!=='#repertorio'){flush();el=null;rep=null}});
addEventListener('reinicio',e=>{if(e.detail==='repertorio'&&el){flush();rep=null;lista()}});

function lista(){
  el.className="";
  const cuadro=f=>{if(!f)return '<b>\u2013</b><span>Sin fecha</span>';const [y,m,d]=f.split('-').map(Number);return `<b>${d}</b><span>${MES[m-1].slice(0,3)}${y!==new Date().getFullYear()?' '+y:''}</span>`};
  const cuantas=r=>{const n=r.tipo==='evento'?(r.secciones||[]).reduce((a,x)=>a+(x.canciones||[]).length,0):Object.values(r.misa||{}).filter(Boolean).length;return n?n+(n>1?' canciones':' canci\u00f3n'):'Sin canciones'};
  const editar=puedeEditar();
  el.innerHTML=`<div class="ch2"><h1>Repertorios</h1><div class="rtabs"><div class="seg" role="group" aria-label="Tipo de repertorio"><button data-pest="misa" class="${pestana==='misa'?'on':''}" aria-pressed="${pestana==='misa'}">Misas</button><button data-pest="evento" class="${pestana==='evento'?'on':''}" aria-pressed="${pestana==='evento'}">Eventos</button></div>${editar?`<button data-nuevo aria-label="${pestana==='evento'?'Nuevo repertorio de evento':'Nuevo repertorio de misa'}" title="${pestana==='evento'?'Nuevo repertorio de evento':'Nuevo repertorio de misa'}">${ic('pls',18)}</button>`:''}</div></div><div class="grid" style="grid-template-columns:repeat(auto-fill,minmax(260px,1fr))">`
    +R.filter(r=>(r.tipo==='evento'?'evento':'misa')===pestana).sort((a,b)=>(b.fecha||'').localeCompare(a.fecha||'')).map(r=>`<div class="card rcard" data-open="${r.id}" role="button" tabindex="0"><div class="cf" aria-hidden="true">${cuadro(r.fecha)}</div><div class="ri"><b>${esc(r.nombre||'Sin nombre')}</b><small>${cuantas(r)}</small><span class="tipo">${r.tipo==='evento'?'Evento':'Misa'}</span></div>${editar?`<button class="ic rj" data-del="${r.id}" aria-label="Eliminar \u00ab${esc(r.nombre||'Sin nombre')}\u00bb" title="Eliminar">${ic('trs',16)}</button>`:''}</div>`).join('')
    +'</div>'+(R.some(r=>(r.tipo==='evento'?'evento':'misa')===pestana)?'':`<p class="vacio">A\u00fan no hay repertorios de ${pestana==='evento'?'eventos':'misas'}.${editar?' Pulsa \u00ab+\u00bb para crear el primero.':''}</p>`);
}
// nuevo(fecha, tipo, nombre, evento): crea un repertorio. El tipo (misa o evento) queda fijo.
// Si viene de un evento del Calendario, el evento guarda el id de este repertorio.
async function nuevo(f,tipo,nombre,evento){
  const d={nombre:nombre||'Nuevo repertorio',fecha:f||'',tipo:tipo==='evento'?'evento':'misa',acordes:false,misa:{},secciones:[]};
  const r=await crear('repertorios',d);
  if(evento)guardar('eventos',evento,{repertorioId:r.id});
  pestana=d.tipo;rep={id:r.id,...d};editor();
}
function abrir(id){rep=structuredClone(R.find(x=>x.id===id));pestana=rep.tipo==='evento'?'evento':'misa';rep.misa=rep.misa||{};rep.secciones=rep.secciones||[];editor()}
function editor(){
  el.className='';
  el.innerHTML=`<div class="rcols"><section class="c2" id="izq"></section><section><div class="ch2 noprint"><h2>Vista previa</h2><div class="mb"><button class="ic" data-share aria-label="Compartir" title="Compartir">${ico(SHR,18)}</button><button class="ic" data-copy aria-label="Copiar texto" title="Copiar todo el texto">${ico(CPY,18)}</button><button class="ic" data-print aria-label="Descargar PDF" title="Descargar PDF">${ico(EXP,18)}</button></div></div><div class="hojap" id="hoja"></div></section></div>`;
  pizq();pder();
}
function pizq(){
  const i=$('#izq');if(!i||!rep)return;
  const editar=puedeEditar();
  const fila=([id,n])=>{const c=C.find(x=>x.id===rep.misa[id]);
    const base=`<div class="mn"><b>${n}</b>${c?titAlb(c):'<em class="falta">Sin canci\u00f3n</em>'}</div>`;
    if(!editar)return `<div class="mrow">${base}</div>`;
    return`<div class="mrow">${base}<button class="ic" data-pick="${id}" aria-label="Elegir canci\u00f3n para ${n}" title="Elegir">${ic('edt',15)}</button><button class="ic" data-rnd="${id}" aria-label="Canci\u00f3n al azar para ${n}" title="Al azar">${ico(SHF,15)}</button>${c?`<button class="ic rj" data-rm="${id}" aria-label="Quitar canci\u00f3n de ${n}" title="Quitar">${ic('x',15)}</button>`:''}</div>`};
  const secs=s=>{
    const canciones=s.canciones.map(id=>{const c=C.find(x=>x.id===id);if(!c)return '';
      return editar?`<div class="mrow"><div class="mn">${titAlb(c)}</div><button class="ic rj" data-srm="${s.id}:${id}" aria-label="Quitar">${ic('x',15)}</button></div>`:`<div class="mrow"><div class="mn">${titAlb(c)}</div></div>`}).join('');
    if(!editar)return `<div class="sec2"><div class="dh"><b>${esc(s.nombre||'Secci\u00f3n')}</b></div>${textoEquipo(s.escala)?`<div class="escsec">${ic('usr',14)}<span>${esc(textoEquipo(s.escala))}</span></div>`:''}${canciones}</div>`;
    return `<div class="sec2"><div class="dh"><input class="inl" data-sn="${s.id}" value="${esc(s.nombre)}" placeholder="Nombre de la secci\u00f3n"><button class="ic" data-sesc="${s.id}" aria-label="Elegir escala de esta secci\u00f3n" title="Elegir escala">${ic('usr',15)}</button><button class="ic rj" data-sdel="${s.id}" aria-label="Eliminar secci\u00f3n">${ic('trs',15)}</button></div>
    ${textoEquipo(s.escala)?`<div class="escsec">${ic('usr',14)}<span>${esc(textoEquipo(s.escala))}</span><button data-sescq="${s.id}" aria-label="Quitar escala" title="Quitar escala">${ic('x',13)}</button></div>`:''}
    <label class="fl2">Opciones de canciones<select data-st="${s.id}"><option value="">Todas las canciones</option>${[...T].sort((a,b)=>a.nombre.localeCompare(b.nombre,'es',{sensitivity:'base'})).map(t=>`<option value="${t.id}"${s.tag===t.id?'selected':''}>${esc(t.nombre)}</option>`).join('')}</select></label>`
    +canciones
    +`<button class="sec" data-spick="${s.id}">${ic('pls',15)} Canci\u00f3n</button></div>`;
  };
  const cabecera=editar
    ?`<label class="fl2">Nombre del repertorio<input id="rn" value="${esc(rep.nombre||'')}"></label>
    <label class="fl2">Fecha<input type="date" id="rf" value="${esc(rep.fecha||'')}"></label>
    <label class="chk" style="margin:2px 0"><input type="checkbox" id="ra" ${rep.acordes?'checked':''}> Mostrar acordes</label>`
    :`<h2 style="margin:0">${esc(rep.nombre||'Sin nombre')}</h2>${rep.fecha?`<p style="color:var(--gris);margin:4px 0 0">${esc(fechaLarga(rep.fecha))}</p>`:''}`;
  const escalaMisa=textoEquipo(rep.escala)?`<div class="escsec escmisa">${ic('usr',14)}<span>${esc(textoEquipo(rep.escala))}</span>${editar?`<button data-mescq aria-label="Quitar escala" title="Quitar escala">${ic('x',13)}</button>`:''}</div>`:'';
  i.innerHTML=`<div class="ch2"><button class="sec" data-back>${ic('lft',16)} Repertorios</button><span class="tipochip">${rep.tipo==='evento'?'Evento':'Misa'}</span></div>
    <div class="rhead">${cabecera}</div>`
    +(rep.tipo==='evento'?(editar?`<button data-sadd style="width:100%;margin-top:8px">${ic('pls',16)} A\u00f1adir secci\u00f3n</button>`:'')+rep.secciones.map(secs).join('')
      :(editar?`<div class="azesc"><button class="sec" data-alet>${ico(SHF)} Elegir toda la misa al azar</button><button class="sec besc${textoEquipo(rep.escala)?' elegida':''}" data-mesc title="Elegir escala para toda la misa">${ic('usr',16)}<span>Escala</span></button></div>`:'')+escalaMisa+`<div class="momentos">${MOM.map(fila).join('')}</div>`);
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

function pder(){
  const h=$('#hoja');if(!h||!rep)return;
  const song=id=>{const c=C.find(x=>x.id===id);return c?cancion(c,rep.acordes):''};
  const hay=id=>C.find(x=>x.id===id);
  const b=(rep.tipo==='evento'
    ?rep.secciones.filter(s=>s.canciones.some(hay)).map(s=>`<div class="blk"><div class="lab">${esc(s.nombre||'Secci\u00f3n')}</div>${equipoPrevia(s.escala)/* esto se puede Borrar … hasta aquí */}${s.canciones.map(song).join('')}</div>`)
    :MOM.filter(([id])=>hay(rep.misa[id])).map(([id,n])=>`<div class="blk"><div class="lab">${n}</div>${song(rep.misa[id])}</div>`)).join('')||'<div class="falta">Elige canciones en la columna de la izquierda para ver aqu\u00ed c\u00f3mo quedar\u00e1 la hoja.</div>';
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
const bloqueTxt=(momento,id)=>{
  const c=C.find(x=>x.id===id);if(!c)return '';
  return (momento?momento.toUpperCase()+'\n':'')+c.titulo+(alb(c)?' - '+alb(c):'')+'\n'+letraPlana(c);
};
async function copiar(){
  const partes=rep.tipo==='evento'
    ?rep.secciones.flatMap(s=>s.canciones.map((id,i)=>bloqueTxt(i===0?s.nombre:'',id)))   // el nombre de la sección solo antes de su primera canción
    :MOM.map(([id,n])=>rep.misa[id]?bloqueTxt(n,rep.misa[id]):'');
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
  const b=e.target.closest('[data-nuevo],[data-open],[data-del],[data-back],[data-print],[data-copy],[data-share],[data-pest],[data-mesc],[data-mescq],[data-sesc],[data-sescq],[data-alet],[data-pick],[data-rnd],[data-rm],[data-sadd],[data-sdel],[data-spick],[data-srm]');
  if(!b)return;const d=b.dataset,ok=()=>{guarda();pizq();pder()};
  if(d.nuevo!=null)nuevo('',pestana);
  else if(d.pest){pestana=d.pest;try{localStorage.setItem('pestanaRep',pestana)}catch(err){}lista();const t=el.querySelector(`[data-pest="${pestana}"]`);if(t)t.focus()}
  else if(d.mesc!=null)elegirEscala(rep.escala,v=>{rep.escala=v;ok()});                          // una escala para toda la misa
  else if(d.sesc){const s=sec(d.sesc);elegirEscala(s.escala,v=>{s.escala=v;ok()})}                // una escala por sección
  else if(d.sescq){sec(d.sescq).escala=null;ok()}
  else if(d.mescq!=null){rep.escala=null;ok()}
  else if(d.del){const r=R.find(x=>x.id===d.del);eliminar('repertorios',r,'el repertorio "'+(r.nombre||'')+'"')}
  else if(d.open)abrir(d.open);
  else if(d.back!=null){flush();rep=null;lista()}
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
  else if(d.sdel){rep.secciones=rep.secciones.filter(s=>s.id!==d.sdel);ok()}
  else if(d.spick){const s=sec(d.spick);elegir(s.nombre||'Elegir canci\u00f3n',candSec(s),id=>{if(!s.canciones.includes(id))s.canciones.push(id);ok()})}
  else if(d.srm){const [sid,cid]=d.srm.split(':'),s=sec(sid);s.canciones=s.canciones.filter(x=>x!==cid);ok()}
}

function entra(e){
  const t=e.target;if(!rep)return;
  if(t.id==='rn'){rep.nombre=t.value;guarda();pder()}
  else if(t.id==='rf'){rep.fecha=t.value;guarda();pder()}
  else if(t.id==='ra'&&e.type==='change'){rep.acordes=t.checked;guarda();pder()}
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
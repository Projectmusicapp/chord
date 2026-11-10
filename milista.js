// =====================================================================
//  MILISTA.JS  ·  «Mi lista»  (ARCHIVO NUEVO · autor: Chigo)
//
//  Pantalla sencilla para las cuentas «Usuario (solo ver)»: cada usuario
//  crea todas las listas de canciones que quiera para verlas, tocarlas en
//  su ensayo o compartirlas.
//
//  Cada lista tiene:  Nombre · Momento (filtro) · botón «Añadir canción».
//   - «Momento» solo sirve para encontrar canciones: muestra las canciones
//     que tienen esa etiqueta (solo las del grupo «Otros», ver etiquetas.js).
//     No se guarda dentro de la lista ni separa las canciones.
//   - Compartir / Abrir reutilizan la pantalla #ver/ID (ver.js).
//
//  DÓNDE SE GUARDA: en la colección «repertorios» de Firestore (la misma
//  que usa #ver/ID, así el enlace de compartir funciona sin tocar reglas).
//  Se distinguen de los repertorios reales con:
//      miLista:true · tipo:'lista' · duenoId:<id de la cuenta> · canciones:[ids]
//  repertorio.js las oculta (ver el cambio marcado «Chigo» en ese archivo).
//
//  Archivos tocados por este cambio (todos con comentarios «Chigo»):
//  base.js (menú y ruta), login.js (carga de la pantalla), ver.js
//  (dibujar una lista), repertorio.js (ocultar listas y etiquetas de
//  eventos) y etiquetas.js (grupos Misas / Otros).
// =====================================================================
import {$,esc,guardar,crear,eliminar,vistas,ic,modal,aviso,sesion} from "./base.js";
import {E,alCambiar} from "./estado.js";
import {cancion} from "./hoja.js";                  // dibuja la canción (título y letra) igual que la vista previa de Repertorio y el enlace de compartir

const st=document.createElement('style');
st.textContent=`.ml-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:14px;margin-top:14px}
.ml-card{display:flex;align-items:center;gap:12px;padding:16px;text-align:left;cursor:pointer}
.ml-t{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px}.ml-t b{font-size:15px}.ml-t small{color:var(--gris);font-weight:500}
.ml-cols{display:grid;grid-template-columns:400px minmax(0,1fr);gap:24px;align-items:start}
.ml-form{display:grid;gap:14px}
@media(max-width:960px){.ml-cols{grid-template-columns:minmax(0,1fr)}.ml-cols .hojap{padding:24px 20px;min-height:300px}}
.ml-form .fl2{margin:0}
.ml-cuenta{margin:0 0 4px;color:var(--gris);font-weight:600;font-size:13px}
.ml-fila{display:flex;align-items:center;gap:6px;padding:9px 0;border-bottom:1px solid var(--linea)}
.ml-fila:last-child{border-bottom:0}
.ml-n{flex:1;min-width:0;display:flex;flex-direction:column;gap:1px}.ml-n b{font-size:14.5px}.ml-n small{color:var(--gris);font-weight:500;font-size:12.5px}
.ml-sub{margin:6px 0 10px;color:var(--gris);font-size:13.5px}
button.fila.ml-op{flex-direction:row;align-items:center;justify-content:space-between;gap:10px}
.ml-ot{display:flex;flex-direction:column;min-width:0}.ml-ot small{color:var(--gris);font-weight:500;font-size:12.5px}
button.fila.ml-op.ya{background:var(--oro-claro);color:var(--azul)}
.ml-ck{flex:none;font-weight:800}
/* celular: los botones de cambio de pantalla (Mi lista / Canciones) van centrados; solo para cuentas «solo ver» (clase solo-ver, ver base.js) */
@media(max-width:760px){body.solo-ver #nav{display:flex;justify-content:center;gap:28px;flex:1 1 auto;min-width:0}
body.solo-ver #nav a{position:relative}
body.solo-ver #nav a+a::before{content:'';position:absolute;left:-14px;top:50%;height:60%;width:1px;transform:translateY(-50%);background:currentColor;opacity:.35}}`;   /* separador «|» entre los botones */
document.head.append(st);

const SHR='<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4"/></svg>';

let R=[],el=null,abierta=null,momento='',ov={};      // ov: canciones recién cambiadas, mientras llega la copia de Firebase
const yo=()=>{const s=sesion();return s?s.id:null};
const mias=()=>R.filter(r=>r.miLista&&r.duenoId===yo());
const actual=()=>mias().find(r=>r.id===abierta);
const cancionesDe=r=>ov[r.id]||r.canciones||[];
const alb=c=>(E.albumes.find(a=>a.id===c.albumId)||{}).nombre||'';
const cuenta=r=>{const n=cancionesDe(r).length;return n?n+(n>1?' canciones':' canción'):'Sin canciones'};
const enlace=r=>location.origin+location.pathname+'#ver/'+r.id;

// Los repertorios (ya filtrados por misión) se leen de estado.js en vez de escucharlos por
// cuenta propia, para no leer la colección dos veces (ver el comentario al principio de ese
// archivo) — «Mi lista» igual solo muestra las propias (ver mias(), arriba). alCambiar() avisa
// de cualquier cambio (también canciones/álbumes/etiquetas); «ov» (canción añadida mientras se
// espera la copia de Firebase) solo se limpia cuando lo que cambió fue de verdad «repertorios».
alCambiar(()=>{if(R!==E.repertorios){R=E.repertorios;ov={}}pintar()});

vistas.milista=e=>{
  el=e;abierta=null;
  el.onclick=clic;el.onchange=cambia;
  lista();
};
addEventListener('hashchange',()=>{if(location.hash!=='#milista')el=null});
addEventListener('reinicio',e=>{if(e.detail==='milista'&&el){abierta=null;lista()}});   // tocar «Mi lista» otra vez vuelve a tus listas

function pintar(){
  if(!el||!el.isConnected)return;
  if(abierta&&!actual())abierta=null;                // la lista se borró
  if(abierta){if($('#ml-ed',el)){const m=$('#ml-m',el);if(m&&document.activeElement!==m)m.innerHTML=opcionesMomento();pintarCanciones()}else editor()}   // también se refrescan las etiquetas si cargaron después
  else lista();
}

// ---------- Todas mis listas ----------
function lista(){
  const ls=mias().sort((a,b)=>(b.creadoEn||0)-(a.creadoEn||0));
  el.innerHTML=`<div class="ch2"><h1>Mi lista</h1><button data-nueva>${ic('pls',16)} Nueva lista</button></div>`
    +(ls.length
      ?`<div class="ml-grid">${ls.map(r=>`<div class="card ml-card" data-open="${r.id}" role="button" tabindex="0"><div class="ml-t"><b>${esc(r.nombre||'Sin nombre')}</b><small>${cuenta(r)}</small></div><button class="ic" data-borrar="${r.id}" aria-label="Eliminar «${esc(r.nombre||'Sin nombre')}»" title="Eliminar">${ic('trs',16)}</button></div>`).join('')}</div>`
      :'<p class="vacio">Aún no tienes listas. Pulsa «Nueva lista» para crear la primera.</p>');
}

// ---------- Una lista: nombre, momento y canciones ----------
// Etiquetas que se ofrecen en «Momento»: las del grupo «Otros». Si todavía no hay ninguna en «Otros»
// se muestran todas, para que la lista nunca quede vacía.
const etiquetasMomento=()=>{const otros=E.etiquetas.filter(t=>t.grupo==='otro');return otros.length?otros:E.etiquetas};
const opcionesMomento=()=>{
  const l=etiquetasMomento();
  if(momento&&!l.some(t=>t.id===momento))momento='';              // esa etiqueta ya no existe
  return '<option value="">Todas las canciones</option>'+l.map(t=>`<option value="${t.id}"${t.id===momento?' selected':''}>${esc(t.nombre)}</option>`).join('');
};
function editor(){
  const r=actual();if(!r)return;
  el.innerHTML=`<div id="ml-ed">
    <div class="ml-cols"><section class="c2 ml-form">
      <div class="ch2"><button class="sec" data-volver>${ic('lft',16)} Mis listas</button></div>
      <label class="fl2">Nombre<input id="ml-n" value="${esc(r.nombre||'')}" autocomplete="off"></label>
      <label class="fl2">Momento<select id="ml-m">${opcionesMomento()}</select></label>
      <button data-add>${ic('pls',16)} Añadir canción</button>
      <div id="ml-can"></div>
    </section>
    <section><div class="ch2"><h2>Vista previa</h2><div class="mb"><button class="sec" data-ver>Abrir</button><button class="ic" data-share aria-label="Compartir" title="Compartir">${SHR}</button></div></div><div class="hojap" id="ml-hoja"></div></section></div></div>`;
  pintarCanciones();
}
function pintarCanciones(){
  const z=$('#ml-can',el),r=actual();if(!z||!r)return;
  const filas=cancionesDe(r).map(id=>{const c=E.canciones.find(x=>x.id===id);
    return c?`<div class="ml-fila"><div class="ml-n"><b>${esc(c.titulo)}</b>${alb(c)?`<small>${esc(alb(c))}</small>`:''}</div><button class="ic" data-quitar="${id}" aria-label="Quitar «${esc(c.titulo)}»" title="Quitar">${ic('x',15)}</button></div>`:''}).join('');
  z.innerHTML=filas?`<p class="ml-cuenta">${cuenta(r)}</p>${filas}`:'<p class="vacio">Esta lista aún no tiene canciones.</p>';
  // Vista previa: solo las canciones (título y letra), sin nombre de la lista, fecha ni momento
  const h=$('#ml-hoja',el);
  if(h)h.innerHTML=cancionesDe(r).map(id=>E.canciones.find(x=>x.id===id)).filter(Boolean).map(c=>cancion(c,false,{album:''})).join('')||'<div class="falta">Elige canciones para verlas aquí.</div>';
}
function ponCanciones(r,arr){ov[r.id]=arr;guardar('repertorios',r.id,{canciones:arr});pintarCanciones()}

// ---------- Elegir canciones (la ventana sigue abierta para tocar varias) ----------
function elegir(){
  const r=actual();if(!r)return;
  const tag=momento,nombreM=(E.etiquetas.find(t=>t.id===tag)||{}).nombre||'Todas las canciones';
  let q='';
  const o=modal('<div id="ml-pk"></div>'),z=$('#ml-pk',o);
  const p=()=>{
    const k=q.toLowerCase(),ya=cancionesDe(actual()||r);
    const l=E.canciones.filter(c=>(!tag||(c.etiquetas||[]).includes(tag))&&c.titulo.toLowerCase().includes(k)).sort((a,b)=>a.titulo.localeCompare(b.titulo));
    z.innerHTML=`<div class="mh"><h2>Añadir canción</h2><button class="ic" data-cx aria-label="Cerrar">${ic('x')}</button></div>
      <p class="ml-sub">Momento: <b>${esc(nombreM)}</b></p>
      <input id="ml-q" type="search" placeholder="Buscar canción" aria-label="Buscar canción" value="${esc(q)}" style="width:100%" autocomplete="off">
      <div class="lista2">${l.map(c=>{const si=ya.includes(c.id);return `<button class="fila ml-op${si?' ya':''}" data-s="${c.id}" aria-pressed="${si}"><span class="ml-ot"><span>${esc(c.titulo)}</span>${alb(c)?`<small>${esc(alb(c))}</small>`:''}</span><span class="ml-ck">${si?'✓':''}</span></button>`}).join('')||`<p class="vacio">No hay canciones para este momento. Cambia el «Momento» a «Todas las canciones».</p>`}</div>
      <div class="barra" style="justify-content:flex-end;margin-top:10px"><button data-cx>Listo</button></div>`;
  };
  p();
  o.onclick=e=>{
    const b=e.target.closest('button');if(!b)return;
    if(b.dataset.cx!=null){o.remove();return}
    if(b.dataset.s){
      const r2=actual();if(!r2)return;const ya=cancionesDe(r2),id=b.dataset.s;
      const lz=$('.lista2',o),top=lz?lz.scrollTop:0;
      ponCanciones(r2,ya.includes(id)?ya.filter(x=>x!==id):[...ya,id]);   // tocar otra vez la quita
      p();const lz2=$('.lista2',o);if(lz2)lz2.scrollTop=top;
    }
  };
  o.oninput=e=>{if(e.target.id==='ml-q'){q=e.target.value;p();const i=$('#ml-q',o);i.focus();i.setSelectionRange(999,999)}};
}

// ---------- Compartir (mismo método que repertorio.js: enlace #ver/ID) ----------
async function compartir(){
  const r=actual();if(!r)return;
  if(!cancionesDe(r).length)return aviso('Añade canciones antes de compartir.');
  const url=enlace(r),titulo=r.nombre||'Mi lista';
  if(matchMedia('(pointer:coarse)').matches&&navigator.share){
    try{await navigator.share({title:titulo,text:titulo,url});return}
    catch(e){if(e&&e.name==='AbortError')return}
  }
  let copiado=false;
  try{await navigator.clipboard.writeText(url);copiado=true}catch(e){}
  window.open(url,'_blank','noopener');
  aviso(copiado?'Enlace copiado. Ya puedes pegarlo en WhatsApp o en un correo.':'Se abrió la lista en una pestaña nueva.');
}

// ---------- Eventos ----------
async function clic(e){
  const b=e.target.closest('button,[data-open]');if(!b)return;
  const d=b.dataset;
  if(d.nueva!=null){
    const r=await crear('repertorios',{nombre:'Nueva lista',tipo:'lista',miLista:true,duenoId:yo(),canciones:[],acordes:false,fecha:'',misa:{},secciones:[],textos:{},textosOrd:[]});
    abierta=r.id;editor();
  }
  else if(d.borrar){const r=mias().find(x=>x.id===d.borrar);if(r)eliminar('repertorios',r,'«'+(r.nombre||'esta lista')+'»')}
  else if(d.open){abierta=d.open;editor()}
  else if(d.volver!=null){abierta=null;lista()}
  else if(d.add!=null)elegir();
  else if(d.quitar){const r=actual();if(r)ponCanciones(r,cancionesDe(r).filter(x=>x!==d.quitar))}
  else if(d.share!=null)compartir();
  else if(d.ver!=null){const r=actual();if(!r)return;if(!cancionesDe(r).length)return aviso('Añade canciones para poder verla.');window.open(enlace(r),'_blank','noopener')}
}
function cambia(e){
  const t=e.target,r=actual();if(!r)return;
  if(t.id==='ml-n')guardar('repertorios',r.id,{nombre:t.value.trim()||'Mi lista'});
  else if(t.id==='ml-m')momento=t.value;
}
// =====================================================================
//  VER.JS  ·  Ventana «Compartir» de un repertorio  (dirección: #ver/ID)
//
//  Se abre SIN login (ver login.js). Muestra el repertorio limpio, sin el
//  menú de la app, con:
//   - un botón «Acordes» para mostrarlos u ocultarlos
//   - en cada canción, «Tono: X» se puede tocar para transponer esa canción
//   - en los eventos, junto a cada sección, un botón para ver su escala (equipo)
//   - en el celular, la barra de arriba se oculta al bajar y vuelve al subir
//   - un botón «Auto» junto a «Acordes»: abre un panel (play/pausa y velocidad) que baja la hoja sola, para cantar o tocar sin tocar la pantalla
//
//  IMPORTANTE: todo lo que se cambia aquí (acordes, tonos, zoom, velocidad del desplazamiento) vive solo
//  en la pantalla de quien lo toca. No se guarda en Firebase, no cambia la
//  canción ni su editor, y al recargar o cerrar vuelve a como estaba.
//
//  MAPA:
//   1. ESTILOS
//   2. DATOS ............. repertorio, canciones y escalas (solo lectura)
//   3. TRANSPONER ........ copia de la canción con los acordes movidos
//   4. DIBUJAR ........... barra de arriba, hoja y panel de tono
//   5. EVENTOS ........... clics, teclas y zoom con dos dedos
//   6. DESPLAZAMIENTO AUTOMÁTICO ... botón «Auto», panel de velocidad y la hoja que baja sola
// =====================================================================
import {$,esc,escucharDoc,vistas} from "./base.js";
import {MOM,fechaLarga,cancion,textoHtml,textosDespues,esPeticiones} from "./hoja.js";
import {MAY,MEN,usaSostenidos,tokensAcorde,transponerChars,raizTono,esMenor,nombreTono,ix} from "./musica.js";
import {svgI as svg} from "./formato.js";

// ---------- 1. ESTILOS ----------
const st=document.createElement('style');
st.textContent=`.modo-ver header,.modo-ver #nav{display:none!important}
.modo-ver main{max-width:none;padding:0 0 48px}
.vbar{position:sticky;top:0;z-index:6;display:flex;align-items:center;gap:12px;background:var(--blanco);border-bottom:1px solid var(--linea);box-shadow:var(--sombra-1);padding:10px max(16px,calc((100% - 860px)/2))}
.vbar{transition:transform .25s ease}
.vbar.oculta{transform:translateY(calc(-100% - 4px))}
.vbar .vt2{flex:1;min-width:0}
.labx{display:flex;align-items:center;justify-content:space-between;gap:8px}
.labx .tdd{margin-left:0;text-transform:none;letter-spacing:0}
.eq-b{min-height:28px;padding:2px 10px;font:700 12.5px var(--fuente);background:var(--oro-claro);color:var(--azul);border:1px solid #E6CF9E;border-radius:999px;gap:5px;text-transform:none;letter-spacing:0}
.eq-b[aria-expanded=true]{background:var(--azul);color:#fff;border-color:var(--azul)}
.tpan.epan{left:auto;right:0}
.tpan h3{font-family:var(--fuente);font-size:15px;font-weight:800;color:var(--azul);margin:0 0 10px}
.vbar h1{font-size:20px;margin:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.vbar small{display:block;color:var(--gris);font-weight:600;font-size:13px}
.vbar small::first-letter{text-transform:uppercase}
.vbar .vac2{flex:none}
.vbar .vac2[aria-pressed=false]{background:var(--suave);color:var(--azul)}
.vbar .vac2 .vchk2{width:18px;height:18px;border-radius:5px;border:2px solid currentColor;display:grid;place-items:center}
.vzona{padding:18px 16px 0;overflow-x:auto}
.vzona .hojap{margin:0 auto;min-height:0}
.vzona .hojap{touch-action:pan-x pan-y}
.vzona .hojap.conac .rl,.vzona .hojap.conac .rc{white-space:pre}
@media(max-width:760px){.vzona .hojap.conac{max-width:none;width:max-content;min-width:100%;box-sizing:border-box;overflow:visible}}
.tdd{position:relative;display:inline-block;margin-left:10px;vertical-align:middle}
.tono-b{min-height:30px;padding:3px 10px;font:700 13px var(--fuente);background:var(--oro-claro);color:var(--azul);border:1px solid #E6CF9E;border-radius:999px;gap:5px}
.tono-b:hover{filter:none;background:#F1DFB9}
.tono-b[aria-expanded=true]{background:var(--azul);color:#fff;border-color:var(--azul)}
.tono-b .dif{font-weight:800;color:var(--oro-texto)}
.tono-b[aria-expanded=true] .dif{color:var(--oro)}
.tpan{position:absolute;top:calc(100% + 6px);left:0;z-index:8;width:290px;background:var(--blanco);border:1px solid var(--linea);border-radius:var(--r-l);box-shadow:var(--sombra-2);padding:14px;font-family:var(--fuente);font-size:14px;color:var(--tx);white-space:normal}
.tpan .fila3{display:grid;grid-template-columns:repeat(4,1fr);gap:6px}
.tpan .fila3 button{min-height:38px;padding:4px;background:var(--suave);color:var(--azul)}
.tpan .fila3 button:active{background:var(--azul);color:#fff}
.tpan .info{margin:12px 0 8px;color:var(--gris);font-weight:600;font-size:13px}
.tpan .info b{color:var(--azul)}
.tpan .keys2{display:grid;grid-template-columns:repeat(6,1fr);gap:5px}
.tpan .keys2 button{min-height:34px;padding:0;font-size:13px;background:var(--capa);color:var(--azul)}
.tpan .keys2 button.on{background:var(--azul);color:#fff}
.tpan .keys2 button.or{box-shadow:inset 0 0 0 2px var(--oro)}
.tpan .pie2{display:flex;justify-content:space-between;gap:8px;margin-top:12px}
.tpan .pie2 button{min-height:36px}
.tpan .nota{margin:10px 0 0;color:var(--gris);font-size:12.5px}
.vmsg{max-width:520px;margin:12vh auto 0;text-align:center;padding:0 20px}
.vmsg p{color:var(--gris)}
@media(max-width:600px){
  .vzona{padding:10px 8px 0}
  .vzona .hojap{padding:22px 16px;border-radius:10px}
  .tpan{position:fixed;left:10px;right:10px;top:auto;bottom:calc(10px + env(safe-area-inset-bottom));width:auto;box-shadow:var(--sombra-3);padding:16px}
  .tpan .keys2 button{min-height:40px}
  .tpan.epan{left:10px;right:10px}
}
.vbar .vauto{position:relative;flex:none}
.vbar .vauto-b{gap:6px}
.vapan{position:absolute;top:calc(100% + 10px);right:0;z-index:7;display:flex;align-items:center;gap:12px;width:min(360px,calc(100vw - 20px));background:var(--blanco);border:1px solid var(--linea);border-radius:999px;box-shadow:var(--sombra-2);padding:6px 18px 6px 6px;font-family:var(--fuente)}
.vapan[hidden]{display:none}
.vapan .vplay{flex:none;width:46px;height:46px;min-height:0;padding:0;border-radius:50%;display:grid;place-items:center}
.vapan .vplay[aria-pressed=false]{background:var(--suave);color:var(--azul)}
.vapan .vvel{flex:1;min-width:0;display:flex;flex-direction:column;gap:0;margin:0}
.vapan .et{display:flex;justify-content:space-between;font-size:11.5px;font-weight:700;color:var(--gris)}
.vapan input[type=range]{width:100%;height:26px;margin:0;padding:0;border:0;background:transparent;accent-color:var(--azul);touch-action:pan-x}
@media print{.vbar,.tdd,.vauto{display:none!important}.vzona{padding:0}.vzona .hojap{box-shadow:none;padding:0}}`;
document.head.append(st);

// ---------- 2. DATOS (solo lectura) ----------
// Quien abre un enlace compartido no tiene sesión ni ámbito propio, así que antes esto escuchaba
// las colecciones ENTERAS de repertorios/canciones/álbumes solo para mostrar un repertorio puntual
// (y cualquiera puede abrir un enlace muchas veces, sin login). Ahora solo se pide ese repertorio
// y las canciones/álbumes que de verdad usa, con un documento suelto por cada uno.
// Con las escalas pasa lo mismo: equipos.js las lee con escucharPropio, que solo deja pasar lo del
// espacio general (aquí no hay sesión, así que no hay espacio), y se perdían las escalas de una misión.
// Por eso aquí se lee directamente el día de cada escala elegida y las personas de ese equipo.
let R=null,repCargado=false,C={},A={},ED={},PD={},el=null,id=null,dejarRep=null;   // ED: días de Escalas · PD: personas
const suscC=new Map(),suscA=new Map(),suscE=new Map(),suscP=new Map();   // id de documento -> función para dejar de escucharlo
// Lo que cambia cada persona en su pantalla. Se pierde al recargar (a propósito).
const local={acordes:null,tonos:{},abierto:null,zoom:1,manual:false};
let barraOculta=false;

// idsCancionesDe(r): los ids de canciones que de verdad usa este repertorio (sin repetir).
function idsCancionesDe(r){
  if(!r)return [];
  if(r.tipo==='lista')return [...new Set((r.canciones||[]).filter(Boolean))];
  if(r.tipo==='evento')return [...new Set((r.secciones||[]).flatMap(s=>s.canciones||[]).filter(Boolean))];
  return [...new Set(Object.values(r.misa||{}).filter(Boolean))];
}
// sincroniza: deja de escuchar los documentos que ya no hacen falta y empieza a escuchar los
// nuevos, así solo hay un listener por documento que la pantalla realmente está usando.
function sincroniza(mapa,susc,ids,col,alCambiar){
  const activos=new Set(ids);
  for(const [i,dejar] of [...susc])if(!activos.has(i)){dejar();susc.delete(i);delete mapa[i]}
  activos.forEach(i=>{if(!susc.has(i))susc.set(i,escucharDoc(col,i,d=>{if(d)mapa[i]=d;else delete mapa[i];alCambiar();pintar()}))});
  alCambiar();   // por si la lista cambió sin añadir ningún documento nuevo (p.ej. se quitó una canción)
}
function sincronizaCanciones(){sincroniza(C,suscC,idsCancionesDe(R),'canciones',sincronizaAlbumes)}
function sincronizaAlbumes(){sincroniza(A,suscA,[...new Set(Object.values(C).map(c=>c.albumId).filter(Boolean))],'albumes',()=>{})}
const albDe=c=>(A[c.albumId]||{}).nombre||'';   // nombre del álbum de una canción

// ----- Escalas: una escala elegida se guarda así: {dia:'id del día', eq:0, nombre:'Equipo A'} (ver equipos.js) -----
// seleccionesDe(r): las escalas elegidas en el repertorio (solo en los eventos, una por sección)
const seleccionesDe=r=>r&&r.tipo==='evento'?(r.secciones||[]).map(s=>s.escala).filter(s=>s&&s.dia):[];
// equipoCrudo(sel): el día y el equipo con los datos actuales (o null). Misma búsqueda que equipos.js:
// por posición y, si cambiaron el orden de los equipos, por nombre.
function equipoCrudo(sel){
  if(!sel||!sel.dia)return null;
  const d=ED[sel.dia];if(!d)return null;
  const eqs=d.equipos||[];
  let q=eqs[sel.eq];
  if(!q||(sel.nombre&&q.nombre!==sel.nombre))q=eqs.find(e=>e.nombre===sel.nombre)||q;
  return q?{d,q}:null;
}
// Mismo orden que en Escalas: primero «Voz», luego por ocupación y nombre
const oc=p=>(p.ocupacion||'').trim().toLowerCase();
const ordenarPers=ids=>ids.map(i=>PD[i]).filter(Boolean).sort((a,b)=>{
  const va=oc(a).includes('voz'),vb=oc(b).includes('voz');
  if(va!==vb)return va?-1:1;
  return oc(a).localeCompare(oc(b))||(a.nombre||'').localeCompare(b.nombre||'');
});
function equipoDe(sel){const x=equipoCrudo(sel);return x?{dia:x.d.nombre,equipo:x.q.nombre,miembros:ordenarPers(x.q.miembros||[])}:null}
const textoEquipo=sel=>{const e=equipoDe(sel);return e?e.dia+' · '+e.equipo:''};
function htmlMiembros(sel){
  const e=equipoDe(sel);
  if(!e)return '<p class="vac" style="margin:0">La escala elegida ya no existe en Escalas.</p>';
  return e.miembros.length?`<ul class="miembros">${e.miembros.map(p=>`<li><span>${esc(p.nombre)}</span><small>${esc(p.ocupacion||'')}</small></li>`).join('')}</ul>`:'<p class="vac" style="margin:0">Este equipo aún no tiene personas.</p>';
}
// Los estilos de la lista de integrantes vivían en equipos.js; ahora están aquí (esta pantalla ya no lo carga)
const stE=document.createElement('style');
stE.textContent=`.miembros{list-style:none;margin:0;padding:0;display:grid;gap:4px}
.miembros li{display:flex;justify-content:space-between;gap:12px;padding:5px 0;border-bottom:1px solid var(--linea)}
.miembros li:last-child{border-bottom:0}
.miembros small{color:var(--gris)}`;
document.head.append(stE);
// Se escuchan solo los días de las escalas elegidas y, de ahí, solo las personas de esos equipos
function sincronizaEscalas(){sincroniza(ED,suscE,[...new Set(seleccionesDe(R).map(s=>s.dia))],'escalas',sincronizaPersonas)}
function sincronizaPersonas(){sincroniza(PD,suscP,[...new Set(seleccionesDe(R).flatMap(s=>{const x=equipoCrudo(s);return x?(x.q.miembros||[]):[]}))],'personas',()=>{})}

vistas.ver=(e,rid)=>{
  if(id!==rid){
    id=rid;local.acordes=null;local.tonos={};local.abierto=null;local.zoom=1;local.manual=false;parar();cerrarPanel();
    if(dejarRep)dejarRep();
    R=null;repCargado=false;C={};A={};ED={};PD={};
    suscC.forEach(dejar=>dejar());suscC.clear();
    suscA.forEach(dejar=>dejar());suscA.clear();
    suscE.forEach(dejar=>dejar());suscE.clear();
    suscP.forEach(dejar=>dejar());suscP.clear();
    dejarRep=escucharDoc('repertorios',rid,r=>{R=r;repCargado=true;sincronizaCanciones();sincronizaEscalas();pintar()});
  }
  el=e;el.onclick=clic;el.onkeydown=tecla;
  pintar();
};
addEventListener('hashchange',()=>{if(!location.hash.startsWith('#ver/')){el=null;parar();cerrarPanel()}});

// ---------- 3. TRANSPONER ----------
const pick=r=>{const o={};for(const k in r)if(k!=='t'&&r[k]!=null)o[k]=r[k];return o};
const aChars=l=>l.r.flatMap(r=>[...r.t].map(ch=>({ch,...pick(r)})));
const comp=cs=>{const out=[];let ult=null,clave='';
  for(const c of cs){const {ch,...f}=c,cl=JSON.stringify(f);if(ult&&cl===clave)ult.t+=ch;else{ult={...f,t:ch};clave=cl;out.push(ult)}}
  return out};
// textoT(texto, d, sost): transpone acordes escritos como texto (canciones de la versión anterior).
// Marca las notas de cada acorde y usa la MISMA función que el editor, así los nombres salen igual (Ab, no G#, en tono Ab).
const textoT=(t,d,sost)=>String(t||'').split('\n').map(l=>{
  const chars=[...l].map(ch=>({ch}));
  for(const tk of tokensAcorde(l))tk.raices.forEach(i=>{if(chars[i])chars[i].k=1});
  return transponerChars(chars,d,sost).letras.map(c=>c.ch).join('');
}).join('\n');
// ¿tiene algo que transponer? (acordes marcados, acordes de la versión anterior o un tono definido)
const transponible=c=>!!(c.tono||c.tonoAct||(c.lineasA||[]).some(l=>l.r.some(x=>x.k))||Object.values(c.ac||{}).some(x=>String(x).trim())||(c.intro||'').trim()||String(c.final||'').trim()||(c.interludios||[]).some(i=>(i.texto||'').trim()));
const escrito=c=>c.tonoAct||c.tono||'';                       // el tono en que están escritos los acordes de la hoja
const original=c=>c.tono||c.tonoAct||'';                       // el «tono original» que marcó quien hizo la canción
const mod=n=>((n%12)+12)%12;
// tonoDe(c, d): nombre del tono después de mover d semitonos ('' si la canción no tiene tono)
const tonoDe=(c,d)=>escrito(c)?nombreTono(escrito(c),d,esMenor(original(c)||escrito(c))):'';
// transpuesta(c, d): una COPIA de la canción con los acordes movidos d semitonos. La canción original no se toca.
function transpuesta(c,d){
  if(!d)return c;
  const nuevo=tonoDe(c,d),sost=nuevo?usaSostenidos(nuevo):null,x=structuredClone(c);
  if(x.lineasA)x.lineasA=x.lineasA.map(l=>({...l,r:comp(transponerChars(aChars(l),d,sost).letras)}));   // misma función que el editor
  // Canciones de la versión anterior (acordes guardados como texto)
  if(x.ac)for(const k in x.ac)x.ac[k]=textoT(x.ac[k],d,sost);
  if(x.intro)x.intro=textoT(x.intro,d,sost);
  if(x.final!=null)x.final=textoT(x.final,d,sost);
  if(x.interludios)x.interludios=x.interludios.map(i=>({...i,texto:textoT(i.texto,d,sost)}));
  if(nuevo)x.tonoAct=nuevo;
  return x;
}

// ---------- 4. DIBUJAR ----------
const medio=d=>{const n=d>6?d-12:d;if(!n)return '';const a=Math.abs(n),t=(a>=2?Math.floor(a/2):'')+(a%2?'½':'');return (n>0?'+':'−')+t};   // 3 semitonos → «+1½»

// Las canciones del repertorio, en orden, cada una con una clave propia (así cada una se transpone por separado)
function bloques(r){
  // ===== CHIGO · una lista de «Mi lista» (ver milista.js) se dibuja como un solo bloque de canciones =====
  if(r.tipo==='lista')return [{titulo:'Canciones',sin:false,items:(r.canciones||[]).map((cid,i)=>({clave:'l:'+i+':'+cid,cid}))}];
  // ===== FIN CHIGO =====
  // textos escritos a mano: cada uno es su propio bloque, justo después del bloque donde se añadió ('ini' = al principio)
  const tb=k=>textosDespues(r,k).map(t=>({titulo:(t.titulo||'').trim(),t,tx:true}));
  if(r.tipo==='evento')return [...tb('ini'),...(r.secciones||[]).flatMap(s=>[{titulo:s.nombre||'Sección',id:s.id,escala:s.escala,sin:esPeticiones(s.nombre),items:(s.canciones||[]).map((cid,i)=>({clave:'s:'+s.id+':'+i+':'+cid,cid}))},...tb(s.id)])];
  const m=r.misa||{};
  return [...tb('ini'),...MOM.flatMap(([k,n])=>[...(m[k]?[{titulo:n,sin:esPeticiones(n),items:[{clave:'m:'+k+':'+m[k],cid:m[k]}]}]:[]),...tb(k)])];
}

// Estilo de los cuadros de tono y escala: fijos en la pantalla, abajo, sin zoom (viven FUERA de la hoja con zoom)
const FIJO='position:fixed;zoom:1;left:8px;right:8px;top:auto;bottom:max(8px,env(safe-area-inset-bottom));width:auto;max-width:560px;margin:0 auto;max-height:80vh;overflow-y:auto;transform:none;z-index:60;touch-action:pan-y;overscroll-behavior:contain';
function panel(c,clave){
  const d=local.tonos[clave]||0,act=tonoDe(c,d),orig=original(c),base=escrito(c);
  const pasos=[[-2,'−1'],[-1,'−½'],[1,'+½'],[2,'+1']].map(([n,t])=>`<button data-paso="${n}" data-clave="${clave}" aria-label="${n>0?'Subir':'Bajar'} ${Math.abs(n)===2?'un tono':'medio tono'}">${t}</button>`).join('');
  const lista=esMenor(orig||base)?MEN:MAY;
  const teclas=base?`<div class="keys2" role="group" aria-label="Elegir tono">${lista.map(k=>`<button data-ir="${k}" data-clave="${clave}" class="${k===act?'on':''}${k===orig?' or':''}" aria-pressed="${k===act}" ${k===orig?'title="Tono original"':''}>${k}</button>`).join('')}</div>`:'';
  const info=base?`<p class="info">Original: <b>${esc(orig)}</b> · Ahora: <b>${esc(act)}</b></p>`:`<p class="info">Esta canción no tiene tono definido. Los acordes se mueven por semitonos${d?` (ahora ${medio(d)})`:''}.</p>`;
  return `<div class="tpan" style="${FIJO}" role="dialog" aria-label="Cambiar tono de ${esc(c.titulo)}"><div class="fila3">${pasos}</div>${info}${teclas}
    <div class="pie2"><button class="sec" data-orig data-clave="${clave}">Volver al original</button><button data-cerrar>Listo</button></div>
    <p class="nota">Solo cambia en tu pantalla.</p></div>`;
}

// Botón de la escala (equipo) de una sección. Solo en los eventos. El cuadro se dibuja aparte (panelEquipo), fuera de la hoja.
function botonEquipo(b){
  const t=textoEquipo(b.escala);if(!t)return '';
  const k='eq:'+b.id,abierto=local.abierto===k;
  return `<span class="tdd"><button class="eq-b" data-eqb="${k}" aria-expanded="${abierto}" aria-label="Ver la escala de ${esc(b.titulo)}">${svg('<path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.9M16 3.1a4 4 0 010 7.8"/>',14)} Escala ${svg('<path d="M6 9l6 6 6-6"/>',12)}</button></span>`;
}
function panelEquipo(b){
  const t=textoEquipo(b.escala);if(!t)return '';
  return `<div class="tpan epan" style="${FIJO}" role="dialog" aria-label="Escala de ${esc(b.titulo)}"><h3>${esc(t)}</h3>${htmlMiembros(b.escala)}<div class="pie2" style="justify-content:flex-end"><button data-cerrar>Listo</button></div></div>`;
}

function pintar(){
  if(!el)return;
  if(!repCargado){el.innerHTML='<div class="vmsg"><p>Cargando repertorio…</p></div>';return}
  const r=R;
  if(!r){parar();document.title='Repertorio no encontrado';el.innerHTML='<div class="vmsg"><h1>No encontramos este repertorio</h1><p>Puede que lo hayan eliminado o que el enlace esté incompleto. Pide a quien te lo envió que lo comparta otra vez.</p></div>';return}
  document.title=(r.nombre||'Repertorio')+(r.fecha?' · '+fechaLarga(r.fecha):'');
  if(local.acordes===null)local.acordes=!!r.acordes;
  const ac=local.acordes;
  const hoja=bloques(r).map(b=>{
    if(b.tx)return `<div class="blk">${b.titulo?`<div class="lab">${esc(b.titulo)}</div>`:''}${textoHtml(b.t)}</div>`;   // texto escrito a mano
    const canciones=b.items.map(({clave,cid})=>{
      const c0=C[cid];if(!c0)return '';
      const d=local.tonos[clave]||0,c=transpuesta(c0,d),abierto=local.abierto===clave;
      const tono=t=>!transponible(c0)?'':`<span class="tdd"><button class="tono-b" data-tono="${clave}" aria-expanded="${abierto}" aria-label="Cambiar tono de ${esc(c0.titulo)}${t?', ahora '+esc(t):''}">${t?`Tono: ${esc(t)}`:'Tono'}${d?` <span class="dif">${medio(d)}</span>`:''} ${svg('<path d="M6 9l6 6 6-6"/>',13)}</button></span>`;
      return cancion(c,ac,{tono,album:b.sin?'':albDe(c0)});
    }).join('');
    return canciones?`<div class="blk"><div class="lab labx"><span>${esc(b.titulo)}</span>${r.tipo==='evento'?botonEquipo(b):''}</div>${canciones}</div>`:'';
  }).join('')||'<div class="falta">Este repertorio aún no tiene canciones.</div>';
  let cuadro='';   // el cuadro abierto (tono o escala), fuera de la hoja para que el zoom no lo afecte
  if(local.abierto){
    if(local.abierto.startsWith('eq:')){const b=bloques(r).find(x=>'eq:'+x.id===local.abierto);if(b)cuadro=panelEquipo(b)}
    else{const c0=C[local.abierto.split(':').pop()];if(c0)cuadro=panel(c0,local.abierto)}
  }
  el.innerHTML=`<div class="vbar${barraOculta?' oculta':''}"><div class="vt2"><h1>${esc(r.nombre||'Repertorio')}</h1>${r.fecha?`<small>${esc(fechaLarga(r.fecha))}</small>`:''}</div>
      <button class="vac2" data-acordes aria-pressed="${ac}"><span class="vchk2">${ac?svg('<path d="M20 6L9 17l-5-5"/>',12):''}</span>Acordes</button></div>
        <div class="vzona"><div class="hojap${ac?' conac':''}" id="vh" style="zoom:${local.zoom}">${hoja}</div></div>${cuadro}`;
  ajustar();zoomTactil();ponerAuto();
}

// ---------- 5. EVENTOS ----------
// redibuja y deja el cursor en el mismo botón (para quien usa teclado)
function repinta(sel){pintar();if(sel){const b=el&&el.querySelector(sel);if(b)b.focus()}}

function clic(e){
  const b=e.target.closest('button');
  if(!b){if(local.abierto&&!e.target.closest('.tpan')){local.abierto=null;pintar()}return}
  if(b.dataset.eqb){const k=b.dataset.eqb;local.abierto=local.abierto===k?null:k;return repinta(`[data-eqb="${k}"]`)}
  const d=b.dataset,c=k=>C[k.split(':').pop()];
    if(d.acordes!=null){local.acordes=!local.acordes;local.manual=false;local.abierto=null;return repinta('[data-acordes]')}
  if(d.tono){local.abierto=local.abierto===d.tono?null:d.tono;return repinta(`[data-tono="${d.tono}"]`)}
  if(d.cerrar!=null){const k=local.abierto;local.abierto=null;return repinta(botonDe(k))}
  if(d.paso){local.tonos[d.clave]=mod((local.tonos[d.clave]||0)+ +d.paso);return repinta(`[data-paso="${d.paso}"][data-clave="${d.clave}"]`)}
  if(d.ir){const s=c(d.clave);local.tonos[d.clave]=mod(ix(raizTono(d.ir))-ix(raizTono(escrito(s))));return repinta(`[data-ir="${d.ir}"][data-clave="${d.clave}"]`)}
  if(d.orig!=null){const s=c(d.clave),o=original(s),w=escrito(s);local.tonos[d.clave]=o&&w?mod(ix(raizTono(o))-ix(raizTono(w))):0;return repinta(`[data-orig][data-clave="${d.clave}"]`)}
  if(local.abierto&&!b.closest('.tpan')){local.abierto=null;pintar()}
}
// Tocar en CUALQUIER parte de la pantalla (también fuera de la hoja) cierra el cuadro abierto
document.addEventListener('click',e=>{
  if(!el||!local.abierto||el.contains(e.target))return;   // lo de dentro de la hoja ya lo maneja clic()
  local.abierto=null;pintar();
},true);   // en fase de captura: se revisa ANTES de que clic() redibuje la hoja
const botonDe=k=>k&&k.startsWith('eq:')?`[data-eqb="${k}"]`:`[data-tono="${k}"]`;   // el botón que abrió el cuadro
function tecla(e){
  if(e.key==='Escape'&&local.abierto){const k=local.abierto;local.abierto=null;repinta(botonDe(k))}
}

// En el celular: al bajar por la hoja se oculta la barra de arriba (nombre y Acordes); al subir un poco, vuelve.
let ultimoY=0;
addEventListener('scroll',()=>{
  if(!el||!location.hash.startsWith('#ver/'))return;
  const y=scrollY,barra=el.querySelector('.vbar');
  if(auto.on){   // con el desplazamiento activo, la barra NO se oculta por bajar (eso lo hace el temporizador de 3 s); solo reaparece si subes
    if(barraOculta&&y<ultimoY-8)mostrarBarra();
    if(Math.abs(y-ultimoY)>8)ultimoY=y;
    return;
  }
  let oculta=barraOculta;
  if(!matchMedia('(max-width:760px)').matches||y<60)oculta=false;
  else if(y>ultimoY+8)oculta=true;
  else if(y<ultimoY-8)oculta=false;
  if(Math.abs(y-ultimoY)>8||y<60)ultimoY=y;
  if(oculta!==barraOculta){barraOculta=oculta;if(barra)barra.classList.toggle('oculta',oculta)}
},{passive:true});

// Zoom con dos dedos sobre la hoja (idea de la antigua «Vista completa»). Va de 50% a 250%.
let distInicial=0,zoomInicial=1,anchoPrev=0;
const dist=t=>Math.hypot(t[0].clientX-t[1].clientX,t[0].clientY-t[1].clientY);
const centro=t=>({x:(t[0].clientX+t[1].clientX)/2,y:(t[0].clientY+t[1].clientY)/2});

// Con acordes, en el celular: achica la hoja lo justo para que la línea más larga quepa sin partirse.
// Si la persona ya hizo zoom con los dedos (local.manual), se respeta su zoom.
function ajustar(){
  const h=$('#vh');if(!h||local.manual||local.abierto)return;   // con un cuadro abierto el zoom se queda como está
  let z=1;
  if(local.acordes&&matchMedia('(max-width:760px)').matches){
    h.style.zoom=1;
    const p=h.parentElement,cs=getComputedStyle(p),disp=p.clientWidth-parseFloat(cs.paddingLeft)-parseFloat(cs.paddingRight),need=h.offsetWidth;
    if(need>disp)z=Math.max(.5,disp/need);
  }
  local.zoom=z;h.style.zoom=z;
}
addEventListener('resize',()=>{if(!el||!location.hash.startsWith('#ver/')||innerWidth===anchoPrev)return;anchoPrev=innerWidth;ajustar()});   // al girar el celular

// Zoom con dos dedos (50% a 250%). El punto entre tus dedos se queda quieto: lo que lees no se mueve de lugar.
function zoomTactil(){
  const h=$('#vh');if(!h)return;
  h.ontouchstart=e=>{if(e.touches.length===2&&!local.abierto){distInicial=dist(e.touches);zoomInicial=local.zoom}};
  h.ontouchmove=e=>{
    if(local.abierto){if(e.touches.length===2)e.preventDefault();return}   // con un cuadro abierto no hay zoom (ni el del navegador)
    if(e.touches.length!==2||distInicial<=0)return;
    e.preventDefault();
    const nuevo=Math.min(2.5,Math.max(.5,zoomInicial*dist(e.touches)/distInicial)),k=nuevo/local.zoom,m=centro(e.touches);
    const a=h.getBoundingClientRect();
    local.zoom=nuevo;local.manual=true;h.style.zoom=nuevo;
    const b=h.getBoundingClientRect();
    scrollBy(0,b.top+(m.y-a.top)*k-m.y);                                  // sube o baja la página
    h.parentElement.scrollLeft+=b.left+(m.x-a.left)*k-m.x;                // y la mueve de lado si hace falta
  };
  h.ontouchend=e=>{if(e.touches.length<2)distInicial=0};
}

// ---------- 6. DESPLAZAMIENTO AUTOMÁTICO ----------
// El botón «Auto» (junto a «Acordes», en la barra de arriba) abre un panel con play/pausa y la barra de velocidad.
// Con el play activo la hoja baja sola a la velocidad elegida.
//  - A los 3 segundos de darle play, el panel se cierra y la barra de arriba se oculta (en el celular) para que se vean las letras.
//    Si subes la hoja con el dedo, la barra vuelve y a los 3 segundos se oculta otra vez. Tocar el botón o el panel reinicia esos 3 segundos,
//    y no se ocultan mientras tienes el dedo sobre el panel o sobre la hoja.
//  - Tocar el botón otra vez, o en cualquier otro lado, cierra el panel (el desplazamiento sigue).
//  - Mientras el dedo está sobre la hoja (subir, bajar, zoom) se pausa y sigue al soltar. También se pausa con un cuadro de tono o de escala abierto.
//  - Al llegar al final se detiene solo, y la barra vuelve a aparecer.
//  - Con el desplazamiento activo se pide que la pantalla no se apague (si el aparato lo permite).
// El botón y el panel se crean UNA vez y se vuelven a poner en la barra cada vez que la pantalla se redibuja (ponerAuto),
// así un cambio en el repertorio no cierra el panel ni le quita el dedo a la barra de velocidad.
// La velocidad solo vive en esta pantalla (como todo lo demás aquí): al recargar vuelve a la de inicio.
const auto={on:false,v:40,panel:false,tocando:false,dedoEnPanel:false,acum:0,ultimo:0,raf:0,luz:null,tOcultar:0};
const pxPorSeg=v=>2*Math.pow(30,v/100);     // la barra va de 0 a 100: 2 px por segundo (muy lento) hasta 60 px por segundo (rápido)
const ESPERA_OCULTAR=3000;                    // milisegundos antes de ocultar el panel y la barra
let caja=null;
const ICO_PLAY='<polygon points="7 4 20 12 7 20 7 4" fill="currentColor"/>',ICO_PAUSA='<rect x="6" y="4" width="4" height="16" rx="1" fill="currentColor"/><rect x="14" y="4" width="4" height="16" rx="1" fill="currentColor"/>';
const ICO_AUTO='<path d="M12 4v16M8 8l4-4 4 4M8 16l4 4 4-4"/>';   // una sola flecha que apunta arriba y abajo
function crearControl(){
  if(caja)return caja;
  caja=document.createElement('div');caja.className='vauto';
  caja.innerHTML=`<button type="button" class="vac2 vauto-b" data-auto aria-pressed="false" aria-expanded="false" aria-haspopup="true" aria-label="Desplazamiento automático">${svg(ICO_AUTO,16)}<span>Auto</span></button>
    <div class="vapan" role="group" aria-label="Desplazamiento automático" hidden><button type="button" class="vplay" data-play></button>
      <label class="vvel"><span class="et"><span>Lento</span><span>Velocidad</span><span>Rápido</span></span><input type="range" min="0" max="100" step="1" value="${auto.v}" aria-label="Velocidad del desplazamiento automático"></label></div>`;
  caja.addEventListener('click',e=>{
    if(e.target.closest('[data-auto]'))alternarPanel();
    else if(e.target.closest('[data-play]'))auto.on?parar():arrancar();
  });
  caja.addEventListener('input',e=>{if(e.target.type==='range'){auto.v=+e.target.value;programarOcultar()}});
  caja.addEventListener('pointerdown',()=>{auto.dedoEnPanel=true;programarOcultar()});
  const suelta=()=>{if(auto.dedoEnPanel){auto.dedoEnPanel=false;programarOcultar()}};
  caja.addEventListener('pointerup',suelta);caja.addEventListener('pointercancel',suelta);
  document.addEventListener('pointerup',suelta);document.addEventListener('pointercancel',suelta);   // por si el dedo se suelta fuera del panel
  document.addEventListener('click',e=>{if(auto.panel&&!caja.contains(e.target))cerrarPanel()});         // tocar en cualquier otro lado cierra el panel
  pintarAuto();
  return caja;
}
// ponerAuto: pone el botón (con su panel) en la barra de arriba, a la derecha de «Acordes»
function ponerAuto(){const b=el&&el.querySelector('.vbar');if(b)b.append(crearControl())}
function pintarAuto(){
  if(!caja)return;
  const p=caja.querySelector('[data-play]'),b=caja.querySelector('[data-auto]'),panel=caja.querySelector('.vapan');
  p.setAttribute('aria-pressed',String(auto.on));
  p.setAttribute('aria-label',auto.on?'Pausar el desplazamiento automático':'Activar el desplazamiento automático');
  p.title=auto.on?'Pausar':'Play';
  p.innerHTML=svg(auto.on?ICO_PAUSA:ICO_PLAY,22);
  b.setAttribute('aria-pressed',String(auto.on));                // igual que «Acordes»: se ve «encendido» mientras baja
  b.setAttribute('aria-expanded',String(auto.panel));
  panel.hidden=!auto.panel;
}
function alternarPanel(){auto.panel=!auto.panel;pintarAuto();programarOcultar()}
function cerrarPanel(){if(!auto.panel)return;auto.panel=false;pintarAuto()}
// La barra de arriba solo se oculta en el celular (en computadora se queda como estaba)
function fijarBarra(oculta){
  if(oculta&&!matchMedia('(max-width:760px)').matches)return;
  barraOculta=oculta;
  const b=el&&el.querySelector('.vbar');if(b)b.classList.toggle('oculta',oculta);
}
function mostrarBarra(){fijarBarra(false);programarOcultar()}
// programarOcultar: (re)inicia los 3 segundos. Solo con el play activo. Al cumplirse cierra el panel y oculta la barra,
// salvo que haya un dedo sobre el panel o sobre la hoja: entonces espera otros 3 segundos.
function programarOcultar(){
  clearTimeout(auto.tOcultar);auto.tOcultar=0;
  if(!auto.on)return;
  auto.tOcultar=setTimeout(()=>{
    auto.tOcultar=0;
    if(!auto.on)return;
    if(auto.dedoEnPanel||auto.tocando){programarOcultar();return}
    cerrarPanel();fijarBarra(true);
  },ESPERA_OCULTAR);
}
function arrancar(){
  if(auto.on)return;
  auto.on=true;auto.acum=0;auto.ultimo=0;pintarAuto();
  pedirLuz();
  programarOcultar();
  auto.raf=requestAnimationFrame(pasoAuto);
}
function parar(){
  clearTimeout(auto.tOcultar);auto.tOcultar=0;
  if(!auto.on&&!auto.raf)return;
  auto.on=false;cancelAnimationFrame(auto.raf);auto.raf=0;soltarLuz();
  fijarBarra(false);pintarAuto();                                // al detenerse, la barra vuelve a verse
}
function pasoAuto(t){
  if(!auto.on)return;
  const dt=auto.ultimo?Math.min(t-auto.ultimo,100)/1000:0;     // si la pestaña estuvo en segundo plano, no da un salto
  auto.ultimo=t;
  if(!auto.tocando&&!local.abierto){
    auto.acum+=pxPorSeg(auto.v)*dt;
    const n=Math.floor(auto.acum);                              // la pantalla solo se mueve de a píxeles enteros: lo que sobra se acumula
    if(n>=1){
      auto.acum-=n;
      try{scrollBy({top:n,left:0,behavior:'instant'})}catch(e){scrollBy(0,n)}
      if(scrollY+innerHeight>=document.documentElement.scrollHeight-1){parar();return}   // llegó al final
    }
  }
  auto.raf=requestAnimationFrame(pasoAuto);
}
// Mientras el dedo está sobre la hoja se pausa (así se puede subir, bajar o hacer zoom); al soltar, sigue.
addEventListener('touchstart',e=>{if(auto.on&&!(e.target.closest&&e.target.closest('.vauto')))auto.tocando=true},{passive:true});
const sueltaDedo=e=>{if(!e.touches||e.touches.length===0){if(auto.tocando)programarOcultar();auto.tocando=false;auto.ultimo=0}};
addEventListener('touchend',sueltaDedo,{passive:true});
addEventListener('touchcancel',sueltaDedo,{passive:true});
// Que la pantalla no se apague mientras baja (no todos los aparatos lo permiten; si falla, no pasa nada)
async function pedirLuz(){
  try{
    if(!navigator.wakeLock||auto.luz)return;
    const l=await navigator.wakeLock.request('screen');
    if(!auto.on){l.release();return}
    auto.luz=l;l.addEventListener('release',()=>{if(auto.luz===l)auto.luz=null});
  }catch(e){}
}
function soltarLuz(){try{if(auto.luz)auto.luz.release()}catch(e){}auto.luz=null}
document.addEventListener('visibilitychange',()=>{if(auto.on&&document.visibilityState==='visible')pedirLuz()});   // al volver a la pestaña se vuelve a pedir

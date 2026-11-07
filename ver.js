// =====================================================================
//  VER.JS  ·  Ventana «Compartir» de un repertorio  (dirección: #ver/ID)
//
//  Se abre SIN login (ver login.js). Muestra el repertorio limpio, sin el
//  menú de la app, con:
//   - un botón «Acordes» para mostrarlos u ocultarlos
//   - en cada canción, «Tono: X» se puede tocar para transponer esa canción
//   - en los eventos, junto a cada sección, un botón para ver su escala (equipo)
//   - en el celular, la barra de arriba se oculta al bajar y vuelve al subir
//
//  IMPORTANTE: todo lo que se cambia aquí (acordes, tonos, zoom) vive solo
//  en la pantalla de quien lo toca. No se guarda en Firebase, no cambia la
//  canción ni su editor, y al recargar o cerrar vuelve a como estaba.
//
//  MAPA:
//   1. ESTILOS
//   2. DATOS ............. repertorio y canciones (solo lectura)
//   3. TRANSPONER ........ copia de la canción con los acordes movidos
//   4. DIBUJAR ........... barra de arriba, hoja y panel de tono
//   5. EVENTOS ........... clics, teclas y zoom con dos dedos
// =====================================================================
import {$,esc,escuchar,vistas} from "./base.js";
import {MOM,fechaLarga,cancion,textoHtml,textosDespues,esPeticiones} from "./hoja.js";
import {textoEquipo,htmlMiembros,alCambiarEquipos} from "./equipos.js";
import {MAY,MEN,usaSostenidos,tokensAcorde,transponerChars,raizTono,esMenor,nombreTono,ix} from "./musica.js";

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
@media print{.vbar,.tdd{display:none!important}.vzona{padding:0}.vzona .hojap{box-shadow:none;padding:0}}`;
document.head.append(st);

// ---------- 2. DATOS (solo lectura) ----------
let R=null,C=null,A=[],el=null,id=null;
// Lo que cambia cada persona en su pantalla. Se pierde al recargar (a propósito).
const local={acordes:null,tonos:{},abierto:null,zoom:1,manual:false};
let barraOculta=false;
escuchar('repertorios',l=>{R=l;pintar()});
alCambiarEquipos(()=>pintar());
escuchar('canciones',l=>{C=l;pintar()});
escuchar('albumes',l=>{A=l||[];pintar()});
const albDe=c=>(A.find(a=>a.id===c.albumId)||{}).nombre||'';   // nombre del álbum de una canción

vistas.ver=(e,rid)=>{
  if(id!==rid){id=rid;local.acordes=null;local.tonos={};local.abierto=null;local.zoom=1;local.manual=false}
  el=e;el.onclick=clic;el.onkeydown=tecla;
  pintar();
};
addEventListener('hashchange',()=>{if(!location.hash.startsWith('#ver/'))el=null});

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
const svg=(d,s=18)=>`<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const medio=d=>{const n=d>6?d-12:d;if(!n)return '';const a=Math.abs(n),t=(a>=2?Math.floor(a/2):'')+(a%2?'½':'');return (n>0?'+':'−')+t};   // 3 semitonos → «+1½»

// Las canciones del repertorio, en orden, cada una con una clave propia (así cada una se transpone por separado)
function bloques(r){
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
  if(!R||!C){el.innerHTML='<div class="vmsg"><p>Cargando repertorio…</p></div>';return}
  const r=R.find(x=>x.id===id);
  if(!r){document.title='Repertorio no encontrado';el.innerHTML='<div class="vmsg"><h1>No encontramos este repertorio</h1><p>Puede que lo hayan eliminado o que el enlace esté incompleto. Pide a quien te lo envió que lo comparta otra vez.</p></div>';return}
  document.title=(r.nombre||'Repertorio')+(r.fecha?' · '+fechaLarga(r.fecha):'');
  if(local.acordes===null)local.acordes=!!r.acordes;
  const ac=local.acordes;
  const hoja=bloques(r).map(b=>{
    if(b.tx)return `<div class="blk">${b.titulo?`<div class="lab">${esc(b.titulo)}</div>`:''}${textoHtml(b.t)}</div>`;   // texto escrito a mano
    const canciones=b.items.map(({clave,cid})=>{
      const c0=C.find(x=>x.id===cid);if(!c0)return '';
      const d=local.tonos[clave]||0,c=transpuesta(c0,d),abierto=local.abierto===clave;
      const tono=t=>!transponible(c0)?'':`<span class="tdd"><button class="tono-b" data-tono="${clave}" aria-expanded="${abierto}" aria-label="Cambiar tono de ${esc(c0.titulo)}${t?', ahora '+esc(t):''}">${t?`Tono: ${esc(t)}`:'Tono'}${d?` <span class="dif">${medio(d)}</span>`:''} ${svg('<path d="M6 9l6 6 6-6"/>',13)}</button></span>`;
      return cancion(c,ac,{tono,album:b.sin?'':albDe(c0)});
    }).join('');
    return canciones?`<div class="blk"><div class="lab labx"><span>${esc(b.titulo)}</span>${r.tipo==='evento'?botonEquipo(b):''}</div>${canciones}</div>`:'';
  }).join('')||'<div class="falta">Este repertorio aún no tiene canciones.</div>';
  let cuadro='';   // el cuadro abierto (tono o escala), fuera de la hoja para que el zoom no lo afecte
  if(local.abierto){
    if(local.abierto.startsWith('eq:')){const b=bloques(r).find(x=>'eq:'+x.id===local.abierto);if(b)cuadro=panelEquipo(b)}
    else{const c0=C.find(x=>x.id===local.abierto.split(':').pop());if(c0)cuadro=panel(c0,local.abierto)}
  }
  el.innerHTML=`<div class="vbar${barraOculta?' oculta':''}"><div class="vt2"><h1>${esc(r.nombre||'Repertorio')}</h1>${r.fecha?`<small>${esc(fechaLarga(r.fecha))}</small>`:''}</div>
      <button class="vac2" data-acordes aria-pressed="${ac}"><span class="vchk2">${ac?svg('<path d="M20 6L9 17l-5-5"/>',12):''}</span>Acordes</button></div>
        <div class="vzona"><div class="hojap${ac?' conac':''}" id="vh" style="zoom:${local.zoom}">${hoja}</div></div>${cuadro}`;
  ajustar();zoomTactil();
}

// ---------- 5. EVENTOS ----------
// redibuja y deja el cursor en el mismo botón (para quien usa teclado)
function repinta(sel){pintar();if(sel){const b=el&&el.querySelector(sel);if(b)b.focus()}}

function clic(e){
  const b=e.target.closest('button');
  if(!b){if(local.abierto&&!e.target.closest('.tpan')){local.abierto=null;pintar()}return}
  if(b.dataset.eqb){const k=b.dataset.eqb;local.abierto=local.abierto===k?null:k;return repinta(`[data-eqb="${k}"]`)}
  const d=b.dataset,c=k=>C.find(x=>x.id===k.split(':').pop());
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
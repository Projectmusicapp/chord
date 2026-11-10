// =====================================================================
//  MISIONES.JS  ·  Datos de las misiones y el selector con banderas
//
//  Una misión es un equipo con su propio espacio (canciones propias,
//  calendario, escalas y repertorio). Cada cuenta «mision», «editor de
//  misión» o «usuario» pertenece a UNA misión: su campo «misionId» guarda
//  el id de la misión (ver ambitoActual en base.js).
//
//  Cada misión guarda:  pais (nombre del país), codigo (2 letras, para la
//  bandera) y nombre (el nombre de la misión).
//
//  La pantalla donde se ven y gestionan (altas, bajas, su equipo anidado)
//  es «Configuración», dentro de usuarios.js — este archivo solo guarda
//  los datos y el selector desplegable con banderas que usan tanto esa
//  pantalla como el autorregistro (login.js).
//
//  MAPA DE ESTE ARCHIVO (usa Ctrl+F para encontrar cada parte):
//   1. PAÍSES ............... la lista de países (con su código de bandera)
//   2. DATOS ................ leer misiones y lo que usan otras pantallas
//   3. ESTILOS .............. el selector desplegable con banderas
// =====================================================================
import {esc,escuchar} from "./base.js";
import {BANDERAS} from "./banderas.js";

// ---------------------------------------------------------------------
// 1. PAÍSES  [código, nombre]  (toda América y Puerto Rico, en español).
//    Para añadir uno: agrega su código y nombre aquí y su bandera en banderas.js.
// ---------------------------------------------------------------------
export const alfa=(a,b)=>String(a||'').localeCompare(String(b||''),'es',{sensitivity:'base'});
export const PAISES=[
  ['AG','Antigua y Barbuda'],['AR','Argentina'],['BS','Bahamas'],['BB','Barbados'],['BZ','Belice'],['BO','Bolivia'],
  ['BR','Brasil'],['CA','Canadá'],['CL','Chile'],['CO','Colombia'],['CR','Costa Rica'],['CU','Cuba'],
  ['DM','Dominica'],['EC','Ecuador'],['SV','El Salvador'],['US','Estados Unidos'],['GD','Granada'],['GT','Guatemala'],
  ['GY','Guyana'],['HT','Haití'],['HN','Honduras'],['JM','Jamaica'],['MX','México'],['NI','Nicaragua'],
  ['PA','Panamá'],['PY','Paraguay'],['PE','Perú'],['PR','Puerto Rico'],['DO','República Dominicana'],
  ['KN','San Cristóbal y Nieves'],['VC','San Vicente y las Granadinas'],['LC','Santa Lucía'],['SR','Surinam'],
  ['TT','Trinidad y Tobago'],['UY','Uruguay'],['VE','Venezuela']
].sort((a,b)=>alfa(a[1],b[1]));

// ---------------------------------------------------------------------
// 2. DATOS  (lo que también usan usuarios.js y login.js)
// ---------------------------------------------------------------------
let M=[],listo=false;
const esperando=[],oyentes=[];
const marcarListo=()=>{if(!listo){listo=true;esperando.forEach(r=>r());esperando.length=0}};
export const misionesCargadas=()=>listo?Promise.resolve():new Promise(r=>esperando.push(r));
export const alCambiarMisiones=fn=>{oyentes.push(fn)};
// Ordenadas por país (A-Z) y, dentro de un país, por nombre.
export const listaMisiones=()=>[...M].sort((a,b)=>alfa(a.pais,b.pais)||alfa(a.nombre,b.nombre));
export const misionPorId=id=>M.find(m=>m.id===id)||null;
export const etiquetaMision=m=>m.pais?`${m.nombre} · ${m.pais}`:(m.nombre||'');
export const banderaHtml=(codigo,pais)=>BANDERAS[codigo]
  ?`<img class="bandera" src="${BANDERAS[codigo]}" alt="Bandera de ${esc(pais||'')}" width="34" height="25">`
  :'<span class="bandera vacia" aria-hidden="true"></span>';

escuchar('misiones',l=>{M=l;marcarListo();oyentes.forEach(f=>f())},
  err=>{console.error('No se pudieron leer las misiones:',err);marcarListo()});   // si falla la lectura, la app no se queda esperando

// ---- Selector desplegable con bandera ----
// selectorBandera(...) devuelve el HTML; luego se llama activarSelectores(contenedor) una vez
// puesto ese HTML en la página. Guarda lo elegido en un <input type="hidden"> con el mismo
// id/name, así que se lee con .value y avisa con el evento «change», igual que un <select>.
// opciones: [{valor, texto, codigo}]  (codigo = código del país, para su bandera)
const FLECHA='<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>';
const contenidoBoton=(o,placeholder)=>o
  ?`${banderaHtml(o.codigo,o.texto)}<span class="sb-tx">${esc(o.texto)}</span>${FLECHA}`
  :`<span class="sb-tx vacio">${esc(placeholder)}</span>${FLECHA}`;
export function selectorBandera({id,name,opciones,valor='',placeholder='Elige…'}){
  const sel=opciones.find(o=>o.valor===valor);
  return `<div class="sb" data-sb data-ph="${esc(placeholder)}"><input type="hidden" id="${esc(id||'')}" name="${esc(name||'')}" value="${esc(sel?sel.valor:'')}">
    <button type="button" class="sb-btn" aria-haspopup="listbox" aria-expanded="false">${contenidoBoton(sel,placeholder)}</button>
    <div class="sb-lista" role="listbox" hidden>${opciones.map(o=>`<button type="button" role="option" class="sb-op" data-v="${esc(o.valor)}" data-t="${esc(o.texto)}" data-c="${esc(o.codigo||'')}" aria-selected="${o.valor===valor}">${banderaHtml(o.codigo,o.texto)}<span class="sb-tx">${esc(o.texto)}</span></button>`).join('')}</div></div>`;
}
function cerrarSB(s){
  const l=s.querySelector('.sb-lista');if(l)l.hidden=true;
  s.classList.remove('abierto');
  const b=s.querySelector('.sb-btn');if(b)b.setAttribute('aria-expanded','false');
}
let sbGlobal=false;
export function activarSelectores(raiz){
  if(!sbGlobal){
    sbGlobal=true;
    document.addEventListener('click',e=>document.querySelectorAll('.sb.abierto').forEach(s=>{if(!s.contains(e.target))cerrarSB(s)}));
  }
  raiz.querySelectorAll('.sb[data-sb]:not([data-activo])').forEach(s=>{
    s.dataset.activo='1';
    const entrada=s.querySelector('input[type=hidden]'),boton=s.querySelector('.sb-btn'),lista=s.querySelector('.sb-lista');
    const ops=()=>[...lista.querySelectorAll('.sb-op')];
    const abrir=()=>{
      lista.hidden=false;s.classList.add('abierto');boton.setAttribute('aria-expanded','true');
      const o=ops().find(x=>x.getAttribute('aria-selected')==='true')||ops()[0];
      if(o){o.focus();o.scrollIntoView({block:'nearest'})}
    };
    s.addEventListener('click',e=>{
      e.preventDefault();                                   // el <label> que lo envuelva no debe repetir el clic
      const op=e.target.closest('.sb-op');
      if(op){
        const cambia=entrada.value!==op.dataset.v;
        entrada.value=op.dataset.v;
        ops().forEach(x=>x.setAttribute('aria-selected',String(x===op)));
        boton.innerHTML=contenidoBoton({texto:op.dataset.t,codigo:op.dataset.c},s.dataset.ph);
        cerrarSB(s);boton.focus();
        if(cambia)entrada.dispatchEvent(new Event('change',{bubbles:true}));
      }else if(e.target.closest('.sb-btn')){s.classList.contains('abierto')?cerrarSB(s):abrir()}
    });
    s.addEventListener('keydown',e=>{
      const abierto=s.classList.contains('abierto');
      if(e.key==='Escape'&&abierto){e.preventDefault();e.stopPropagation();cerrarSB(s);boton.focus();return}
      if(e.key==='ArrowDown'||e.key==='ArrowUp'){
        e.preventDefault();
        if(!abierto)return abrir();
        const l=ops(),i=l.indexOf(document.activeElement),n=e.key==='ArrowDown'?i+1:i-1;
        if(l[n])l[n].focus();
      }
    });
  });
}

// ---------------------------------------------------------------------
// 3. ESTILOS  (el selector desplegable con banderas; lo demás vive en usuarios.js)
// ---------------------------------------------------------------------
const hoja=document.createElement('style');
hoja.textContent=`.bandera{width:34px;height:25px;flex:none;display:block;object-fit:contain}.bandera.vacia{background:var(--suave);border-radius:4px}
.sb{position:relative;display:block;width:100%}
.sb .sb-btn{display:flex;align-items:center;gap:10px;width:100%;min-height:44px;padding:8px 12px;background:var(--blanco);color:var(--tx);border:1px solid var(--linea);border-radius:var(--r-m);font-weight:600;text-align:left;justify-content:flex-start}
.sb .sb-btn:hover{filter:none;background:var(--capa)}
.sb .sb-tx{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.sb .sb-tx.vacio{color:var(--gris);font-weight:500}
.sb .sb-btn svg{flex:none;transition:transform .2s}
.sb.abierto .sb-btn svg{transform:rotate(180deg)}
.sb .sb-lista{margin-top:6px;max-height:240px;overflow:auto;background:var(--blanco);border:1px solid var(--linea);border-radius:var(--r-m);box-shadow:var(--sombra-2);display:grid}
.sb .sb-lista[hidden]{display:none}
.sb .sb-op{display:flex;align-items:center;gap:10px;width:100%;min-height:42px;padding:6px 12px;background:transparent;color:var(--tx);border:0;border-radius:0;font-weight:600;text-align:left;justify-content:flex-start}
.sb .sb-op:hover,.sb .sb-op:focus-visible{filter:none;background:var(--capa)}
.sb .sb-op[aria-selected=true]{background:var(--suave);color:var(--azul)}
.sb .bandera{width:28px;height:21px}`;
document.head.append(hoja);

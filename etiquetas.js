// =====================================================================
//  ETIQUETAS.JS  ·  Pantalla para crear, editar y borrar etiquetas
//  Se abre desde el panel «Configuración» (botón de la foto, arriba a la derecha) → «Etiquetas».
//  Es una pantalla completa (dirección #etiquetas), ya no una ventanita.
//  Solo la ven quienes pueden editar (igual que el antiguo botón de Canciones).
//
//  ===== CHIGO · CAMBIOS EN ESTE ARCHIVO =====
//  Las etiquetas ahora se muestran en grupos separados: «Misas» y «Otros».
//  Cada etiqueta guarda un campo nuevo  grupo: 'misa' | 'otro'.
//  Las que ya existían (sin «grupo») cuentan como «Misas», así no se rompe nada.
//   - «Otros» lo usan las secciones de los eventos (repertorio.js) y «Mi lista» (milista.js).
//   - Cada grupo con cuadro de texto tiene su propio «Nueva etiqueta» (ids nt-misa y nt-otro).
//   - Editar, renombrar y eliminar siguen igual, dentro de cada grupo.
//  ===== FIN CHIGO =====
//
//  ===== TIEMPO LITÚRGICO · CAMBIOS EN ESTE ARCHIVO =====
//  Hay un tercer grupo, «Tiempos litúrgicos» (grupo:'tiempo'), entre «Misas» y «Otros».
//   - Son 5 etiquetas fijas (los mismos tiempos de liturgico.js): Adviento, Navidad, Cuaresma,
//     Triduo Pascual y Pascua. Se crean solas (asegurarTiempos) y no se pueden añadir ni eliminar;
//     el nombre sí se puede cambiar (cada una guarda su clave en el campo «tiempo»).
//   - El Tiempo Ordinario NO tiene etiqueta: toda canción sin etiqueta de tiempo es «ordinaria».
//   - Las usan repertorio.js (qué canciones ofrecer según la fecha) y editor.js (el desplegable).
//  Todo lo nuevo está entre «TIEMPOS» y «FIN TIEMPOS» (o termina en «// TIEMPOS»).
//  ===== FIN TIEMPO LITÚRGICO =====
//
//  ===== PANTALLA COMPLETA · CAMBIOS EN ESTE ARCHIVO =====
//  Antes: ventanita (modal) con  etiquetas(alCerrar)  desde el botón «Etiquetas» de Canciones.
//  Ahora: vistas.etiquetas (pantalla completa). Los grupos van en columnas en PC y uno debajo
//  del otro en celular. Ya no hay botón de cerrar: se sale con el menú de arriba.
//  Todo lo de esto termina en «// PANTALLA» o está entre «PANTALLA» y «FIN PANTALLA».
//  ===== FIN PANTALLA COMPLETA =====
// =====================================================================
import {$,esc,guardar,crear,eliminar,ic,vistas,puedeEditar,ambitoActual} from "./base.js";   // PANTALLA: vistas y puedeEditar en lugar de modal
import {E,alCambiar} from "./estado.js";

// ===== TIEMPOS · etiquetas fijas de tiempo litúrgico =====
export const TIEMPOS=['Adviento','Navidad','Cuaresma','Triduo Pascual','Pascua'];      // los mismos nombres que devuelve liturgico.js
const pedidas=new Set();                                                                // las que ya se mandaron a crear (para no duplicarlas)
// Crea las que falten. Solo actúa cuando las etiquetas ya cargaron (si no, crearía duplicados).
export function asegurarTiempos(){
  if(!E.etiquetas.length)return;
  TIEMPOS.forEach(n=>{
    const clave=ambitoActual()+'|'+n;
    if(pedidas.has(clave)||E.etiquetas.some(t=>t.grupo==='tiempo'&&(t.tiempo||t.nombre)===n))return;
    pedidas.add(clave);crear('etiquetas',{nombre:n,grupo:'tiempo',tiempo:n});
  });
}
// ===== FIN TIEMPOS =====

// ===== PANTALLA · estado de la pantalla =====
let zona=null;                                   // el contenedor de la pantalla (null = no estamos en #etiquetas)
let modoEditar=false;                            // ¿está activado el botón «Editar»?
let dejarDeEscuchar=()=>{};
// ===== FIN PANTALLA =====

const GRUPOS=[['misa','Misas'],['tiempo','Tiempos lit\u00fargicos'],['otro','Otros']];   // TIEMPOS: grupo nuevo en medio
const grupoDe=t=>t.grupo==='otro'?'otro':t.grupo==='tiempo'?'tiempo':'misa';   // las etiquetas viejas (sin grupo) son de misa
const bloqueGrupos=()=>GRUPOS.map(([g,titulo])=>{
  const lista=E.etiquetas.filter(t=>grupoDe(t)===g),fijo=g==='tiempo';                 // TIEMPOS: «fijo» = sin cuadro para a\u00f1adir ni bot\u00f3n de eliminar
  return `<section class="te-grupo" style="background:var(--blanco);border:1px solid var(--linea);border-radius:14px;padding:16px"><h3 style="margin:0 0 10px;font-size:16px">${titulo}</h3>
    ${fijo?'<p class="vacio" style="margin:0 0 8px">Las usa el Repertorio seg\u00fan la fecha. El Tiempo Ordinario no lleva etiqueta.</p>'
    :`<div class="barra"><input id="nt-${g}" placeholder="Nueva etiqueta" aria-label="Nueva etiqueta de ${titulo.toLowerCase()}" autocomplete="off"><button data-add="${g}">${ic('pls',16)} A\u00f1adir</button></div>`}
    <div class="tags">${lista.map(t=>modoEditar
      ?`<span class="tag"><input data-te="${t.id}" value="${esc(t.nombre)}" aria-label="Nombre">${fijo?'':`<button class="ic" data-tx="${t.id}" aria-label="Eliminar">${ic('trs',14)}</button>`}</span>`
      :`<span class="tag">${esc(t.nombre)}</span>`).join('')||'<p class="vacio">Sin etiquetas.</p>'}</div></section>`;
}).join('');

// Dibuja la pantalla (se llama cada vez que algo cambia)
function dibujar(){
  if(!zona||!zona.isConnected){dejarDeEscuchar();return}                          // PANTALLA: ya saliste de esta pantalla
  asegurarTiempos();                                                              // TIEMPOS: crea las 5 etiquetas de tiempo si faltan
  const activo=document.activeElement,enCampo=activo&&zona.contains(activo)?(activo.id||activo.dataset.te||null):null,texto=activo&&activo.id&&activo.id.startsWith('nt-')?activo.value:'';
  // PANTALLA: encabezado de pantalla + los grupos en columnas (en celular caen uno debajo del otro)
  zona.innerHTML=`<div class="ch2"><h1>Etiquetas</h1><button class="${modoEditar?'':'sec'}" data-ed>${modoEditar?'Listo':ic('edt',16)+' Editar'}</button></div>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,300px),1fr));gap:16px;align-items:start">${bloqueGrupos()}</div>`;
  if(enCampo){const esNuevo=enCampo.startsWith('nt-'),c=esNuevo?$('#'+enCampo,zona):zona.querySelector(`[data-te="${enCampo}"]`);if(c){if(esNuevo)c.value=texto;c.focus()}}   // el cursor se queda donde estaba
}

// Añadir una etiqueta nueva con lo escrito en el cuadro
const añadir=grupo=>{const campo=$('#nt-'+grupo,zona),nombre=campo.value.trim();if(nombre){crear('etiquetas',{nombre,grupo});campo.value=''}};   // recibe el grupo ('misa' u 'otro') y lo guarda en la etiqueta

// ===== PANTALLA · la vista =====
vistas.etiquetas=contenedor=>{
  dejarDeEscuchar();
  if(!puedeEditar()){zona=null;contenedor.innerHTML='<p class="vacio">No tienes acceso a esta pantalla.</p>';return}
  zona=contenedor;modoEditar=false;
  contenedor.onclick=e=>{
    const boton=e.target.closest('button');if(!boton)return;const d=boton.dataset;
    if(d.ed!=null){modoEditar=!modoEditar;dibujar()}                    // activar o desactivar «Editar»
    else if(d.add!=null)añadir(d.add);                                  // añadir (d.add trae el grupo)
    else if(d.tx){const t=E.etiquetas.find(x=>x.id===d.tx);eliminar('etiquetas',t,'',true)}   // borrar
  };
  contenedor.onkeydown=e=>{if(e.key==='Enter'&&e.target.id&&e.target.id.startsWith('nt-')){e.preventDefault();añadir(e.target.id.slice(3))}};   // Enter en cualquiera de los cuadros
  contenedor.onchange=e=>{                                              // renombrar (si queda en blanco, se elimina)
    const caja=e.target,t=caja.dataset.te&&E.etiquetas.find(x=>x.id===caja.dataset.te);
    if(!t)return;const nuevo=caja.value.trim();
    if(!nuevo){if(t.grupo==='tiempo')dibujar();else eliminar('etiquetas',t,'',true)}   // TIEMPOS: las de tiempo no se eliminan (en blanco vuelve el nombre)
    else guardar('etiquetas',t.id,{nombre:nuevo});
  };
  dejarDeEscuchar=alCambiar(dibujar);
  dibujar();
};
addEventListener('hashchange',()=>{if(location.hash!=='#etiquetas'){dejarDeEscuchar();dejarDeEscuchar=()=>{};zona=null}});   // al salir de la pantalla se deja de escuchar
// ===== FIN PANTALLA =====

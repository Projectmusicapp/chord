// =====================================================================
//  ETIQUETAS.JS  ·  Ventana para crear, editar y borrar etiquetas
//  Se abre con  etiquetas(alCerrar)  desde el botón «Etiquetas».
//
//  ===== CHIGO · CAMBIOS EN ESTE ARCHIVO =====
//  Las etiquetas ahora se muestran en dos grupos separados: «Misas» y «Otros».
//  Cada etiqueta guarda un campo nuevo  grupo: 'misa' | 'otro'.
//  Las que ya existían (sin «grupo») cuentan como «Misas», así no se rompe nada.
//   - «Otros» lo usan las secciones de los eventos (repertorio.js) y «Mi lista» (milista.js).
//   - Cada grupo tiene su propio cuadro «Nueva etiqueta» (ids nt-misa y nt-otro).
//   - Editar, renombrar y eliminar siguen igual, dentro de cada grupo.
//  Líneas nuevas o cambiadas: terminan en «// Chigo» o están entre «CHIGO» y «FIN CHIGO».
//  ===== FIN CHIGO =====
// =====================================================================
import {$,esc,guardar,crear,eliminar,ic,modal} from "./base.js";
import {E,alCambiar} from "./estado.js";

export function etiquetas(alCerrar){
  let modoEditar=false;                          // ¿está activado el botón «Editar»?
  let dejarDeEscuchar=()=>{};
  const ventana=modal('<div id="te"></div>'),zona=$('#te',ventana);

  // ===== CHIGO · Grupos «Misas» y «Otros» =====
  const GRUPOS=[['misa','Misas'],['otro','Otros']];
  const grupoDe=t=>t.grupo==='otro'?'otro':'misa';                 // las etiquetas viejas (sin grupo) son de misa
  const bloqueGrupos=()=>GRUPOS.map(([g,titulo])=>{
    const lista=E.etiquetas.filter(t=>grupoDe(t)===g);
    return `<section class="te-grupo"><h3 style="margin:18px 0 8px;font-size:15px">${titulo}</h3>
      <div class="barra"><input id="nt-${g}" placeholder="Nueva etiqueta" aria-label="Nueva etiqueta de ${titulo.toLowerCase()}" autocomplete="off"><button data-add="${g}">${ic('pls',16)} A\u00f1adir</button></div>
      <div class="tags">${lista.map(t=>modoEditar
        ?`<span class="tag"><input data-te="${t.id}" value="${esc(t.nombre)}" aria-label="Nombre"><button class="ic" data-tx="${t.id}" aria-label="Eliminar">${ic('trs',14)}</button></span>`
        :`<span class="tag">${esc(t.nombre)}</span>`).join('')||'<p class="vacio">Sin etiquetas.</p>'}</div></section>`;
  }).join('');
  // ===== FIN CHIGO =====

  // Dibuja el contenido de la ventana (se llama cada vez que algo cambia)
  function dibujar(){
    if(!ventana.isConnected){dejarDeEscuchar();if(alCerrar)alCerrar();return}   // la ventana ya se cerró
    const activo=document.activeElement,enCampo=activo&&zona.contains(activo)?(activo.id||activo.dataset.te||null):null,texto=activo&&activo.id&&activo.id.startsWith('nt-')?activo.value:'';   // Chigo: ahora hay dos cuadros de texto (nt-misa y nt-otro)
    zona.innerHTML=`<div class="mh"><h2>Etiquetas</h2><div class="mb"><button class="${modoEditar?'':'sec'}" data-ed>${modoEditar?'Listo':ic('edt',16)+' Editar'}</button><button class="ic" data-cx aria-label="Cerrar">${ic('x')}</button></div></div>
      ${/* Chigo: los dos grupos (Misas y Otros) se dibujan con bloqueGrupos(), definido arriba */ bloqueGrupos()}`;
    if(enCampo){const esNuevo=enCampo.startsWith('nt-'),c=esNuevo?$('#'+enCampo,ventana):zona.querySelector(`[data-te="${enCampo}"]`);if(c){if(esNuevo)c.value=texto;c.focus()}}   // Chigo: el cursor se queda donde estaba (ahora con dos cuadros «nt-»)
  }
  dejarDeEscuchar=alCambiar(dibujar);
  dibujar();

  // Añadir una etiqueta nueva con lo escrito en el cuadro
  const añadir=grupo=>{const campo=$('#nt-'+grupo,ventana),nombre=campo.value.trim();if(nombre){crear('etiquetas',{nombre,grupo});campo.value=''}};   // Chigo: recibe el grupo ('misa' u 'otro') y lo guarda en la etiqueta

  ventana.onclick=e=>{
    const boton=e.target.closest('button');if(!boton)return;const d=boton.dataset;
    if(d.cx!=null){ventana.remove();dibujar()}                         // cerrar
    else if(d.ed!=null){modoEditar=!modoEditar;dibujar()}              // activar o desactivar «Editar»
    else if(d.add!=null)añadir(d.add);                                    // Chigo: añadir (d.add trae el grupo)
    else if(d.tx){const t=E.etiquetas.find(x=>x.id===d.tx);eliminar('etiquetas',t,'',true)}   // borrar
  };
  ventana.onkeydown=e=>{if(e.key==='Enter'&&e.target.id&&e.target.id.startsWith('nt-')){e.preventDefault();añadir(e.target.id.slice(3))}};   // Chigo: Enter en cualquiera de los dos cuadros
  ventana.onchange=e=>{                                                // renombrar (si queda en blanco, se elimina)
    const caja=e.target,t=caja.dataset.te&&E.etiquetas.find(x=>x.id===caja.dataset.te);
    if(!t)return;const nuevo=caja.value.trim();
    if(!nuevo)eliminar('etiquetas',t,'',true);else guardar('etiquetas',t.id,{nombre:nuevo});
  };
}

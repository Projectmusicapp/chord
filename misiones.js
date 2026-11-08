// =====================================================================
//  MISIONES.JS  ·  La pantalla «Misiones» (solo para el Administrador)
//
//  Una misión es lo mismo que un «ministerio»: un equipo con su propio
//  espacio (canciones propias, calendario, escalas y repertorio). Cada
//  cuenta «ministerio» o «usuario» pertenece a UNA misión: su campo
//  «ministerioId» guarda el id de la misión (ver ambitoActual en base.js).
//
//  Cada misión guarda:  pais (nombre del país), codigo (2 letras, para la
//  bandera) y nombre (el nombre de la misión).
//
//  MAPA DE ESTE ARCHIVO (usa Ctrl+F para encontrar cada parte):
//   1. PAÍSES ............... la lista de países (con su código de bandera)
//   2. DATOS ................ leer misiones y lo que usan otras pantallas
//   3. ESTILOS .............. colores y tamaños de esta pantalla
//   4. PANTALLA ............. la lista de misiones y sus botones
//   5. FORMULARIO ........... la ventanita para añadir o editar una misión
// =====================================================================
import {$,esc,guardar,crear,eliminar,escuchar,vistas,ic,modal,aviso,esNivelAdmin} from "./base.js";
import {BANDERAS} from "./banderas.js";

// ---------------------------------------------------------------------
// 1. PAÍSES  [código, nombre]  (toda América y Puerto Rico, en español).
//    Para añadir uno: agrega su código y nombre aquí y su bandera en banderas.js.
// ---------------------------------------------------------------------
const alfa=(a,b)=>String(a||'').localeCompare(String(b||''),'es',{sensitivity:'base'});
export const PAISES=[
  ['AG','Antigua y Barbuda'],['AR','Argentina'],['BS','Bahamas'],['BB','Barbados'],['BZ','Belice'],['BO','Bolivia'],
  ['BR','Brasil'],['CA','Canadá'],['CL','Chile'],['CO','Colombia'],['CR','Costa Rica'],['CU','Cuba'],
  ['DM','Dominica'],['EC','Ecuador'],['SV','El Salvador'],['US','Estados Unidos'],['GD','Granada'],['GT','Guatemala'],
  ['GY','Guyana'],['HT','Haití'],['HN','Honduras'],['JM','Jamaica'],['MX','México'],['NI','Nicaragua'],
  ['PA','Panamá'],['PY','Paraguay'],['PE','Perú'],['PR','Puerto Rico'],['DO','República Dominicana'],
  ['KN','San Cristóbal y Nieves'],['VC','San Vicente y las Granadinas'],['LC','Santa Lucía'],['SR','Surinam'],
  ['TT','Trinidad y Tobago'],['UY','Uruguay'],['VE','Venezuela']
].sort((a,b)=>alfa(a[1],b[1]));
const NOMBRE_PAIS=Object.fromEntries(PAISES);

// ---------------------------------------------------------------------
// 2. DATOS  (lo que también usan usuarios.js y login.js)
// ---------------------------------------------------------------------
let M=[],C=[],listo=false,el=null;     // M = misiones, C = cuentas (solo para contar cuántas tiene cada misión)
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

escuchar('misiones',l=>{M=l;marcarListo();if(el)pintar();oyentes.forEach(f=>f())},
  err=>{console.error('No se pudieron leer las misiones:',err);marcarListo()});   // si falla la lectura, la app no se queda esperando
escuchar('usuarios',l=>{C=l;if(el)pintar()});
const cuentasDe=m=>C.filter(u=>u.rol!=='admin'&&u.ministerioId===m.id).length;

// ---------------------------------------------------------------------
// 3. ESTILOS
// ---------------------------------------------------------------------
const hoja=document.createElement('style');
hoja.textContent=`[data-vista=misiones] .mlist{display:grid;gap:8px;margin-top:14px}
.mfila{display:flex;align-items:center;gap:14px;background:var(--capa);border-radius:var(--r-m);padding:10px 12px;flex-wrap:wrap}
.mfila .un{flex:1;min-width:160px}.mfila b{display:block}.mfila small{display:block;color:var(--gris);font-weight:500}
.mfila .mb2{display:flex;gap:6px}
.bandera{width:34px;height:25px;flex:none;display:block;object-fit:contain}.bandera.vacia{background:var(--suave);border-radius:4px}
.selpais{display:flex;align-items:center;gap:10px}.selpais select{flex:1;min-width:0}#vb{display:flex;min-width:34px}`;
document.head.append(hoja);

// ---------------------------------------------------------------------
// 4. PANTALLA
// ---------------------------------------------------------------------
vistas.misiones=contenedor=>{
  if(!esNivelAdmin()){contenedor.innerHTML='<p class="vacio">No tienes acceso a esta pantalla.</p>';return}
  el=contenedor;el.onclick=clic;pintar();
};
addEventListener('hashchange',()=>{if(location.hash!=='#misiones')el=null});

function pintar(){
  if(!el)return;
  el.innerHTML=`<div class="ch2"><h1>Misiones</h1><button data-nm>${ic('pls',16)} Añadir misión</button></div>
    <div class="mlist">${listaMisiones().map(fila).join('')||'<p class="vacio">Aún no hay misiones. Pulsa «Añadir misión» para crear la primera.</p>'}</div>`;
}

// fila: una misión = bandera, nombre (y debajo el país y cuántas cuentas tiene) y sus botones.
function fila(m){
  const n=cuentasDe(m),sub=[m.pais,n?`${n} ${n===1?'cuenta':'cuentas'}`:''].filter(Boolean).join(' · ');
  return `<div class="mfila">${banderaHtml(m.codigo,m.pais)}<div class="un"><b>${esc(m.nombre)}</b><small>${esc(sub)}</small></div>
    <div class="mb2"><button class="sec" data-ed="${m.id}">${ic('edt',15)} Editar</button><button class="ic rj" data-el="${m.id}" aria-label="Eliminar la misión ${esc(m.nombre)}" title="Eliminar">${ic('trs',16)}</button></div></div>`;
}

function clic(e){
  const b=e.target.closest('button');if(!b||!esNivelAdmin())return;
  const d=b.dataset;
  if(d.nm!=null)formulario(null);
  else if(d.ed)formulario(misionPorId(d.ed));
  else if(d.el){
    const m=misionPorId(d.el);if(!m)return;
    const n=cuentasDe(m);
    if(n)return alert(`Esta misión tiene ${n} ${n===1?'cuenta':'cuentas'}. Primero pasa esas cuentas a otra misión, o elimínalas (menú de tu cuenta → Configuración → Editar).`);
    eliminar('misiones',m,'la misión "'+m.nombre+'"');
  }
}

// ---------------------------------------------------------------------
// 5. FORMULARIO  (m = null para una misión nueva, o la misión a editar)
// ---------------------------------------------------------------------
function formulario(m){
  const nueva=!m;
  if(!nueva&&!m.id)return;
  const o=modal(`<div class="mh"><h2>${nueva?'Añadir misión':'Editar misión'}</h2><button class="ic" data-cx aria-label="Cerrar">${ic('x')}</button></div>
    <label class="fl2" style="margin-bottom:12px">País<span class="selpais"><span id="vb"></span><select id="fp">${nueva?'<option value="">Elige un país…</option>':''}${PAISES.map(([c,n])=>`<option value="${c}" ${m&&m.codigo===c?'selected':''}>${esc(n)}</option>`).join('')}</select></span></label>
    <label class="fl2" style="margin-bottom:12px">Nombre de la misión<input id="fn" value="${esc(m?m.nombre:'')}" autocomplete="off"></label>
    <p class="error" role="alert" hidden></p>
    <div class="barra" style="justify-content:flex-end;margin:6px 0 0"><button class="sec" data-cx>Cancelar</button><button id="ok">Guardar</button></div>`);
  const err=t=>{const p=$('.error',o);p.textContent=t;p.hidden=!t};
  const verBandera=()=>{const c=$('#fp',o).value;$('#vb',o).innerHTML=c?banderaHtml(c,NOMBRE_PAIS[c]):''};
  verBandera();
  $('#fp',o).onchange=verBandera;
  const aceptar=()=>{
    const codigo=$('#fp',o).value,nombre=$('#fn',o).value.trim();
    if(!codigo)return err('Elige un país.');
    if(!nombre)return err('Escribe el nombre de la misión.');
    if(M.some(x=>x.id!==(m&&m.id)&&x.codigo===codigo&&alfa(x.nombre,nombre)===0))return err('Ya existe una misión con ese nombre en ese país.');
    const datos={codigo,pais:NOMBRE_PAIS[codigo],nombre};
    if(nueva)crear('misiones',datos);else guardar('misiones',m.id,datos);
    o.remove();aviso(nueva?'Misión añadida.':'Cambios guardados.');
  };
  o.onclick=e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.cx!=null)o.remove();else if(b.id==='ok')aceptar()};
  o.onkeydown=e=>{if(e.key==='Enter'&&e.target.tagName!=='SELECT'){e.preventDefault();aceptar()}};
  const primero=$(nueva?'#fp':'#fn',o);if(primero)primero.focus();
}

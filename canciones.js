// =====================================================================
//  CANCIONES.JS  ·  La pantalla «Canciones»
//  Aquí está todo lo que ves al entrar a Canciones: el buscador, los
//  álbumes (agrupados por artista), las canciones de cada álbum, el
//  orden (manual, A-Z, Z-A) y el botón «Vista».
//
//  MAPA DE ESTE ARCHIVO (usa Ctrl+F para encontrar cada parte):
//   1. ESTILOS .............. colores y tamaños de esta pantalla
//   2. PREFERENCIAS ......... lo que recuerda cada dispositivo
//   3. ORDEN ................ ordenar(), guardarOrden(), moverUno()
//   4. AGRUPAR POR ARTISTA .. gruposDeAlbumes()
//   5. DIBUJAR .............. barra, menú «Vista», álbumes, canciones
//   6. ACCIONES ............. qué pasa al hacer clic
//   7. ARRASTRAR Y SOLTAR ... orden manual con el mouse
//   8. FORMULARIOS .......... ventanitas para álbum y artista
//   9. ARRANQUE ............. cómo se conecta con el resto de la app
// =====================================================================
import {$,esc,guardar,crear,eliminar,imagen,vistas,ic,modal,puedeEditar,esNivelAdmin,puedeEditarAlbum} from "./base.js";
import {E,alCambiar} from "./estado.js";
import {abrir,editando,forzarCierre} from "./editor.js";
import {etiquetas} from "./etiquetas.js";
import {cancion} from "./hoja.js";

// ---------------------------------------------------------------------
// 1. ESTILOS de esta pantalla
// ---------------------------------------------------------------------
const hoja=document.createElement('style');
hoja.textContent=`.lst{display:grid;gap:8px}
.fila2{display:flex;align-items:center;gap:14px;background:var(--blanco);border-radius:var(--r-m);padding:8px 52px 8px 8px;cursor:pointer;position:relative;box-shadow:var(--sombra-1);transition:box-shadow .2s;outline-offset:2px}
.fila2:hover{box-shadow:var(--sombra-2)}
.fila2 .mini{width:46px;height:46px;border-radius:var(--r-s);background:var(--capa) center/cover;display:grid;place-items:center;flex:none;color:#8C95B3}
.fila2 b{flex:1;min-width:0;word-break:break-word;font-size:15px}.fila2 details{top:50%;transform:translateY(-50%)}
#canc .fila2 small,#canc .card small{display:block;color:var(--gris);font-weight:500;font-size:12.5px}
#canc .card small{margin:0 4px 4px}
.buscar{position:relative;flex:1 1 260px;min-width:200px}
.buscar>svg{position:absolute;left:12px;top:50%;transform:translateY(-50%);color:var(--gris);pointer-events:none}
.buscar input{width:100%;padding-left:38px;padding-right:40px}
.buscar input::-webkit-search-cancel-button,.buscar input::-webkit-search-decoration{-webkit-appearance:none;appearance:none;display:none}
.buscar .x{position:absolute;right:5px;top:50%;transform:translateY(-50%);width:30px;height:30px;min-height:0;padding:0;border-radius:50%;background:transparent;color:var(--gris);font-size:20px;line-height:1}
.buscar .x:hover{background:var(--suave);filter:none}
.vbox{position:relative}.vmenu{position:absolute;right:0;top:100%;z-index:12;background:var(--blanco);border:1px solid var(--linea);border-radius:14px;box-shadow:var(--sombra-2);padding:14px;width:300px;margin-top:6px}
.vt{font-size:13px;font-weight:700;color:var(--gris);margin:12px 0 6px}.vt:first-child{margin-top:0}
.vseg{display:flex;background:var(--suave);border-radius:var(--r-m);padding:3px;gap:2px}.vseg button{flex:1;background:transparent;color:var(--azul);min-height:34px;padding:6px 4px;font-size:13.5px;border-radius:9px}.vseg button.on{background:var(--azul);color:#fff}
.vchk{display:flex;gap:10px;align-items:center;margin-top:14px;font-weight:600;font-size:14px;cursor:pointer}
.grupo{margin-bottom:18px}.gh{display:flex;align-items:center;gap:8px;width:100%;min-height:36px;background:none;color:var(--azul);padding:6px 4px;font-weight:700;font-size:15.5px;border-radius:var(--r-s);justify-content:flex-start;margin-bottom:6px}
.gh:hover{background:#E4E8F2;filter:none}.gh .chev{display:inline-flex;transition:transform .15s;color:var(--gris)}.grupo.abierto .chev{transform:rotate(90deg)}
.gc{color:var(--gris);font-weight:600;font-size:13px;background:var(--suave);border-radius:999px;padding:1px 9px}.gl{flex:1;height:1px;background:var(--linea-2);margin-left:6px}div.gh{cursor:default}
.ruta{display:flex;align-items:center;gap:12px;margin-bottom:16px;flex-wrap:wrap}.ruta h2{margin:0;font-size:24px}.ruta small{color:var(--gris);font-size:14px;font-weight:600}
.vacio{color:var(--gris);background:var(--blanco);border:1px dashed var(--linea-2);border-radius:var(--r-l);padding:28px 20px;text-align:center}
.arrastrando{opacity:.4}.antes{box-shadow:-5px 0 0 var(--oro)!important}.despues{box-shadow:5px 0 0 var(--oro)!important}
.lst .antes{box-shadow:0 -4px 0 var(--oro)!important}.lst .despues{box-shadow:0 4px 0 var(--oro)!important}
@media(max-width:760px){#canc .barra>button{flex:1 1 auto}#canc .vbox{flex:1 1 auto;display:flex}#canc .vbox>button{flex:1}.vmenu{width:min(300px,calc(100vw - 28px))}}`;
document.head.append(hoja);

// ---------------------------------------------------------------------
// 2. PREFERENCIAS  (se guardan en este dispositivo, no en Firebase)
// ---------------------------------------------------------------------
const PREF={
  vista:'cuadricula',        // 'cuadricula' o 'lista'
  ordenAlbumes:'manual',     // 'manual', 'az' o 'za'
  ordenCanciones:'manual',   // igual, para las canciones dentro de un álbum
  agrupar:true,              // ¿agrupar los álbumes por artista?
  plegados:[]                // grupos de artistas que están cerrados
};
try{
  Object.assign(PREF,JSON.parse(localStorage.getItem('prefCanciones')||'{}'));
  if(!localStorage.getItem('prefCanciones')&&localStorage.getItem('vistaCanciones')==='lista')PREF.vista='lista';   // recuerda la vista de la versión anterior
}catch(e){}
const guardarPreferencias=()=>{try{localStorage.setItem('prefCanciones',JSON.stringify(PREF))}catch(e){}};

// ---------------------------------------------------------------------
// Variables de lo que está pasando en pantalla
// ---------------------------------------------------------------------
let el=null;               // el contenedor de esta pantalla
let albumAbierto=null;     // id del álbum que estás viendo (null = lista de álbumes)
let busqueda='';           // texto del buscador
let menuAbierto=false;     // ¿está abierto el menú «Vista»?
let fotoPara=null;         // álbum al que se le está cambiando la foto
let arrastre=null;         // lo que se está arrastrando ahora mismo
let destino=null;          // dónde se va a soltar

// ---------------------------------------------------------------------
// 3. ORDEN
// ---------------------------------------------------------------------
const alfa=(a,b)=>a.localeCompare(b,'es',{sensitivity:'base'});   // compara dos textos ignorando mayúsculas y tildes

// ordenar(lista, modo, texto): devuelve una copia de la lista ordenada.
//   modo 'az' = de la A a la Z,  'za' = de la Z a la A,
//   'manual' = según el campo «orden» (los que no lo tienen van al final, por nombre).
function ordenar(lista,modo,texto){
  const copia=[...lista],porNombre=(a,b)=>alfa(texto(a),texto(b));
  if(modo==='az')return copia.sort(porNombre);
  if(modo==='za')return copia.sort((a,b)=>porNombre(b,a));
  return copia.sort((a,b)=>((a.orden??1e9)-(b.orden??1e9))||porNombre(a,b));
}

// guardarOrden: le pone a cada elemento su número de posición (0, 1, 2...) en Firebase.
function guardarOrden(coleccion,lista){
  lista.forEach((o,i)=>{if(o.orden!==i)guardar(coleccion,o.id,{orden:i})});
}

// Un «contenedor» es el grupo donde se reordena:  'alb:Artista'  o  'can:idDelAlbum'.
function listaDelContenedor(cont){
  if(cont.startsWith('alb:')){
    const artista=cont.slice(4);
    return ordenar(E.albumes.filter(a=>claveGrupo(a)===artista),'manual',a=>a.nombre);
  }
  const idAlbum=cont.slice(4);
  return ordenar(E.canciones.filter(c=>c.albumId===idAlbum),'manual',c=>c.titulo);
}

// moverUno: sube (-1) o baja (+1) un elemento una posición.
function moverUno(tipo,id,cont,paso){
  const lista=listaDelContenedor(cont),i=lista.findIndex(x=>x.id===id),j=i+paso;
  if(i<0||j<0||j>=lista.length)return;
  const nueva=[...lista];[nueva[i],nueva[j]]=[nueva[j],nueva[i]];
  guardarOrden(tipo==='album'?'albumes':'canciones',nueva);
}

// ---------------------------------------------------------------------
// 4. AGRUPAR POR ARTISTA
// ---------------------------------------------------------------------
const artistaDe=a=>(a.artista||'').trim();
const hayArtistas=()=>E.albumes.some(a=>artistaDe(a));
const agrupando=()=>PREF.agrupar&&hayArtistas();          // si ningún álbum tiene artista, no se muestran grupos
const claveGrupo=a=>agrupando()?artistaDe(a):'';          // en qué grupo está un álbum ('' = «Sin artista» o sin grupos)
const listaDeArtistas=()=>[...new Set(E.albumes.map(artistaDe).filter(Boolean))].sort(alfa);

// gruposDeAlbumes: devuelve [{nombre, albumes:[...]}]. nombre = null significa «sin encabezados».
function gruposDeAlbumes(){
  const modo=PREF.ordenAlbumes,texto=a=>a.nombre;
  if(!agrupando())return [{nombre:null,albumes:ordenar(E.albumes,modo,texto)}];
  const mapa=new Map();
  E.albumes.forEach(a=>{const k=artistaDe(a);if(!mapa.has(k))mapa.set(k,[]);mapa.get(k).push(a)});
  const nombres=[...mapa.keys()].filter(Boolean).sort(alfa);
  if(modo==='za')nombres.reverse();
  const grupos=nombres.map(n=>({nombre:n,albumes:ordenar(mapa.get(n),modo,texto)}));
  if(mapa.has(''))grupos.push({nombre:'',albumes:ordenar(mapa.get(''),modo,texto)});   // «Sin artista» al final
  return grupos;
}

// ---------------------------------------------------------------------
// 5. DIBUJAR
// ---------------------------------------------------------------------
const fotoDe=alb=>alb&&alb.foto?`style="background-image:url(${alb.foto})"`:'';

// menuDe: el menú ⋮ de cada álbum o canción.
function menuDe(tipo,o,cont,manual,titulo,editable,ocultarBtn){
  const datos=`data-tipo="${tipo}" data-id="${o.id}" data-cont="${esc(cont)}"`;
  const boton=(acc,texto,clase='')=>`<button class="${clase}" data-acc="${acc}" ${datos}>${texto}</button>`;
  const deAlbum=editable&&tipo==='album'?boton('nombre','Editar nombre')+boton('artista','Editar artista')+boton('foto','Editar foto del \u00e1lbum'):'';
  const mover=editable&&manual?boton('atras','Mover atr\u00e1s')+boton('adelante','Mover adelante'):'';
  const ocultar=ocultarBtn?boton('ocultar',o.oculto?'Mostrar a todos':'Ocultar de los dem\u00e1s'):'';
  const elim=editable?boton('eliminar',ic('trs',16)+' Eliminar','rojo'):'';
  if(!deAlbum&&!mover&&!ocultar&&!elim)return '';
  return `<details><summary aria-label="Opciones de \u00ab${esc(titulo)}\u00bb" title="Opciones">&#8942;</summary><div>${deAlbum}${ocultar}${mover}${elim}</div></details>`;
}

// item: dibuja UN álbum o UNA canción (como tarjeta o como fila, según la vista).
function item(tipo,o,cont,arrastrable){
  const esAlbum=tipo==='album',alb=esAlbum?o:E.albumes.find(a=>a.id===o.albumId);
  const titulo=esAlbum?o.nombre:o.titulo,lista=PREF.vista==='lista';
  const editable=puedeEditarAlbum(alb),puedeArrastrar=arrastrable&&editable;
  const ocultarBtn=esAlbum&&esNivelAdmin()&&!o.ministerioId;
  const icono=alb&&alb.foto?'':(esAlbum?ic('dsc',lista?22:40):ic('mus',lista?20:30));
  const n=esAlbum?E.canciones.filter(c=>c.albumId===o.id).length:0;
  const detalle=esAlbum?`<small>${n} ${n===1?'canci\u00f3n':'canciones'}</small>`:(cont==='busqueda'&&alb?`<small>${esc(alb.nombre)}</small>`:'');
  const datos=`data-tipo="${tipo}" data-id="${o.id}" data-cont="${esc(cont)}" ${puedeArrastrar?'draggable="true"':''} role="button" tabindex="0"`;
  const menu=menuDe(tipo,o,cont,puedeArrastrar,titulo,editable,ocultarBtn);
  const oc=esAlbum&&o.oculto?` <small style="color:var(--rojo)">(oculto)</small>`:'';
  if(lista)return `<div class="fila2" ${datos}><div class="mini" ${fotoDe(alb)}>${icono}</div><b>${esc(titulo)}${oc}${detalle}</b>${menu}</div>`;
  return `<div class="card" ${datos}><div class="foto" ${fotoDe(alb)}>${icono}</div><b>${esc(titulo)}${oc}</b>${detalle}${menu}</div>`;
}

const claseLista=(chica)=>PREF.vista==='lista'?'lst':'grid'+(chica?' chico':'');

// htmlAlbumes: la lista de álbumes, con los grupos de artistas plegables.
function htmlAlbumes(){
  if(!E.albumes.length)return '<p class="vacio">A\u00fan no hay \u00e1lbumes. Pulsa \u00abNuevo \u00e1lbum\u00bb para crear el primero.</p>';
  const manual=PREF.ordenAlbumes==='manual';
  return gruposDeAlbumes().map(g=>{
    const cont='alb:'+(g.nombre||''),filas=`<div class="${claseLista(false)}">${g.albumes.map(a=>item('album',a,cont,manual)).join('')}</div>`;
    if(g.nombre===null)return filas;                                  // sin encabezados
    const clave='a:'+g.nombre,plegado=PREF.plegados.includes(clave);
    return `<section class="grupo ${plegado?'':'abierto'}"><button class="gh" data-grupo="${esc(clave)}" aria-expanded="${!plegado}"><span class="chev">${ic('rgt',16)}</span><span class="gn">${esc(g.nombre||'Sin artista')}</span><span class="gc">${g.albumes.length}</span><span class="gl"></span></button>${plegado?'':filas}</section>`;
  }).join('');
}

// htmlAlbum: las canciones de un álbum abierto.
function htmlAlbum(alb){
  const manual=PREF.ordenCanciones==='manual';
  const canciones=ordenar(E.canciones.filter(c=>c.albumId===alb.id),PREF.ordenCanciones,c=>c.titulo);
  return `<div class="ruta"><button class="sec" data-volver>${ic('lft',16)} \u00c1lbumes</button><div><h2>${esc(alb.nombre)}</h2>${artistaDe(alb)?`<small>${esc(artistaDe(alb))}</small>`:''}</div></div>`
    +(canciones.length?`<div class="${claseLista(true)}">${canciones.map(c=>item('cancion',c,'can:'+alb.id,manual)).join('')}</div>`:'<p class="vacio">Este \u00e1lbum a\u00fan no tiene canciones. Pulsa \u00abNueva canci\u00f3n\u00bb para a\u00f1adir la primera.</p>');
}

// coincide: ¿esta canción coincide con lo que escribiste en el buscador?
function coincide(c,q){
  const alb=E.albumes.find(a=>a.id===c.albumId);
  const nombresEtiquetas=(c.etiquetas||[]).map(id=>(E.etiquetas.find(t=>t.id===id)||{}).nombre||'').join(' ');
  return [c.titulo,c.letra||'',nombresEtiquetas,alb?alb.nombre:'',alb?artistaDe(alb):''].join(' ').toLowerCase().includes(q);
}

function htmlBusqueda(q){
  const res=ordenar(E.canciones.filter(c=>coincide(c,q)),PREF.ordenCanciones==='manual'?'az':PREF.ordenCanciones,c=>c.titulo);
  return `<div class="gh"><span class="gn">Resultados</span><span class="gc">${res.length}</span><span class="gl"></span></div>`
    +(res.length?`<div class="${claseLista(true)}">${res.map(c=>item('cancion',c,'busqueda',false)).join('')}</div>`:`<p class="vacio">No hay canciones que coincidan con \u00ab${esc(busqueda.trim())}\u00bb.</p>`);
}

// pintarContenido: dibuja la parte de abajo (álbumes, canciones o resultados).
function pintarContenido(){
  const zona=$('#contenido');if(!zona||editando())return;
  const q=busqueda.trim().toLowerCase(),alb=E.albumes.find(a=>a.id===albumAbierto);
  if(albumAbierto&&!alb)albumAbierto=null;                          // el álbum ya no existe
  zona.innerHTML=q?htmlBusqueda(q):(alb?htmlAlbum(alb):htmlAlbumes());
}

// htmlMenu: el contenido del menú «Vista».
function htmlMenu(){
  const grupo=(clave,opciones)=>`<div class="vseg">${opciones.map(([v,t])=>`<button data-p="${clave}:${v}" class="${PREF[clave]===v?'on':''}">${t}</button>`).join('')}</div>`;
  const orden=[['manual','Manual'],['az','A &rarr; Z'],['za','Z &rarr; A']];
  return `<div class="vt">Ver como</div>${grupo('vista',[['cuadricula','Cuadr\u00edcula'],['lista','Lista']])}
    <div class="vt">Ordenar \u00e1lbumes</div>${grupo('ordenAlbumes',orden)}
    <div class="vt">Ordenar canciones</div>${grupo('ordenCanciones',orden)}
    <label class="vchk"><input type="checkbox" data-pc="agrupar" ${PREF.agrupar?'checked':''}> Agrupar \u00e1lbumes por artista</label>`;
}
function pintarMenu(){const m=$('.vmenu');if(m){m.innerHTML=htmlMenu();m.hidden=!menuAbierto}const b=$('#vista');if(b)b.setAttribute('aria-expanded',String(menuAbierto))}

// montar: dibuja la barra de arriba (una sola vez al entrar a la pantalla).
function montar(){
  el.innerHTML=`<div id="canc"><div class="barra">
      <div class="buscar" role="search"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg><input id="q" type="text" inputmode="search" enterkeyhint="search" placeholder="Buscar por nombre, etiqueta o letra" aria-label="Buscar canciones" value="${esc(busqueda)}" autocomplete="off"><button class="x" id="qx" aria-label="Borrar b\u00fasqueda" ${busqueda?'':'hidden'}>&times;</button></div>
      ${puedeEditar()?`<button id="na">${ic('pls',16)} Nuevo \u00e1lbum</button><button id="nc">${ic('pls',16)} Nueva canci\u00f3n</button><button class="sec" id="et">Etiquetas</button>`:''}
      <span class="vbox"><button class="sec" id="vista" aria-haspopup="true" aria-expanded="false">Vista &#9662;</button><div class="vmenu" hidden></div></span></div>
    <div id="contenido"></div><input type="file" id="ff" accept="image/*" hidden></div>`;
  const raiz=$('#canc');
  raiz.addEventListener('click',alHacerClic);
  raiz.addEventListener('input',alEscribir);
  raiz.addEventListener('change',alCambiarAlgo);
  raiz.addEventListener('keydown',e=>{
    if(e.key!=='Escape')return;
    const abierto=raiz.querySelector('details[open]');
    if(abierto){cerrarMenus();abierto.querySelector('summary').focus();return}
    if(e.target.id==='q')borrarBusqueda();
    else if(menuAbierto){menuAbierto=false;pintarMenu();$('#vista').focus()}
  });
  raiz.addEventListener('toggle',e=>{if(e.target.tagName==='DETAILS'&&e.target.open)cerrarMenus(e.target)},true);   // al abrir un menú ⋮ se cierran los demás
  raiz.addEventListener('dragstart',alEmpezarArrastre);
  raiz.addEventListener('dragover',alPasarArrastrando);
  raiz.addEventListener('drop',alSoltar);
  raiz.addEventListener('dragend',alTerminarArrastre);
  pintarMenu();pintarContenido();
}

// ---------------------------------------------------------------------
// 6. ACCIONES (qué pasa al hacer clic)
// ---------------------------------------------------------------------
// cerrarMenus(excepto): cierra los menús ⋮ abiertos (menos el indicado)
const cerrarMenus=excepto=>document.querySelectorAll('#canc details[open]').forEach(d=>{if(d!==excepto)d.removeAttribute('open')});
// Tocar en cualquier parte fuera de un menú ⋮ lo cierra
document.addEventListener('click',e=>{if(!e.target.closest('#canc details'))cerrarMenus()},true);
function borrarBusqueda(){
  busqueda='';const q=$('#q');if(q){q.value='';q.focus()}
  const x=$('#qx');if(x)x.hidden=true;
  pintarContenido();
}
function alEscribir(e){
  if(e.target.id!=='q')return;
  busqueda=e.target.value;$('#qx').hidden=!busqueda;pintarContenido();
}
function alCambiarAlgo(e){
  const t=e.target;
  if(t.id==='ff'&&t.files[0]&&fotoPara){imagen(t.files[0]).then(f=>guardar('albumes',fotoPara,{foto:f}));t.value=''}   // nueva foto de álbum
  else if(t.dataset.pc==='agrupar'){PREF.agrupar=t.checked;guardarPreferencias();pintarMenu();pintarContenido()}       // casilla «Agrupar»
}

function alHacerClic(e){
  const t=e.target;
  // Cerrar el menú «Vista» si hiciste clic fuera de él
  if(menuAbierto&&!t.closest('.vbox')){menuAbierto=false;pintarMenu()}

  // --- Barra de arriba ---
  if(t.closest('#qx'))return borrarBusqueda();
  if(t.closest('#na'))return formulario('Nuevo \u00e1lbum',[{id:'nombre',etiqueta:'Nombre del \u00e1lbum'},{id:'artista',etiqueta:'Artista (opcional)',lista:listaDeArtistas()}],v=>{
    if(!v.nombre)return alert('Escribe un nombre.');
    crear('albumes',{nombre:v.nombre,artista:v.artista});
  });
  if(t.closest('#nc')){
    const destino=albumAbierto?E.albumes.find(a=>a.id===albumAbierto):null;
    if(destino&&!puedeEditarAlbum(destino))return alert('No puedes a\u00f1adir canciones a este \u00e1lbum.');
    const editables=ordenar(E.albumes.filter(puedeEditarAlbum),'az',a=>a.nombre);
    const albumId=destino?destino.id:editables[0]&&editables[0].id;
    if(!albumId)return alert('Primero crea un \u00e1lbum.');
    return abrir({albumId},pintarContenido);
  }
  if(t.closest('#et'))return etiquetas();
  if(t.closest('#vista')){menuAbierto=!menuAbierto;return pintarMenu()}
  const opcion=t.closest('[data-p]');                                  // botones del menú «Vista»
  if(opcion){const [clave,valor]=opcion.dataset.p.split(':');PREF[clave]=valor;guardarPreferencias();pintarMenu();return pintarContenido()}

  // --- Contenido ---
  const grupo=t.closest('[data-grupo]');                               // plegar o desplegar un artista
  if(grupo){const k=grupo.dataset.grupo,i=PREF.plegados.indexOf(k);if(i>=0)PREF.plegados.splice(i,1);else PREF.plegados.push(k);guardarPreferencias();return pintarContenido()}
  if(t.closest('[data-volver]')){albumAbierto=null;return pintarContenido()}
  const accion=t.closest('[data-acc]');                                // botones del menú ⋮
  if(accion){const d=accion.dataset;hacer(d.acc,d.tipo,d.id,d.cont);const det=accion.closest('details');if(det)det.removeAttribute('open');return}
  if(t.closest('summary'))return;                                      // abrir el menú ⋮ no abre el elemento
  const it=t.closest('[data-tipo][data-id]');                          // clic en un álbum o canción
  if(it){
    if(it.dataset.tipo==='album'){albumAbierto=it.dataset.id;return pintarContenido()}
    const c=E.canciones.find(x=>x.id===it.dataset.id);if(!c)return;
    const alb=E.albumes.find(a=>a.id===c.albumId);
    if(puedeEditarAlbum(alb))abrir(c,pintarContenido);else verSolo(c);
  }
}

// verSolo: para quien no puede editar, muestra la letra (y acordes) en una ventanita, sin abrir el editor.
function verSolo(c){
  const o=modal(`<div class="mh"><h2>${esc(c.titulo)}</h2><button class="ic" data-cx aria-label="Cerrar">${ic('x')}</button></div><div class="hojap" style="padding:20px;box-shadow:none">${cancion(c,true)}</div>`);
  o.onclick=e=>{if(e.target.closest('[data-cx]'))o.remove()};
}

// hacer: ejecuta una acción del menú ⋮.
function hacer(acc,tipo,id,cont){
  const alb=E.albumes.find(a=>a.id===id),can=E.canciones.find(c=>c.id===id);
  if(acc==='ocultar')guardar('albumes',alb.id,{oculto:!alb.oculto});
  else if(acc==='nombre')formulario('Editar nombre del \u00e1lbum',[{id:'nombre',etiqueta:'Nombre',valor:alb.nombre}],v=>{if(v.nombre)guardar('albumes',alb.id,{nombre:v.nombre})});
  else if(acc==='artista')formulario('Artista del \u00e1lbum',[{id:'artista',etiqueta:'Artista (vac\u00edo = sin artista)',valor:artistaDe(alb),lista:listaDeArtistas()}],v=>guardar('albumes',alb.id,{artista:v.artista}));
  else if(acc==='foto'){fotoPara=alb.id;$('#ff').click()}
  else if(acc==='atras'||acc==='adelante')moverUno(tipo,id,cont,acc==='atras'?-1:1);
  else if(acc==='eliminar'){
    if(tipo==='album'){
      if(E.canciones.some(c=>c.albumId===alb.id))return alert('Primero mueve o elimina las canciones de este \u00e1lbum.');
      eliminar('albumes',alb,'el \u00e1lbum "'+alb.nombre+'"');
    }else eliminar('canciones',can,'la canci\u00f3n "'+can.titulo+'"');
  }
}

// ---------------------------------------------------------------------
// 7. ARRASTRAR Y SOLTAR (orden manual con el mouse, solo en computadora)
// ---------------------------------------------------------------------
const elemento=e=>e.target.closest?e.target.closest('[data-tipo][data-id][draggable="true"]'):null;
function alEmpezarArrastre(e){
  const t=elemento(e);if(!t)return;
  arrastre={id:t.dataset.id,tipo:t.dataset.tipo,cont:t.dataset.cont};destino=null;
  e.dataTransfer.effectAllowed='move';e.dataTransfer.setData('text/plain',t.dataset.id);
  setTimeout(()=>t.classList.add('arrastrando'),0);
}
function alPasarArrastrando(e){
  if(!arrastre)return;
  const t=elemento(e);if(!t||t.dataset.cont!==arrastre.cont||t.dataset.id===arrastre.id)return;   // solo dentro del mismo grupo
  e.preventDefault();
  const r=t.getBoundingClientRect(),enFila=t.classList.contains('fila2');
  const despues=enFila?e.clientY>r.top+r.height/2:e.clientX>r.left+r.width/2;
  quitarMarcas();t.classList.add(despues?'despues':'antes');destino={id:t.dataset.id,despues};
}
function alSoltar(e){
  if(!arrastre||!destino)return;
  e.preventDefault();
  const lista=listaDelContenedor(arrastre.cont),movido=lista.find(x=>x.id===arrastre.id);
  const resto=lista.filter(x=>x.id!==arrastre.id),pos=resto.findIndex(x=>x.id===destino.id);
  if(movido&&pos>=0){resto.splice(destino.despues?pos+1:pos,0,movido);guardarOrden(arrastre.tipo==='album'?'albumes':'canciones',resto)}
  alTerminarArrastre();
}
const quitarMarcas=()=>document.querySelectorAll('.antes,.despues').forEach(x=>x.classList.remove('antes','despues'));
function alTerminarArrastre(){quitarMarcas();document.querySelectorAll('.arrastrando').forEach(x=>x.classList.remove('arrastrando'));arrastre=null;destino=null}

// ---------------------------------------------------------------------
// 8. FORMULARIOS (ventanitas con uno o dos campos)
//    campos = [{id, etiqueta, valor, lista}]   alAceptar recibe {id: texto}
// ---------------------------------------------------------------------
function formulario(titulo,campos,alAceptar){
  const o=modal(`<div class="mh"><h2>${esc(titulo)}</h2><button class="ic" data-cx aria-label="Cerrar">${ic('x')}</button></div>`
    +campos.map(c=>`<label class="fl2" style="margin-bottom:12px">${esc(c.etiqueta)}<input id="f_${c.id}" value="${esc(c.valor||'')}" ${c.lista?`list="l_${c.id}"`:''} autocomplete="off"></label>${c.lista?`<datalist id="l_${c.id}">${c.lista.map(x=>`<option value="${esc(x)}">`).join('')}</datalist>`:''}`).join('')
    +'<div class="barra" style="justify-content:flex-end;margin:6px 0 0"><button class="sec" data-cx>Cancelar</button><button id="ok">Guardar</button></div>');
  const aceptar=()=>{const v={};campos.forEach(c=>{v[c.id]=$('#f_'+c.id,o).value.trim()});o.remove();alAceptar(v)};
  o.onclick=e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.cx!=null)o.remove();else if(b.id==='ok')aceptar()};
  o.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();aceptar()}};
  const primero=$('input',o);if(primero){primero.focus();primero.select()}
}

// ---------------------------------------------------------------------
// 9. ARRANQUE (cómo se conecta con el resto de la app)
// ---------------------------------------------------------------------
vistas.canciones=contenedor=>{el=contenedor;albumAbierto=null;busqueda='';menuAbierto=false;montar()};
alCambiar(()=>{if(el&&!editando())pintarContenido()});                      // cuando cambian los datos, se vuelve a dibujar
addEventListener('hashchange',()=>{if(location.hash!=='#canciones'){el=null;forzarCierre()}});   // al salir de la pantalla
addEventListener('reinicio',e=>{                                            // clic en «Canciones» de la barra de arriba
  if(e.detail==='canciones'&&el){forzarCierre();albumAbierto=null;busqueda='';menuAbierto=false;montar()}
});

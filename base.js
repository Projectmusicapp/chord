// ===== BASE: Firebase + funciones comunes + navegación + INICIO =====
import {initializeApp,deleteApp} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {initializeFirestore,persistentLocalCache,persistentMultipleTabManager,collection,doc,setDoc,addDoc,deleteDoc,onSnapshot} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import {getAuth,onAuthStateChanged,signInWithEmailAndPassword,createUserWithEmailAndPassword,signOut,sendEmailVerification,updatePassword,reload} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {firebaseConfig} from "./firebase-config.js";

const app=initializeApp(firebaseConfig);
// Caché local (IndexedDB): al recargar la página (o abrir otra pestaña), lo que ya se había
// leído sale de la caché del navegador en vez de volver a leerse de Firestore — solo se leen
// los cambios reales desde la última vez. Esto es lo que más baja la demanda a la base de datos,
// porque hoy cada recarga vuelve a leer todas las colecciones enteras.
const db=initializeFirestore(app,{localCache:persistentLocalCache({tabManager:persistentMultipleTabManager()})});
export const auth=getAuth(app);
export const $=(s,r=document)=>r.querySelector(s);
export const esc=t=>String(t??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
// compat: datos guardados antes del cambio de nombre («ministerioId» -> «misionId», rol «ministerio» -> «mision»)
// se leen ya con los nombres nuevos.
const compat=d=>{
  if(d.ministerioId!==undefined&&d.misionId===undefined)d={...d,misionId:d.ministerioId};
  if(d.rol==='ministerio')d={...d,rol:'mision'};
  return d;
};
export const escuchar=(col,fn,alError)=>onSnapshot(collection(db,col),s=>fn(s.docs.map(d=>compat({...d.data(),id:d.id}))),alError||(e=>console.error('No se pudo leer «'+col+'»:',e)));   // alError (opcional): qué hacer si falla la lectura
export const escucharDoc=(col,id,fn)=>onSnapshot(doc(db,col,id),s=>fn(s.exists()?compat({...s.data(),id:s.id}):null));

// ===== AUTENTICACIÓN (Firebase Authentication: correo + contraseña) =====
export const alCambiarAuth=fn=>onAuthStateChanged(auth,fn);
export const iniciarSesionAuth=(correo,clave)=>signInWithEmailAndPassword(auth,correo,clave);
export const cerrarSesionAuth=()=>signOut(auth);
export const enviarVerificacion=user=>sendEmailVerification(user);
export const cambiarMiClave=(user,clave)=>updatePassword(user,clave);
export const recargarUsuarioAuth=user=>reload(user);
// crearCuentaAuth: crea una cuenta nueva Y deja la sesión en ella (para el autorregistro,
// donde es justo lo que se quiere: la persona queda conectada a su propia cuenta nueva).
export const crearCuentaAuth=(correo,clave)=>createUserWithEmailAndPassword(auth,correo,clave);
// crearCuentaComoAdmin: crea una cuenta para OTRA persona (desde Usuarios) sin cerrar la
// sesión de quien la está creando. Firebase no deja crear cuentas ajenas desde el cliente
// sin esto: se usa una app secundaria y efímera solo para ese alta, y se descarta después.
export async function crearCuentaComoAdmin(correo,clave){
  const secApp=initializeApp(firebaseConfig,'secundaria-'+Date.now());
  try{
    const secAuth=getAuth(secApp);
    const cred=await createUserWithEmailAndPassword(secAuth,correo,clave);
    await signOut(secAuth);
    return cred.user.uid;
  }finally{
    await deleteApp(secApp);
  }
}

// ===== SESIÓN (quién usa la app ahora mismo) =====
// La arma login.js (con establecerSesion) combinando la cuenta de Firebase Authentication
// con su documento en Firestore (rol, misionId, nombre...).
//
// Roles: admin · editor · mision · usuario
//  - «editor» siempre trae editorDe: 'admin' (Editor del administrador: mismo poder que el
//    Administrador, trabaja en el espacio general) o 'mision' (Editor de misión: mismo poder
//    que una cuenta Misión, trabaja en SU misión, guardada en misionId).
//  - Si un editor no trae editorDe, se trata como Editor de misión (lo más restringido).
let usuarioActual=null;
export const sesion=()=>usuarioActual;
export function establecerSesion(u){usuarioActual=u}
export const esEditorAdmin=u=>!!u&&u.rol==='editor'&&u.editorDe==='admin';
export const esEditorMision=u=>!!u&&u.rol==='editor'&&u.editorDe!=='admin';
// esNivelAdmin: poder de Administrador (el Administrador y su Editor).
export const esNivelAdmin=()=>{const u=usuarioActual;return !!u&&(u.rol==='admin'||esEditorAdmin(u))};
// esAdministrador: SOLO las cuentas «Administrador» (no su Editor). Cambiar niveles es solo de ellas.
export const esAdministrador=()=>{const u=usuarioActual;return !!u&&u.rol==='admin'};
// puedeEditar: todos los roles pueden crear/editar algo EXCEPTO «usuario» (solo ve).
export const puedeEditar=()=>{const u=usuarioActual;return !!u&&u.rol!=='usuario'};

// ===== ÁMBITO: el «espacio» de una misión (su propio calendario, escalas, canciones...) =====
// null = el espacio general/base (el del Administrador y su Editor, que siempre trabajan ahí).
// Las cuentas Misión, Editor de misión y Usuario trabajan en el espacio de SU misión: su campo
// misionId guarda el id de la misión (se crean en la pantalla Misiones).
export function ambitoActual(){
  const u=usuarioActual;if(!u)return null;
  if(u.rol==='admin'||esEditorAdmin(u))return null;
  return u.misionId||'sin-mision';           // una cuenta sin misión no ve nada ni toca el espacio general
}
const propioAmbito=d=>(d.misionId||null)===ambitoActual();
// visibleBiblioteca: un álbum sin misionId es de la biblioteca general (de todos),
// salvo que esté oculto (solo lo ve el nivel Administrador). Un álbum con misionId
// es privado de esa misión: solo lo ve esa misión (o el Administrador revisándolo).
export const visibleBiblioteca=a=>{const mid=a.misionId||null;return mid===null?(esNivelAdmin()||!a.oculto):mid===ambitoActual()};
// ¿se puede editar este álbum (o mover una canción hacia él)? Uno «general» (sin misionId)
// solo lo edita el nivel Administrador; uno privado de una misión lo edita esa misión
// (o quien lo esté revisando con el selector de espacio de trabajo).
export const puedeEditarAlbum=alb=>!alb?false:(alb.misionId?(puedeEditar()&&alb.misionId===ambitoActual()):esNivelAdmin());

// Colecciones que pertenecen a una misión: se guardan con el misionId del ámbito
// actual (null = espacio general) y solo se ven dentro de ese mismo ámbito.
const COL_AMBITO=new Set(['eventos','dias','escalas','personas','repertorios','albumes']);
function conAmbito(col,d){
  if(!COL_AMBITO.has(col))return d;
  const amb=ambitoActual();
  return amb?{...d,misionId:amb}:d;
}
export const guardar=(col,id,d,m=true)=>setDoc(doc(db,col,id),conAmbito(col,d),{merge:m});
// crear: además de guardar, marca cuándo se creó (creadoEn) si no venía ya puesto — lo usa
// la sección «Novedades» de Inicio para mostrar lo más reciente de cualquier colección.
export const crear=(col,d)=>addDoc(collection(db,col),conAmbito(col,{creadoEn:Date.now(),...d}));

// escucharPropio: como escuchar(), pero solo entrega lo que corresponde al ámbito actual,
// y vuelve a llamar a fn si cambia de ámbito (por ejemplo, al cambiar de espacio de trabajo).
export function escucharPropio(col,fn){
  let crudo=[];
  const filtro=col==='albumes'?visibleBiblioteca:propioAmbito;
  const recalc=()=>fn(crudo.filter(filtro));
  escuchar(col,l=>{crudo=l;recalc()});
  addEventListener('ambitocambio',recalc);
}

// Eliminar con confirmación (o directo) y botón "Deshacer" durante 6 segundos
export function eliminar(col,item,texto,directo){
  if(!directo&&!confirm('¿Eliminar '+texto+'?'))return;
  deleteDoc(doc(db,col,item.id));
  const d=document.createElement('div');
  d.innerHTML='Eliminado <button class="sec">Deshacer</button>';
  d.querySelector('button').onclick=()=>{guardar(col,item.id,item,false);d.remove()};
  $('#aviso').append(d);setTimeout(()=>d.remove(),6000);
}

// aviso(texto): muestra un mensaje corto abajo durante 4 segundos
export function aviso(texto){
  const d=document.createElement('div');d.textContent=texto;
  $('#aviso').append(d);setTimeout(()=>d.remove(),4000);
}

// Reduce una foto para guardarla dentro de la base de datos
export const imagen=(f,max=300)=>new Promise(r=>{
  const i=new Image;
  i.onload=()=>{const k=Math.min(1,max/Math.max(i.width,i.height)),c=document.createElement('canvas');
    c.width=i.width*k;c.height=i.height*k;c.getContext('2d').drawImage(i,0,0,c.width,c.height);
    r(c.toDataURL('image/jpeg',.8))};
  i.src=URL.createObjectURL(f);
});

// ===== ÍCONOS (en lugar de emojis) y VENTANA PEQUEÑA CENTRADA =====
const I={cal:'<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
  mus:'<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',
  dsc:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3"/>',
  usr:'<path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.9M16 3.1a4 4 0 010 7.8"/>',
  edt:'<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z"/>',
  trs:'<path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/>',
  pls:'<path d="M12 5v14M5 12h14"/>',img:'<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/>',
  out:'<path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/>',lft:'<path d="M15 18l-6-6 6-6"/>',rgt:'<path d="M9 18l6-6-6-6"/>',x:'<path d="M18 6L6 18M6 6l12 12"/>',
  cfg:'<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06A1.65 1.65 0 005 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 005 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06A1.65 1.65 0 008.4 5a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06A1.65 1.65 0 0019 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>',
  pin:'<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 1118 0z"/><circle cx="12" cy="10" r="3"/>'};
export const ic=(n,s=18)=>`<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${I[n]}</svg>`;
// modal(html): abre una ventana. Se cierra con Esc, con la X o tocando fuera.
// Al cerrarse, el foco vuelve al botón que la abrió.
export function modal(html){
  const antes=document.activeElement;
  const o=document.createElement('div');o.className='mo';o.innerHTML=`<div class="mc" role="dialog" aria-modal="true">${html}</div>`;
  const titulo=o.querySelector('h2');if(titulo){titulo.id='mt'+Date.now();o.firstChild.setAttribute('aria-labelledby',titulo.id)}
  o.remove=function(){Element.prototype.remove.call(this);if(antes&&antes.isConnected&&antes.focus)antes.focus()};
  document.body.append(o);
  o.addEventListener('mousedown',e=>{if(e.target===o)o.remove()});
  setTimeout(()=>{if(o.contains(document.activeElement))return;const f=o.querySelector('input:not([type=hidden]):not([hidden]),select,textarea')||o.querySelector('button');if(f)f.focus()},0);
  return o;
}

// Esc cierra la ventana que esté encima (aunque el foco se haya perdido)
document.addEventListener('keydown',e=>{
  if(e.key!=='Escape')return;
  if(document.querySelector('.sb.abierto'))return;   // un selector con banderas abierto: Esc solo lo cierra a él (ver misiones.js)
  const abiertas=document.querySelectorAll('body > .mo');
  if(abiertas.length){e.stopPropagation();e.preventDefault();abiertas[abiertas.length-1].remove()}
},true);

// Tarjetas que funcionan como botón (role="button"): se abren también con Enter o Espacio
document.addEventListener('keydown',e=>{
  const t=e.target;
  if((e.key==='Enter'||e.key===' ')&&t.matches&&t.matches('[role="button"][tabindex]')){e.preventDefault();t.click()}
});

// ===== NAVEGACIÓN (la barra de arriba solo muestra los botones dentro de las pantallas) =====
export const vistas={};
// menuDe: las secciones de contenido. «Usuarios» (cuentas, nombre/logo, copia de seguridad)
// no va aquí: se abre como «Configuración» desde el menú de la cuenta, en la cabecera.
const menuDe=()=>[['calendario','cal','Calendario','Eventos y ensayos'],['repertorio','mus','Repertorio','Misas, eventos y PDF'],['canciones','dsc','Canciones','Letras y acordes'],['escalas','usr','Escalas','Equipos por día']];
// ===== CHIGO · «Mi lista» para las cuentas «Usuario (solo ver)» =====
// Esas cuentas solo ven «Mi lista» y «Canciones» en la barra (Inicio sigue en el logo),
// y no pueden abrir Calendario, Repertorio ni Escalas aunque escriban la dirección.
const menuUsuario=[['milista','mus','Mi lista','Tus listas de canciones'],['canciones','dsc','Canciones','Letras y acordes']];
const esSoloVer=()=>!!usuarioActual&&usuarioActual.rol==='usuario';
const BLOQUEADAS_SOLO_VER=['calendario','repertorio','escalas'];
// ===== FIN CHIGO =====
const vista=()=>location.hash.slice(1)||'inicio';
let vistaAnterior=null,todoCargado=false;
// login.js avisa cuando ya se cargaron todas las pantallas (antes de eso no se muestra «Esta página no existe»)
export const appCargada=()=>{todoCargado=true};
function irA(){
  const v=vista(),ver=v.startsWith('ver/');            // «ver/ID» = ventana Compartir de un repertorio
  if(!listo&&!ver)return;                               // espera el nombre y el logo guardados (así no aparece el nombre por defecto y luego cambia)
  if(!sesion()&&!ver)return;                            // sin sesión: login.js controla la pantalla, aquí no se toca el menú ni #app
  if(esSoloVer()&&BLOQUEADAS_SOLO_VER.includes(v)){location.hash='inicio';return}   // Chigo: el usuario (solo ver) no entra a estas pantallas
  document.body.classList.toggle('modo-ver',ver);
  const menu=esSoloVer()?menuUsuario:menuDe();   // Chigo: menú reducido para el usuario (solo ver)
  document.body.classList.toggle('solo-ver',esSoloVer());   // Chigo: marca el <body> para centrar la barra en el celular (CSS en milista.js)
  $('#nav').innerHTML=ver?'':menu.map(([k,i,n])=>`<a href="#${k}" class="${k===v?'on':''}" ${k===v?'aria-current="page"':''}>${ic(i,18)}<span>${n}</span></a>`).join('');
  const el=$('#app');el.innerHTML='';el.className='';el.dataset.vista=v;
  el.onclick=el.oninput=el.onchange=el.onkeydown=null;   // quita lo que dejó la pantalla anterior
  const m=menu.find(x=>x[0]===v);document.title=(m?m[2]+' · ':'')+(cfg.nombre||'Músicapp');
  if(vistaAnterior!==v){window.scrollTo(0,0);vistaAnterior=v}
  if(ver&&vistas.ver)return vistas.ver(el,v.slice(4));
  (vistas[v]||(e=>{if(todoCargado)e.innerHTML='<div class="c2"><h2>Esta página no existe</h2><p><a href="#inicio">Volver al inicio</a></p></div>'}))(el);
}

// ===== INICIO =====
// El letrero con el nombre/logo y los 4 botones de sección ya no van aquí (quedan en la
// cabecera y en la barra de navegación). Inicio queda para «Novedades» (ver usuarios.js,
// que agrega esa sección dentro de este mismo contenedor).
// Cambiar el nombre/logo de la app y la copia de seguridad viven en la pantalla Usuarios
// (sección de administración, solo para el nivel Administrador) — ver usuarios.js.
let cfg={nombre:'Ministerio de música',logo:''},listo=0;
export const configActual=()=>cfg;
const cabecera=()=>{$('#logo').innerHTML=(cfg.logo?`<img src="${cfg.logo}" alt="">`:`<span class="lg">${ic('mus',20)}</span>`)+`<span>${esc(cfg.nombre)}</span>`};

export const hoyLargo=()=>{const t=new Date().toLocaleDateString('es',{weekday:'long',day:'numeric',month:'long'});return t.charAt(0).toUpperCase()+t.slice(1)};
vistas.inicio=el=>{el.innerHTML='<div class="inicio"></div>'};

escuchar('config',l=>{
  cfg={...cfg,...(l.find(x=>x.id==='app')||{})};
  cabecera();
  if(!listo||vista()==='inicio'){listo=1;irA()}
});
addEventListener('hashchange',irA);

// ===== Clic en el botón de la pantalla en la que ya estás: vuelve al inicio de esa pantalla =====
$('#nav').addEventListener('click',e=>{
  const enlace=e.target.closest('a');
  if(enlace&&enlace.getAttribute('href')==='#'+vista())dispatchEvent(new CustomEvent('reinicio',{detail:vista()}));
});

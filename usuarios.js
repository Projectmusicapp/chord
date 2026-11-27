// =====================================================================
//  USUARIOS.JS  ·  Cuentas y permisos (niveles, misiones y VARIOS ROLES por cuenta)
//
//  Las cuentas usan Firebase Authentication (correo + contraseña, ver
//  base.js): el id de cada cuenta aquí es el uid que le da Firebase Auth,
//  no un id de Firestore cualquiera. El documento en «usuarios» solo
//  guarda los datos propios de la app (rol, nombre, a qué misión
//  pertenece...); la contraseña la maneja Firebase, nunca se guarda aquí.
//
//  Niveles (campo «rol», y «editorDe» para el Editor):
//   admin ...... control total: biblioteca general, puede ocultar álbumes
//                de la biblioteca general, crear cuentas de cualquier nivel
//                y cambiar el nivel de cualquier cuenta (incluso degradar a
//                otro Administrador a Editor). Su Editor también cambia niveles (menos el de Administrador).
//   editor ..... solo se crea desde Usuarios (nunca por autorregistro).
//     editorDe:'admin'   Editor del administrador: hace todo lo que el
//                        Administrador, menos editar/eliminar a un Administrador
//                        ni crear Administradores. Trabaja en el espacio general.
//     editorDe:'mision'  Editor de misión: hace todo lo que una cuenta Misión,
//                        menos editar/eliminar cuentas Misión. Solo ve cuentas de
//                        SU misión. No cambia la misión de otras cuentas.
//                        (Ningún Editor elimina a otro Editor, pero sí lo edita.)
//   mision ..... un equipo de una MISIÓN. Ve la biblioteca general sin poder
//                editarla. Tiene la biblioteca privada, el calendario, las
//                escalas y los repertorios de SU misión. Puede crear cuentas
//                «editor de misión» y «usuario» para su misma misión.
//   usuario .... solo ve (su misión + la biblioteca general). No crea ni edita
//                nada. También puede llegar aquí por autorregistro (ver
//                login.js): esas cuentas quedan con requiereVerificacion = true
//                hasta que confirman su correo.
//
//  VARIOS ROLES: una misma cuenta puede tener un rol en el espacio general y/o en
//  una o más misiones (uno por espacio), guardados en «roles» (ver base.js). La persona
//  elige en la cabecera en qué espacio trabaja, y cada permiso se calcula con SU rol en
//  ese espacio. Solo el Administrador asigna varios roles a una cuenta (ver formEditar).
//
//  Las misiones las crea el Administrador (o su Editor) en la pantalla
//  «Misiones» (ver misiones.js). Cada cuenta de misión guarda en «misionId» el
//  id de su misión, y los datos de cada misión (álbumes propios, calendario,
//  escalas...) se separan con ese mismo campo (ver conAmbito y ambitoActual
//  en base.js). «creadoEn» (fecha en milisegundos) se usa para «Novedades».
//
//  Una cuenta creada desde «Nueva cuenta» queda con requiereVerificacion:false:
//  se confía en quien la dio de alta. Solo el autorregistro exige verificar.
// =====================================================================
import {$,esc,guardar,crear,eliminar,escuchar,vistas,ic,modal,aviso,imagen,sesion,establecerSesion,esNivelAdmin,esAdministrador,puedeEditar,configActual,hoyLargo,auth,cambiarMiClave,crearCuentaAuth,crearCuentaComoAdmin,enviarVerificacion,definirApariencia,refrescarCabecera,recargarUsuarioAuth,GENERAL,esNivelGeneral,rolesDe,espaciosDe,nivelEn,camposDeRoles,nivelActivo,espacioActual,ambitoActual,cambiarEspacio} from "./base.js";
import {ventana as abrirRespaldo} from "./respaldo.js";
import "./etiquetas.js";   // PANEL: registra la pantalla «Etiquetas» (#etiquetas), que ya no se abre desde Canciones
import {E,alCambiar} from "./estado.js";
import {misionesCargadas,alCambiarMisiones,listaMisiones,misionPorId,etiquetaMision,PAISES,alfa,selectorBandera,activarSelectores,banderaHtml} from "./misiones.js";
import {tarjetaLiturgica,alCambiarLiturgia} from "./liturgico.js";   // tiempo litúrgico (cuadro de Inicio)
const NOMBRE_PAIS=Object.fromEntries(PAISES);

// NIVELES: los 5 «niveles» que se pueden elegir (el Editor tiene dos variantes).
const NIVELES={admin:'Administrador','editor-admin':'Editor del administrador','editor-mision':'Editor de misión',mision:'Misión',usuario:'Usuario'};

const st=document.createElement('style');
st.textContent=`header .menu-usuario{position:relative;margin-left:auto}
header .btn-usuario{background:#ffffff14;color:#ffffffe0;min-height:36px;padding:6px 12px;font-size:14px;flex:none;display:inline-flex;align-items:center;gap:6px;max-width:160px}
header .btn-usuario .nm{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0;max-width:110px}
.av{width:28px;height:28px;border-radius:50%;object-fit:cover;flex:none;display:inline-grid;place-items:center;background:var(--oro);color:var(--sobre-oro);font-weight:800;line-height:1}
header .avw{display:inline-flex;flex:none}
header .btn-usuario:hover{background:#ffffff26;filter:none}
header .menu-espacio{position:relative;margin-left:auto}
header .menu-espacio[hidden]{display:none}
header .menu-espacio+.menu-usuario{margin-left:8px}
header .btn-espacio{background:#ffffff14;color:#ffffffe0;min-height:36px;padding:6px 10px;font-size:14px;flex:none;display:inline-flex;align-items:center;gap:6px;max-width:150px}
header .btn-espacio .nm{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0;max-width:92px}
header .btn-espacio:hover{background:#ffffff26;filter:none}
header .dd-usuario .esp{display:flex;align-items:center;gap:8px;width:100%}
header .dd-usuario .esp small{margin-left:auto;color:var(--gris);font-weight:500;white-space:nowrap}
header .dd-usuario .esp[aria-current=true]{background:var(--oro-claro);color:var(--azul-tx);font-weight:800}
.rfila{display:flex;gap:8px;align-items:flex-end;margin-bottom:10px;flex-wrap:wrap}
.rfila .fl2{margin:0;flex:1 1 150px;min-width:0}
.rfila .ic{flex:none}
header .dd-usuario{position:absolute;right:0;top:100%;margin-top:6px;z-index:12;background:var(--blanco);border:1px solid var(--linea);border-radius:14px;box-shadow:var(--sombra-2);padding:8px;min-width:200px;max-width:min(280px,calc(100vw - 24px));display:grid;gap:2px}
header .dd-usuario .nombre{padding:8px 10px 10px;font-weight:700;color:var(--tx);border-bottom:1px solid var(--linea);margin-bottom:4px;display:flex;align-items:center;gap:10px;min-width:0}
header .dd-usuario .nombre .nm{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0}
header .dd-usuario button{background:transparent;color:var(--tx);justify-content:flex-start;text-align:left;min-height:38px}
header .dd-usuario button:hover{background:var(--capa);filter:none}
@media(max-width:480px){header .btn-usuario{max-width:64px;padding:0 8px;justify-content:center}header .btn-usuario .nm{display:none}}
/* ===== PANEL «Configuración»: se despliega desde la derecha a todo el alto (azul en PC, blanco en celular) ===== */
.pcfg-capa{position:fixed;inset:0;z-index:60;visibility:hidden;pointer-events:none;transition:visibility 0s linear .25s}
.pcfg-capa.abierta{visibility:visible;pointer-events:auto;transition-delay:0s}
.pcfg-fondo{position:absolute;inset:0;background:#0b1126;opacity:0;transition:opacity .25s ease}
.pcfg-capa.abierta .pcfg-fondo{opacity:.5}
.pcfg{position:absolute;top:0;right:0;bottom:0;width:min(320px,88vw);background:var(--blanco);box-shadow:-10px 0 34px #1f2a4d40;display:flex;flex-direction:column;overflow-y:auto;transform:translateX(100%);transition:transform .25s ease;padding:env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) 0}
.pcfg-capa.abierta .pcfg{transform:none}
.pcfg-cab{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:14px 16px 6px}
.pcfg-cab h2{margin:0;font-size:20px}
.pcfg-per{display:flex;align-items:center;gap:12px;padding:12px 18px 16px;border-bottom:1px solid var(--linea);font-weight:700;color:var(--tx);min-width:0}
.pcfg-per .avw{display:inline-flex;flex:none}
.pcfg-per .nm{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0}
.pcfg-ops{display:flex;flex-direction:column;gap:2px;padding:10px;flex:1}
.pcfg-ops button{background:transparent;color:var(--tx);justify-content:flex-start;text-align:left;min-height:46px;padding:8px 12px;font-weight:600;width:100%}
.pcfg-ops button:hover{background:var(--capa);filter:none}
.pcfg-ops button[aria-current=true]{background:var(--oro-claro);color:var(--azul-tx);font-weight:800}
.pcfg-ops .pcfg-sal{margin-top:auto}
@media(max-width:480px){.pcfg{width:min(340px,90vw)}}
@media(prefers-reduced-motion:reduce){.pcfg,.pcfg-fondo{transition:none}}
@media(min-width:481px){.pcfg{background:var(--panel);color:#ffffffe0}
.pcfg-cab h2{color:#fff}
.pcfg-cab .ic{background:#ffffff1f;color:#fff}
.pcfg-per{color:#fff;border-bottom-color:#ffffff24}
.pcfg-ops button{color:#ffffffe0}
.pcfg-ops button:hover{background:#ffffff14}
.pcfg-ops button[aria-current=true],.pcfg-ops button[aria-current=true]:hover{background:var(--oro);color:var(--sobre-oro)}}
/* ===== TEMA: ventana de modo, color y acordes ===== */
.tm-h{margin:20px 0 8px;font:800 12.5px var(--fuente);letter-spacing:.06em;text-transform:uppercase;color:var(--gris)}
.tm-modos{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
.tm-modos button,.tm-sw{background:var(--blanco);color:var(--tx);border:2px solid var(--linea);border-radius:var(--r-m);font-weight:700}
.tm-modos button{flex-direction:column;gap:4px;padding:10px 6px;font-size:13px;min-height:62px}
.tm-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:8px}
.tm-sw{justify-content:flex-start;padding:8px 12px;gap:10px;font-size:14px}
.tm-pt{width:22px;height:22px;border-radius:50%;flex:none;box-shadow:inset 0 0 0 2px #ffffff55,0 0 0 1px var(--linea-2)}
.tm-modos button:hover,.tm-sw:hover{filter:none;background:var(--capa)}
.tm-modos button[aria-pressed=true],.tm-sw[aria-pressed=true],.tm-modos button[aria-pressed=true]:hover,.tm-sw[aria-pressed=true]:hover{border-color:var(--oro);background:var(--oro-claro);color:var(--azul-tx)}
.tm-prev{background:#fff;color:#1d2233;border-radius:var(--r-m);padding:12px 16px;margin-top:12px;font:16px/1.4 Arial,"Helvetica Neue",Helvetica,sans-serif;border:1px solid var(--linea)}
.tm-prev .tm-ac{color:var(--acorde,#b3261e);font-weight:700;white-space:pre}
.tm-nota{margin:14px 0 0;color:var(--gris);font-size:13px}
.inicio{display:flex;flex-direction:column;gap:24px}
.bienvenida{background:linear-gradient(135deg,var(--azul),var(--azul-2));border-radius:var(--r-xl);padding:28px 32px;display:flex;align-items:center;justify-content:space-between;gap:20px;flex-wrap:wrap;box-shadow:var(--sombra-2)}
.bienvenida h1{color:#fff;margin:0}
.bienvenida p{color:#ffffffc7;margin:8px 0 0;font-size:15px}
.bienvenida .chip{background:var(--oro);color:var(--sobre-oro);font-weight:800;font-size:13px;padding:7px 16px;border-radius:999px;white-space:nowrap}
.col2{display:flex;flex-wrap:wrap;gap:24px;align-items:flex-start}
.col2 .novedades{flex:999 1 560px;min-width:0}
.col2 .barra-lateral{flex:1 1 280px;min-width:260px;display:flex;flex-direction:column;gap:18px}
.novedades .nh{display:flex;align-items:center;justify-content:space-between;margin-bottom:4px}
.novedades .nh h2{margin:0;font-size:20px}
.novedades .nh small{color:var(--gris);font-weight:600}
.novedades .ulist{display:flex;flex-direction:column;margin-top:14px}
.novedades .ulist .ufila{display:flex;align-items:flex-start;gap:14px;padding:13px 0;border-bottom:1px solid var(--linea);background:none;border-radius:0}
.novedades .ulist .ufila:last-child{border-bottom:0}
.novedades .nic{width:38px;height:38px;border-radius:10px;display:grid;place-items:center;flex:none}
.novedades .nic.cuenta{background:var(--capa);color:var(--azul-tx)}
.novedades .nic.cancion{background:var(--oro-claro);color:var(--oro-texto)}
.novedades .un{flex:1;min-width:0}
.novedades .un b{display:block}
.novedades .un small{display:block;color:var(--gris);font-weight:500;margin-top:2px}
.novedades .cuando{color:var(--gris);font-size:12.5px;font-weight:600;white-space:nowrap;padding-top:2px}
.espacio .eh{display:flex;align-items:center;gap:10px;margin-bottom:6px;color:var(--oro-texto)}
.espacio .eh h3{color:var(--tx);margin:0;font-size:15px}
.espacio p{margin:0;color:var(--gris);font-size:13.5px;font-weight:600;line-height:1.5}
@media(max-width:760px){.bienvenida{padding:22px}}
[data-vista=usuarios] .seccfg{margin-bottom:30px}
[data-vista=usuarios] .seccfg>.ch2{margin-bottom:4px}
[data-vista=usuarios] .seccfg>.ch2 h2{display:flex;align-items:center;gap:8px;font-size:19px}
[data-vista=usuarios] .ulist{display:grid;gap:8px;margin-top:14px}
[data-vista=usuarios] .ufila{display:flex;align-items:center;gap:12px;background:var(--capa);border-radius:var(--r-m);padding:10px 12px;flex-wrap:wrap}
[data-vista=usuarios] .ufila .un{flex:1;min-width:160px}
[data-vista=usuarios] .ufila b{display:block}
[data-vista=usuarios] .ufila small{display:block;color:var(--gris);font-weight:500}
[data-vista=usuarios] .rolchip{display:inline-block;background:var(--suave);color:var(--azul-tx);border-radius:999px;padding:2px 10px;font-size:12.5px;font-weight:700}
[data-vista=usuarios] .ufila.inactiva{opacity:.55}
[data-vista=usuarios] .mb2{display:flex;gap:6px;flex-wrap:wrap}
[data-vista=usuarios] .pend{display:inline-block;background:var(--oro-claro);color:var(--oro-texto);border-radius:999px;padding:2px 10px;font-size:12px;font-weight:700;white-space:nowrap}
[data-vista=usuarios] .mlist{display:grid;gap:8px;margin-top:14px}
[data-vista=usuarios] .mfila{display:flex;flex-direction:column;gap:10px;background:var(--capa);border-radius:var(--r-m);padding:10px 12px}
[data-vista=usuarios] .mfila-cab{display:flex;align-items:center;gap:14px;flex-wrap:wrap}
[data-vista=usuarios] .mfila-cab .un{flex:1;min-width:160px}
[data-vista=usuarios] .mfila-cab b{display:block}
[data-vista=usuarios] .mfila-cab small{display:block;color:var(--gris);font-weight:500}
[data-vista=usuarios] .mfila-cab .mb2{display:flex;gap:6px;flex-wrap:wrap}
[data-vista=usuarios] .mroster{display:grid;gap:6px;border-top:1px solid var(--linea);padding-top:10px;margin-top:2px}
[data-vista=usuarios] .mroster .ufila{background:var(--blanco)}
[data-vista=usuarios] .mtog{display:flex;align-items:center;gap:12px;flex:1;min-width:0;min-height:44px;padding:0;background:transparent;color:var(--tx);border:0;box-shadow:none;justify-content:flex-start;text-align:left}
[data-vista=usuarios] .mtog:hover{filter:none;background:transparent}
[data-vista=usuarios] .mtog b{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
[data-vista=usuarios] .mtog .flecha{display:inline-flex;transition:transform .2s}
[data-vista=usuarios] .mtog[aria-expanded=true] .flecha{transform:rotate(90deg)}
[data-vista=usuarios] .mcab{display:flex;align-items:center;gap:6px}
[data-vista=usuarios] .mas{flex:none;width:36px;height:36px;min-height:0;padding:0;display:inline-grid;place-items:center;background:transparent;color:var(--gris);border:0;box-shadow:none;border-radius:50%;margin-left:auto}
[data-vista=usuarios] .mas:hover,[data-vista=usuarios] .mas:focus-visible{filter:none;background:var(--suave);color:var(--azul-tx)}
.menu-pop{position:fixed;z-index:60;background:var(--blanco);border:1px solid var(--linea);border-radius:12px;box-shadow:var(--sombra-2);padding:6px;min-width:176px;display:grid;gap:2px}
.menu-pop button{display:flex;align-items:center;gap:8px;width:100%;min-height:38px;padding:6px 10px;background:transparent;color:var(--tx);border:0;box-shadow:none;border-radius:8px;justify-content:flex-start;text-align:left;font-weight:600}
.menu-pop button:hover,.menu-pop button:focus-visible{filter:none;background:var(--capa)}
.menu-pop button.peligro{color:var(--rojo,#C0392B)}
.menu-pop hr{border:0;border-top:1px solid var(--linea);margin:4px 0;width:100%}`;
document.head.append(st);

let U=[],listo=false,el=null,pintarEspaciosFn=null;
const esperando=[];
const usuariosCargados=()=>listo?Promise.resolve():new Promise(r=>esperando.push(r));
export const cargado=()=>Promise.all([usuariosCargados(),misionesCargadas()]).then(()=>{});   // esperan las cuentas y las misiones
export const sinCuentas=()=>listo&&U.length===0;

escuchar('usuarios',l=>{
  U=l;
  if(!listo){listo=true;esperando.forEach(r=>r());esperando.length=0}
  if(el)pintar();
  pintarInicio();
});
alCambiarMisiones(()=>{if(el)pintar();pintarInicio();refrescarCabecera();if(pintarEspaciosFn)pintarEspaciosFn()});   // si cambian las misiones, se vuelven a dibujar los nombres

// ---------- A qué espacios pertenecen las cuentas ----------
// Una cuenta puede tener roles en el espacio general y/o en varias misiones (ver rolesDe en base.js).
const esAdminU=u=>rolesDe(u).some(r=>r.nivel==='admin');                     // tiene el nivel Administrador
const nivelAdminU=u=>rolesDe(u).some(r=>esNivelGeneral(r.nivel));            // tiene algún rol en el espacio general (Administrador o su Editor)
const enMision=(u,id)=>nivelEn(u,id)!==null;                                  // tiene un rol en esa misión
const soloEnMision=(u,id)=>{const e=espaciosDe(u);return e.length>0&&e.every(x=>x.id===id)};   // y en ningún otro espacio
// miMision: la misión en la que se está trabajando ahora (null si se está en el espacio general).
const miMision=()=>{const e=espacioActual();return e&&e!==GENERAL?e:null};
// misionesDisponibles: para el selector de misión del autorregistro (ver login.js). Ya vienen ordenadas por país.
export function misionesDisponibles(){
  return listaMisiones().map(m=>({id:m.id,nombre:m.nombre,pais:m.pais||'',codigo:m.codigo||''}));
}
// nombreEspacio: el nombre corto de un espacio, para la cabecera y el selector.
function nombreEspacio(id){
  if(id===GENERAL)return 'General';
  if(id==='sin-mision')return 'Sin misión';
  const m=misionPorId(id);return m?m.nombre:'(misión eliminada)';
}
// descripcionRoles: los roles de una cuenta en texto («Editor de misión · San José · Perú»). Quien está en el
// espacio general los ve todos; quien está en una misión solo ve los roles de ESA misión.
function descripcionRoles(u){
  const todo=esNivelAdmin(),mid=miMision();
  return rolesDe(u).filter(r=>todo||(!esNivelGeneral(r.nivel)&&r.misionId===mid)).map(r=>{
    if(esNivelGeneral(r.nivel))return NIVELES[r.nivel];
    const m=misionPorId(r.misionId);
    return NIVELES[r.nivel]+' · '+(r.misionId==='sin-mision'?'Sin misión':m?etiquetaMision(m):'(misión eliminada)');
  }).join(' / ');
}
// Botón de inicio (logo y nombre): en una misión se ve el de ESA misión (si lo cambió); en el espacio general, el general.
definirApariencia(()=>{const a=sesion();if(!a)return null;const id=ambitoActual();if(!id)return null;const m=misionPorId(id);if(!m)return null;const r={};if(m.logo)r.logo=m.logo;if(m.nombreApp)r.nombre=m.nombreApp;return r});
addEventListener('ambitocambio',refrescarCabecera);

// ---------- Primera cuenta / autorregistro (los llama login.js) ----------
export async function crearPrimerAdmin(nombre,correo,clave){
  const cred=await crearCuentaAuth(correo,clave);
  await guardar('usuarios',cred.user.uid,{nombre:nombre||correo,correo,rol:'admin',editorDe:null,misionId:null,activo:true,creadoPor:null,requiereVerificacion:false,creadoEn:Date.now()});
  return cred.user;
}
export async function autorregistrar(nombre,correo,clave,misionId){
  const cred=await crearCuentaAuth(correo,clave);
  await enviarVerificacion(cred.user);
  await guardar('usuarios',cred.user.uid,{nombre:nombre||correo,correo,rol:'usuario',editorDe:null,misionId,activo:true,creadoPor:null,requiereVerificacion:true,creadoEn:Date.now()});
  return cred.user;
}

// rolesCreables: los niveles que puede crear quien está trabajando ahora (según su nivel en el espacio activo)
function rolesCreables(){
  const n=k=>[k,NIVELES[k]],nivel=nivelActivo();
  if(nivel==='admin')return ['admin','editor-admin','editor-mision','mision','usuario'].map(n);
  if(nivel==='editor-admin')return ['editor-admin','editor-mision','mision','usuario'].map(n);   // no crea Administradores
  if(nivel==='mision'||nivel==='editor-mision')return [['editor-mision','Editor'],['usuario','Usuario']];   // no crea cuentas Misión (ni Administradores)
  return [];
}
// cuentasVisibles: en el espacio general, las cuentas que tienen algún rol general (las de cada misión
// se gestionan desde su propia tarjeta en «Misiones»). En una misión, las cuentas que tienen un rol en ESA misión.
function cuentasVisibles(actor){
  if(esNivelAdmin())return U.filter(nivelAdminU);
  const mision=miMision();                      // una misión nunca ve cuentas de otras misiones
  return mision?U.filter(u=>enMision(u,mision)):[];
}
// puedeEditarCuenta: ¿se muestra el botón «Editar» de esta cuenta?
function puedeEditarCuenta(u,actor){
  const n=nivelActivo();
  if(n==='admin')return true;                   // también la suya: así el Administrador elige libremente sus propias misiones
  if(u.id===actor.id)return false;              // las demás cuentas usan «Mi cuenta» para lo suyo
  if(n==='editor-admin')return !esAdminU(u);    // el Editor del administrador no edita a los Administradores
  const mision=miMision();
  // una cuenta con roles en otros espacios (p. ej. también en el general) la gestiona solo el Administrador:
  // así nadie puede desactivar ni cambiar a una persona por un rol que tiene en otro lado
  if(!mision||!soloEnMision(u,mision))return false;
  if(n==='mision')return true;
  if(n==='editor-mision')return nivelEn(u,mision)!=='mision';   // el Editor de misión no edita a las cuentas Misión
  return false;
}
// puedeEliminarCuenta: ¿se muestra el botón de eliminar? Nunca la propia; y ningún Editor elimina a otro Editor.
function puedeEliminarCuenta(u,actor){
  if(u.id===actor.id)return false;
  if(!puedeEditarCuenta(u,actor))return false;
  const n=nivelActivo();
  if(n==='admin'||n==='mision')return true;
  return !rolesDe(u).some(r=>r.nivel==='editor-admin'||r.nivel==='editor-mision');
}

// avatar: foto de perfil redonda; si no hay foto, la inicial del nombre.
const avatar=(u,s=28)=>{const t=`width:${s}px;height:${s}px;font-size:${Math.round(s*.45)}px`;return u.foto?`<img class="av" style="${t}" src="${u.foto}" alt="">`:`<span class="av" style="${t}" aria-hidden="true">${esc((u.nombre||u.correo||'?').trim().charAt(0).toUpperCase())}</span>`};
// PANEL: actualiza foto y nombre (botón de la cabecera y parte de arriba del panel) cuando la cuenta cambia
function pintarCuentaEnMenu(u){
  const nm=u.nombre||u.correo||'';
  const b=document.querySelector('header .btn-usuario');
  if(b){b.querySelector('.avw').innerHTML=avatar(u,28);b.querySelector('.nm').textContent=nm}
  const p=document.querySelector('#pcfg .pcfg-per');
  if(p){p.querySelector('.avw').innerHTML=avatar(u,44);p.querySelector('.nm').textContent=nm}
}

// ---------- Menú de la cuenta: botón con foto y nombre en la cabecera + panel lateral «Configuración» ----------
// El panel se despliega desde la derecha ocupando todo el alto. Opciones: Mi cuenta, Usuarios, Etiquetas y Salir.
//   Usuarios y Etiquetas solo las ven quienes pueden editar (puedeEditar). Tema la ven todas las cuentas. Se cierra con la X, tocando fuera o con Esc.
// (no van en la barra de navegación: son acciones de la cuenta, no secciones de contenido)
const PERSONA='<path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>';
const ETIQ='<path d="M20.6 13.4l-7.2 7.2a2 2 0 01-2.8 0L3 13V3h10l7.6 7.6a2 2 0 010 2.8z"/><circle cx="7.5" cy="7.5" r="1.2"/>';
const sv=(p,s=18)=>`<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
// =====================================================================
//  TEMA  ·  modo claro / oscuro, color principal y color de los acordes
//  Cada cuenta elige lo suyo en el panel «Configuración» → «Tema» (cualquier rol).
//   - Se guarda en la cuenta (usuarios/<id>.tema = {modo, color, acordes}) y una copia en este
//     dispositivo (localStorage «tema») que index.html aplica antes de dibujar, para que no parpadee.
//   - Sin elegir nada, todos quedan como siempre: modo claro, Azul y acordes rojos.
//   - modo: 'claro' | 'oscuro' | 'auto' (sigue al dispositivo).  color: ver COLORES_TEMA.
//   - Los colores de cada paleta (claro y oscuro) están en estilos.css, sección 1b.
//   - Las hojas de canciones siguen siempre blancas; los acordes usan --acorde (hoja.js y editor.js).
//   - La ventana Compartir (#ver/) no usa el tema (index.html lo omite ahí).
// =====================================================================
const COLORES_TEMA=[['azul','Azul','#1F2A4D'],['verde','Verde','#1F4D3A'],['turquesa','Turquesa','#0F4C5C'],['morado','Morado','#3B2A5E'],['vino','Vino','#5A1F36'],['naranja','Naranja','#A8461A'],['grafito','Grafito','#2B2F3A']];
const ACORDES_TEMA=[['#B3261E','Rojo'],['#1F6FEB','Azul'],['#2E7D32','Verde'],['#7B1FA2','Morado'],['#C25E00','Naranja'],['#1D2233','Negro']];
const TEMA0={modo:'claro',color:'azul',acordes:'#B3261E'};
const SOL='<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>';
const LUNA='<path d="M21 12.8A9 9 0 1111.2 3a7 7 0 009.8 9.8z"/>';
const AUTO='<circle cx="12" cy="12" r="9"/><path d="M12 3a9 9 0 010 18z" fill="currentColor"/>';
const PALETA='<circle cx="13.5" cy="6.5" r="1.5"/><circle cx="17.5" cy="10.5" r="1.5"/><circle cx="8.5" cy="7.5" r="1.5"/><circle cx="6.5" cy="12.5" r="1.5"/><path d="M12 2a10 10 0 100 20c1.1 0 2-.9 2-2 0-.5-.2-1-.5-1.3-.3-.3-.5-.8-.5-1.3 0-1.1.9-2 2-2h2.4c3 0 5.6-2.5 5.6-5.6C22 6 17.5 2 12 2z"/>';
let temaActual={...TEMA0},alCambiarModo=null;
// Aplica el tema a toda la app (y guarda la copia de este dispositivo)
export function aplicarTema(t){
  temaActual={...TEMA0,...(t||{})};
  if(!COLORES_TEMA.some(c=>c[0]===temaActual.color))temaActual.color='azul';
  const d=document.documentElement,mq=matchMedia('(prefers-color-scheme: dark)');
  const poner=()=>{
    const oscuro=temaActual.modo==='oscuro'||(temaActual.modo==='auto'&&mq.matches);
    d.dataset.modo=oscuro?'oscuro':'claro';d.dataset.color=temaActual.color;
    d.style.setProperty('--acorde',temaActual.acordes);
    const m=document.querySelector('meta[name=theme-color]'),c=getComputedStyle(d).getPropertyValue('--cab').trim();
    if(m&&c)m.content=c;                                   // el color de la barra del navegador en el celular
  };
  if(alCambiarModo){mq.removeEventListener('change',alCambiarModo);alCambiarModo=null}
  if(temaActual.modo==='auto'){alCambiarModo=poner;mq.addEventListener('change',alCambiarModo)}
  poner();
  try{localStorage.setItem('tema',JSON.stringify(temaActual))}catch(e){}
}
// La ventana del panel «Configuración» → «Tema». Todo se aplica al instante; no hay botón de guardar.
function ventanaTema(){
  const o=modal('<div id="tm"></div>'),z=$('#tm',o);
  const mismo=(a,b)=>String(a).toLowerCase()===String(b).toLowerCase();
  const pinta=()=>{
    const t=temaActual;
    const pt=(attr,hex,nombre,sel)=>`<button class="tm-sw" ${attr} aria-pressed="${sel}"><span class="tm-pt" style="background:${hex}"></span><span>${nombre}</span></button>`;
    z.innerHTML=`<div class="mh"><h2>Tema</h2><button class="ic" data-cx aria-label="Cerrar">${ic('x')}</button></div>
      <h3 class="tm-h">Modo</h3>
      <div class="tm-modos" role="group" aria-label="Modo">${[['claro','Claro',SOL],['oscuro','Oscuro',LUNA],['auto','Autom\u00e1tico',AUTO]].map(([v,n,p])=>`<button data-modo="${v}" aria-pressed="${t.modo===v}">${sv(p,20)}<span>${n}</span></button>`).join('')}</div>
      <h3 class="tm-h">Color</h3>
      <div class="tm-grid" role="group" aria-label="Color">${COLORES_TEMA.map(([v,n,hex])=>pt(`data-color="${v}"`,hex,n,t.color===v)).join('')}</div>
      <h3 class="tm-h">Color de los acordes</h3>
      <div class="tm-grid" role="group" aria-label="Color de los acordes">${ACORDES_TEMA.map(([hex,n])=>pt(`data-acorde="${hex}"`,hex,n,mismo(t.acordes,hex))).join('')}</div>
      <div class="tm-prev" aria-hidden="true"><span class="tm-ac">C          G          Am</span><br>Gloria a Dios en el cielo</div>
      <p class="tm-nota">Se guarda en tu cuenta y se aplica al instante. Las hojas de canciones siguen siendo blancas para leerlas e imprimirlas bien.</p>`;
  };
  pinta();
  o.onclick=e=>{
    const b=e.target.closest('button');if(!b)return;const d=b.dataset;
    if(d.cx!=null){o.remove();return}
    const cambio=d.modo?{modo:d.modo}:d.color?{color:d.color}:d.acorde?{acordes:d.acorde}:null;
    if(!cambio)return;
    const nuevo={...temaActual,...cambio};
    aplicarTema(nuevo);pinta();
    const a=sesion();
    if(a)Promise.resolve().then(()=>guardar('usuarios',a.id,{tema:nuevo})).catch(()=>aviso('No se pudo guardar el tema en tu cuenta.'));
  };
}

let alEscape=null;
export function montarMenuUsuario(salir){
  const actor=sesion();
  const header=document.querySelector('header');
  if(!header||!actor||header.querySelector('.menu-usuario'))return;
  aplicarTema(actor.tema);                         // TEMA: el de la cuenta (o el de siempre si nunca eligió)
  const viejo=document.getElementById('pcfg');if(viejo)viejo.remove();
  if(alEscape)document.removeEventListener('keydown',alEscape);
  const nombre=esc(actor.nombre||actor.correo);
  const cont=document.createElement('div');
  cont.className='menu-usuario';
  cont.innerHTML=`<button class="btn-usuario" aria-haspopup="dialog" aria-expanded="false" aria-controls="pcfg"><span class="avw">${avatar(actor,28)}</span><span class="nm">${nombre}</span> &#9662;</button>`;
  const capa=document.createElement('div');
  capa.id='pcfg';capa.className='pcfg-capa';
  capa.innerHTML=`<div class="pcfg-fondo" data-pc></div>
    <aside class="pcfg" role="dialog" aria-modal="true" aria-label="Configuración">
      <div class="pcfg-cab"><h2>Configuración</h2><button class="ic" data-pc aria-label="Cerrar">${ic('x')}</button></div>
      <div class="pcfg-per"><span class="avw">${avatar(actor,44)}</span><span class="nm">${nombre}</span></div>
      <nav class="pcfg-ops" aria-label="Configuración"></nav>
    </aside>`;
  const boton=cont.querySelector('.btn-usuario'),ops=capa.querySelector('.pcfg-ops');
  // las opciones se arman al abrir: lo que ves depende del espacio de trabajo activo
  const armar=()=>{
    const ed=puedeEditar(),h=location.hash.slice(1),ac=x=>`aria-current="${h===x}"`;
    ops.innerHTML=`<button data-mc ${ac('cuenta')}>${sv(PERSONA)} Mi cuenta</button>`
      +(ed?`<button data-us ${ac('usuarios')}>${ic('usr',18)} Usuarios</button><button data-et ${ac('etiquetas')}>${sv(ETIQ)} Etiquetas</button>`:'')
      +`<button data-tm>${sv(PALETA)} Tema</button>`
      +`<button class="pcfg-sal" data-sal>${ic('out',18)} Salir</button>`;
  };
  const abrir=()=>{armar();const barra=innerWidth-document.documentElement.clientWidth;capa.classList.add('abierta');boton.setAttribute('aria-expanded','true');document.body.style.overflow='hidden';if(barra>0)document.body.style.paddingRight=barra+'px';capa.querySelector('.pcfg-cab .ic').focus({preventScroll:true})};   // el ancho de la barra de scroll se reserva para que la página no se corra (temblor)
  const cerrar=volver=>{if(!capa.classList.contains('abierta'))return;capa.classList.remove('abierta');boton.setAttribute('aria-expanded','false');document.body.style.overflow='';document.body.style.paddingRight='';if(volver)boton.focus({preventScroll:true})};
  boton.onclick=()=>capa.classList.contains('abierta')?cerrar(true):abrir();
  capa.onclick=e=>{
    const b=e.target.closest('button,[data-pc]');if(!b)return;const d=b.dataset;
    if(d.pc!=null)cerrar(true);
    else if(d.mc!=null){cerrar(false);location.hash='cuenta'}
    else if(d.us!=null){cerrar(false);location.hash='usuarios'}
    else if(d.et!=null){cerrar(false);location.hash='etiquetas'}
    else if(d.tm!=null){cerrar(false);ventanaTema()}
    else if(d.sal!=null){cerrar(false);salir()}
  };
  alEscape=e=>{if(e.key==='Escape')cerrar(true)};
  document.addEventListener('keydown',alEscape);
  addEventListener('hashchange',()=>cerrar(false));
  document.body.append(capa);
  header.append(cont);
  montarEspacios(header,cont);
}

// ---------- Espacio de trabajo: botón en la cabecera (solo si la cuenta tiene más de un espacio) ----------
// Muestra en qué espacio se está trabajando (General o el nombre de la misión) y deja cambiar a otro.
// Todo lo que se crea o se edita va al espacio activo; al cambiar, se vuelve al Inicio del otro espacio.
function montarEspacios(header,antes){
  if(header.querySelector('.menu-espacio'))return;
  const c=document.createElement('div');c.className='menu-espacio';c.hidden=true;
  header.insertBefore(c,antes);
  const cerrar=()=>{const d=c.querySelector('.dd-usuario'),b=c.querySelector('.btn-espacio');if(d)d.hidden=true;if(b)b.setAttribute('aria-expanded','false')};
  c.onclick=e=>{
    const op=e.target.closest('[data-esp]');
    if(op){cerrar();cambiarEspacio(op.dataset.esp);return}
    const b=e.target.closest('.btn-espacio');
    if(b){const d=c.querySelector('.dd-usuario'),abrir=d.hidden;d.hidden=!abrir;b.setAttribute('aria-expanded',String(abrir))}
  };
  document.addEventListener('click',e=>{if(!c.contains(e.target))cerrar()});
  pintarEspaciosFn=()=>{
    const actor=sesion(),lista=actor?espaciosDe(actor):[];
    c.hidden=lista.length<2;                                         // con un solo espacio no hay nada que elegir
    if(c.hidden){c.innerHTML='';return}
    const act=espacioActual();
    c.innerHTML=`<button type="button" class="btn-espacio" aria-haspopup="true" aria-expanded="false" title="Espacio de trabajo: ${esc(nombreEspacio(act))}">${ic('pin',16)}<span class="nm">${esc(nombreEspacio(act))}</span> &#9662;</button>
      <div class="dd-usuario" hidden><div class="nombre"><span class="nm">Espacio de trabajo</span></div>${lista.map(e=>`<button type="button" class="esp" data-esp="${esc(e.id)}" aria-current="${e.id===act}">${e.id===act?'✓ ':''}<span>${esc(nombreEspacio(e.id))}</span><small>${esc(NIVELES[e.nivel])}</small></button>`).join('')}</div>`;
  };
  pintarEspaciosFn();
}
addEventListener('ambitocambio',()=>{if(pintarEspaciosFn)pintarEspaciosFn()});

// ---------- Pantalla «Mi cuenta» (cualquier rol): datos propios y contraseña ----------
vistas.cuenta=contenedor=>{
  const actor=sesion();if(!actor)return;
  const m=nivelActivo()==='mision'?misionPorId(ambitoActual()):null;     // solo la cuenta Misión cambia el botón de inicio de su misión
  const creador=U.find(x=>x.id===actor.creadoPor);
  const sinVerificar=!!creador&&rolesDe(creador).some(r=>r.nivel==='mision'||r.nivel==='editor-mision')&&!!auth.currentUser&&!auth.currentUser.emailVerified;
  let foto=actor.foto||'',logoApp=(m&&m.logo)||'';
  contenedor.innerHTML=`<div class="ch2"><h1>Mi cuenta</h1></div>
    ${sinVerificar?`<div style="background:var(--oro-claro);border-radius:var(--r-m);padding:12px 14px;margin-bottom:14px"><b>Verifica tu correo</b><p style="margin:4px 0 10px;color:var(--gris);font-size:13.5px">Tu correo aún no está verificado. Puedes hacerlo cuando quieras: te enviamos un mensaje con un enlace.</p><div class="barra" style="margin:0"><button id="bv">Enviar correo de verificación</button><button class="sec" id="bv2">Ya lo verifiqué</button></div></div>`:''}
    <div style="display:flex;align-items:center;gap:14px;margin-bottom:14px"><span id="pv" style="display:inline-flex">${avatar({...actor,foto},64)}</span><div class="barra" style="margin:0"><button class="sec" id="bf">${ic('img',16)} Cambiar foto</button><button class="sec" id="bqf" ${foto?'':'hidden'}>${ic('x',16)} Quitar foto</button><input type="file" id="ff" accept="image/*" hidden></div></div>
    ${m?`<div style="border:1px solid var(--linea);border-radius:var(--r-m);padding:14px;margin:6px 0 16px"><h2 style="margin:0 0 4px;font-size:17px">Botón de inicio</h2><p style="margin:0 0 12px;color:var(--gris);font-size:13.5px">El logo y el nombre que ven arriba a la izquierda tú y todo tu equipo. Si los dejas vacíos se usa el general.</p>
      <div style="display:flex;align-items:center;gap:14px;margin-bottom:12px"><span id="lv" style="display:inline-flex;width:40px;height:40px;align-items:center;justify-content:center"></span><div class="barra" style="margin:0"><button class="sec" id="bl2">${ic('img',16)} Cambiar logo</button><button class="sec" id="bq2">${ic('x',16)} Quitar logo</button><input type="file" id="fl2" accept="image/*" hidden></div></div>
      <label class="fl2">Nombre<input id="fnapp" value="${esc(m.nombreApp||'')}" placeholder="${esc(configActual().nombre)}" autocomplete="off"></label></div>`:''}
    <label class="fl2" style="margin-bottom:12px">Nombre<input id="fn" value="${esc(actor.nombre||'')}" autocomplete="off"></label>
    <label class="fl2" style="margin-bottom:12px">Correo<input id="fe" value="${esc(actor.correo||'')}" disabled></label>
    <label class="fl2" style="margin-bottom:12px">Nueva contraseña (vacío = no cambiar)<input id="fc1" type="password" autocomplete="new-password"></label>
    <label class="fl2" style="margin-bottom:12px">Repetir contraseña<input id="fc2" type="password" autocomplete="new-password"></label>
    <p class="error" role="alert" hidden></p>
    <button id="ok">Guardar</button>`;
  const err=t=>{const p=$('.error',contenedor);p.textContent=t;p.hidden=!t};
  const pintaLogo=()=>{const v=$('#lv',contenedor);if(!v)return;v.innerHTML=logoApp?`<img src="${logoApp}" alt="" style="max-width:40px;max-height:40px">`:ic('mus',22);$('#bq2',contenedor).hidden=!logoApp};
  pintaLogo();
  contenedor.onchange=async e=>{
    const f=e.target.files&&e.target.files[0];if(!f)return;
    if(e.target.id==='ff'){foto=await imagen(f,160);$('#pv',contenedor).innerHTML=avatar({...actor,foto},64);$('#bqf',contenedor).hidden=false}
    else if(e.target.id==='fl2'){logoApp=await imagen(f,200);pintaLogo()}
    e.target.value='';
  };
  contenedor.onclick=async e=>{
    const b=e.target.closest('button');if(!b)return;
    if(b.id==='bf')return $('#ff',contenedor).click();
    if(b.id==='bqf'){foto='';$('#pv',contenedor).innerHTML=avatar({...actor,foto:''},64);b.hidden=true;return}
    if(b.id==='bl2')return $('#fl2',contenedor).click();
    if(b.id==='bq2'){logoApp='';pintaLogo();return}
    if(b.id==='bv'){
      try{await enviarVerificacion(auth.currentUser);aviso('Te enviamos un correo para verificar tu cuenta. Revisa también la carpeta de spam.')}
      catch(e2){aviso(e2.code==='auth/too-many-requests'?'Demasiados intentos. Espera unos minutos.':'No se pudo enviar el correo.')}
      return;
    }
    if(b.id==='bv2'){try{await recargarUsuarioAuth(auth.currentUser)}catch(e2){}return vistas.cuenta(contenedor)}
    if(b.id!=='ok')return;
    const nombre=$('#fn',contenedor).value.trim(),c1=$('#fc1',contenedor).value,c2=$('#fc2',contenedor).value;
    if(c1&&c1!==c2)return err('Las contraseñas no coinciden.');
    if(c1&&c1.length<6)return err('La contraseña debe tener al menos 6 caracteres.');
    if(c1){
      try{await cambiarMiClave(auth.currentUser,c1)}
      catch(e2){return err(e2.code==='auth/requires-recent-login'?'Por seguridad, cierra sesión y vuelve a entrar antes de cambiar la contraseña.':'No se pudo cambiar la contraseña.')}
    }
    const cambios={nombre:nombre||actor.correo,foto};
    guardar('usuarios',actor.id,cambios).catch(()=>aviso('No se pudo guardar tu perfil.'));
    if(m)guardar('misiones',m.id,{nombreApp:$('#fnapp',contenedor).value.trim(),logo:logoApp}).catch(()=>aviso('No se pudo guardar el botón de inicio.'));
    establecerSesion({...actor,...cambios});
    pintarCuentaEnMenu({...actor,...cambios});
    aviso('Datos actualizados.');
  };
};

// ---------- Pantalla «Usuarios» ----------
vistas.usuarios=contenedor=>{
  el=contenedor;
  if(!puedeEditar()){el.innerHTML='<p class="vacio">No tienes acceso a esta pantalla.</p>';return}
  pintar();
};
addEventListener('hashchange',()=>{if(location.hash!=='#usuarios')el=null});


function pintar(){
  cerrarMenuMas();
  if(!el)return;
  const actor=sesion();if(!actor)return;
  el.innerHTML=esNivelAdmin()?pintarAdmin(actor):pintarEquipo(actor);
  el.onclick=clic;
  if(esNivelAdmin())cablearAdministracion();
}

// Vista de una cuenta Misión/Editor de misión: solo su propio equipo.
function pintarEquipo(actor){
  const lista=cuentasVisibles(actor).slice().sort((a,b)=>(a.nombre||a.correo).localeCompare(b.nombre||b.correo,'es'));
  return `<div class="ch2"><h1>Usuarios</h1><button data-nu>${ic('pls',16)} Nueva cuenta</button></div>
    <div class="ulist">${lista.map(u=>fila(u,actor)).join('')||'<p class="vacio">Aún no hay cuentas aquí.</p>'}</div>`;
}

// Vista del Administrador (y su Editor): Usuarios (espacio general) / Misiones (con su propio
// equipo anidado en cada tarjeta) / Administración (nombre, logo, copia de seguridad).
function pintarAdmin(actor){
  const rango=u=>u.id===actor.id?0:(esAdminU(u)?1:2);        // tu cuenta primero, luego los demás Administradores, luego los Editores
  const admins=cuentasVisibles(actor).sort((a,b)=>rango(a)-rango(b)||(a.nombre||a.correo).localeCompare(b.nombre||b.correo,'es'));
  const misiones=listaMisiones();
  const h=huerfanos();
  const cfg=configActual();
  return `<div class="ch2"><h1>Usuarios</h1></div>

    <section class="seccfg">
      <div class="ch2"><h2>${ic('usr',19)} Usuarios</h2><button data-nu>${ic('pls',16)} Nueva cuenta</button></div>
      <div class="ulist">${admins.map(u=>fila(u,actor,'general')).join('')||'<p class="vacio">Aún no hay cuentas aquí.</p>'}</div>
    </section>

    <section class="seccfg">
      <div class="ch2"><h2>${ic('pin',19)} Misiones</h2><button data-nm>${ic('pls',16)} Añadir misión</button></div>
      <div class="mlist">${misiones.map(misionFila).join('')||'<p class="vacio">Aún no hay misiones. Pulsa «Añadir misión» para crear la primera.</p>'}</div>
      ${h.length?`<p class="vacio" style="margin-top:16px">Sin misión asignada (su misión ya no existe):</p><div class="ulist">${h.map(u=>fila(u,actor,'roster')).join('')}</div>`:''}
    </section>

    <section class="seccfg">
      <div class="ch2"><h2>${ic('cfg',19)} Administración</h2></div>
      <div class="ulist">
        <div class="ufila">
          <div class="un"><b>Logo de la app</b><small>Se muestra en la cabecera y en el icono de la pestaña.</small></div>
          <div class="mb2"><button id="bl">${ic('img',16)} Cambiar logo</button>${cfg.logo?`<button class="sec" id="bq">${ic('x',16)} Quitar logo</button>`:''}<input type="file" id="fl" accept="image/*" hidden></div>
        </div>
        <div class="ufila">
          <div class="un"><b>Nombre de la app</b><small>El nombre que aparece junto al logo, arriba de todo.</small></div>
          <div class="mb2"><button id="bn">${ic('edt',16)} Cambiar nombre</button></div>
        </div>
        <div class="ufila">
          <div class="un"><b>Copia de seguridad</b><small>Descarga todos los datos de la app en un archivo.</small></div>
          <div class="mb2"><button class="sec" id="br">${ic('cfg',16)} Copia de seguridad</button></div>
        </div>
      </div>
    </section>`;
}

function cablearAdministracion(){
  const bl=$('#bl',el);if(bl)bl.onclick=()=>$('#fl',el).click();
  const fl=$('#fl',el);if(fl)fl.onchange=async e=>guardar('config','app',{logo:await imagen(e.target.files[0],200)});
  const bq=$('#bq',el);if(bq)bq.onclick=()=>{if(confirm('¿Quitar el logo y volver al icono por defecto?'))guardar('config','app',{logo:''})};
  const bn=$('#bn',el);if(bn)bn.onclick=()=>{const n=prompt('Nombre de la app',configActual().nombre);if(n)guardar('config','app',{nombre:n})};
  const br=$('#br',el);if(br)br.onclick=abrirRespaldo;
}

// ---------- Misiones (anidadas aquí: ver banner de arriba de este archivo) ----------
// equipoTodos: todas las cuentas de esta misión (cualquier nivel), para anidarlas en su tarjeta
// en vez de mezclarlas con las demás en la sección «Usuarios» (ver cuentasVisibles).
const equipoTodos=id=>U.filter(u=>enMision(u,id)).sort((a,b)=>(a.nombre||a.correo).localeCompare(b.nombre||b.correo,'es'));
// huerfanos: cuentas cuya misión ya no existe (se borró la misión a la que pertenecían). Sin
// esto quedarían invisibles (y por lo tanto imposibles de gestionar) en esta pantalla.
const huerfanos=()=>U.filter(u=>rolesDe(u).some(r=>!esNivelGeneral(r.nivel)&&!misionPorId(r.misionId)));
const misAbiertas=new Set();   // misiones desplegadas (se recuerdan aunque la pantalla se vuelva a dibujar)

// misionFila: una misión = bandera, nombre (y debajo el país y cuántas cuentas tiene), sus
// botones y, debajo, su propio equipo anidado (con sus Editar/Eliminar) — así no hace falta ir
// a buscarlo a la sección «Usuarios», que para el Administrador ya solo muestra el espacio general.
function misionFila(m){
  const equipo=equipoTodos(m.id),n=equipo.length,sub=[m.pais,n?`${n} ${n===1?'cuenta':'cuentas'}`:''].filter(Boolean).join(' · ');
  const actor=sesion(),abierta=misAbiertas.has(m.id);
  return `<div class="mfila">
    <div class="mcab">
      <button type="button" class="mtog" data-mt="${m.id}" aria-expanded="${abierta}">${banderaHtml(m.codigo,m.pais)}<b>${esc(m.nombre)}</b><span class="flecha">${ic('rgt',16)}</span></button>
      <button type="button" class="mas" data-mas="m:${m.id}" aria-haspopup="menu" aria-label="Opciones de la misión ${esc(m.nombre)}" title="Opciones">${PUNTOS}</button>
    </div>
    ${abierta?`<div class="mfila-cab"><div class="un"><small>${esc(sub)}</small></div></div>
    ${equipo.length?`<div class="mroster">${equipo.map(u=>fila(u,actor,'roster',m.id)).join('')}</div>`:''}`:''}
  </div>`;
}

// formularioMision: ventanita para añadir o editar una misión (m=null para una nueva).
function formularioMision(m){
  const nueva=!m;
  if(!nueva&&!m.id)return;
  const o=modal(`<div class="mh"><h2>${nueva?'Añadir misión':'Editar misión'}</h2><button class="ic" data-cx aria-label="Cerrar">${ic('x')}</button></div>
    <label class="fl2" style="margin-bottom:12px">País${selectorBandera({id:'fp',name:'pais',placeholder:'Elige un país…',valor:m?m.codigo:'',opciones:PAISES.map(([c,n])=>({valor:c,texto:n,codigo:c}))})}</label>
    <label class="fl2" style="margin-bottom:12px">Nombre de la misión<input id="fn" value="${esc(m?m.nombre:'')}" autocomplete="off"></label>
    <p class="error" role="alert" hidden></p>
    <div class="barra" style="justify-content:flex-end;margin:6px 0 0"><button class="sec" data-cx>Cancelar</button><button id="ok">Guardar</button></div>`);
  const err=t=>{const p=$('.error',o);p.textContent=t;p.hidden=!t};
  activarSelectores(o);
  const aceptar=()=>{
    const codigo=$('#fp',o).value,nombre=$('#fn',o).value.trim();
    if(!codigo)return err('Elige un país.');
    if(!nombre)return err('Escribe el nombre de la misión.');
    if(listaMisiones().some(x=>x.id!==(m&&m.id)&&x.codigo===codigo&&alfa(x.nombre,nombre)===0))return err('Ya existe una misión con ese nombre en ese país.');
    const datos={codigo,pais:NOMBRE_PAIS[codigo],nombre};
    if(nueva)crear('misiones',datos);else guardar('misiones',m.id,datos);
    o.remove();aviso(nueva?'Misión añadida.':'Cambios guardados.');
  };
  o.onclick=e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.cx!=null)o.remove();else if(b.id==='ok')aceptar()};
  o.onkeydown=e=>{if(e.key==='Enter'&&e.target.tagName!=='SELECT'&&!e.target.closest('.sb')){e.preventDefault();aceptar()}};
  const primero=nueva?$('.sb-btn',o):$('#fn',o);if(primero)primero.focus();
}

// chipsDe: las etiquetas de la fila de una cuenta. En «Usuarios» (ctx 'general') su rol general y cuántas misiones más
// tiene; dentro de una misión (ctx 'roster' con su id, o la vista de equipo) solo su rol EN esa misión.
function chipsDe(u,ctx,mid){
  const R=rolesDe(u),out=[];
  const corta=n=>n==='admin'?'Administrador':n==='editor-admin'?'Editor':n==='editor-mision'?(ctx==='roster'?'Editor de misión':'Editor'):'';   // Misión y Usuario no llevan etiqueta
  if(ctx==='general'){
    R.filter(r=>esNivelGeneral(r.nivel)).forEach(r=>out.push(corta(r.nivel)));
    const n=R.filter(r=>!esNivelGeneral(r.nivel)).length;
    if(n)out.push('+ '+n+(n===1?' misión':' misiones'));
  }else{
    const aqui=R.filter(r=>!esNivelGeneral(r.nivel)&&(mid?r.misionId===mid:!misionPorId(r.misionId)));   // sin mid: las de misiones que ya no existen
    aqui.forEach(r=>out.push(corta(r.nivel)));
    if(R.length>aqui.length)out.push('Varios espacios');
  }
  return out.filter(Boolean);
}
export function fila(u,actor,ctx,mid){
  const edita=puedeEditarCuenta(u,actor);
  const tuya=u.id===actor.id;
  const pendiente=u.requiereVerificacion&&!u.emailVerified&&u.id!==actor.id;
  const chips=chipsDe(u,ctx,mid||(ctx?undefined:miMision()));
  return `<div class="ufila${u.activo===false?' inactiva':''}">
    <div class="un"><b>${esc(u.nombre||u.correo)}${tuya?' (tú)':''}</b><small>${esc(u.correo||'')}${u.activo===false?' · Desactivada':''}</small></div>
    ${chips.map(t=>`<span class="rolchip">${esc(t)}</span>`).join('')}
    ${pendiente?`<span class="pend">Sin verificar correo</span>`:''}
    ${edita?`<button class="mas" data-mas="u:${u.id}" aria-haspopup="menu" aria-label="Opciones de ${esc(u.nombre||u.correo)}" title="Opciones">${PUNTOS}</button>`:''}
  </div>`;
}

function clic(e){
  const b=e.target.closest('button');if(!b)return;const d=b.dataset;
  if(d.nu!=null)formNuevo();
  else if(d.mas)menuMas(b,d.mas);
  else if(!esNivelAdmin())return;                 // lo que sigue es solo de Misiones (Administrador y su Editor)
  else if(d.nm!=null)formularioMision(null);
  else if(d.mt){misAbiertas.has(d.mt)?misAbiertas.delete(d.mt):misAbiertas.add(d.mt);pintar()}
}

function eliminarCuenta(u){
  if(!u||!puedeEliminarCuenta(u,sesion()))return;
  if(esAdminU(u)&&U.filter(esAdminU).length<=1)return alert('Debe quedar al menos una cuenta de Administrador.');
  if(confirm('¿Eliminar la cuenta "'+(u.nombre||u.correo)+'"? Dejará de verse en la app, pero su acceso de inicio de sesión no queda totalmente revocado (eso requiere la consola de Firebase). Para solo quitarle el acceso, mejor desactívala desde «Editar».')){
    eliminar('usuarios',u,'la cuenta "'+(u.nombre||u.correo)+'"',true);
  }
}
function eliminarMision(m){
  if(!m||!esNivelAdmin())return;
  const n=equipoTodos(m.id).length;
  if(n)return alert(`Esta misión tiene ${n} ${n===1?'cuenta':'cuentas'}. Primero quítales esta misión (con «Editar»), o elimina esas cuentas (desde esta misma pantalla).`);
  eliminar('misiones',m,'la misión "'+m.nombre+'"');
}

// ---------- Menú de los 3 puntos (⋮): una mini ventana con Editar y, debajo, Eliminar ----------
// Sirve para cada cuenta («u:ID») y para cada misión («m:ID»). Solo muestra lo que esa cuenta puede hacer.
const PUNTOS='<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="12" cy="5" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="12" cy="19" r="1.8"/></svg>';
let menuAbierto=null;
function cerrarMenuMas(){if(menuAbierto){menuAbierto.remove();menuAbierto=null}}
function menuMas(btn,clave){
  const mismo=menuAbierto&&menuAbierto._btn===btn;
  cerrarMenuMas();if(mismo)return;
  const tipo=clave.charAt(0),id=clave.slice(2),actor=sesion();if(!actor)return;
  const items=[];                                  // [icono, texto, acción, peligro?]
  if(tipo==='u'){
    const u=U.find(x=>x.id===id);if(!u)return;
    if(puedeEditarCuenta(u,actor))items.push(['edt','Editar',()=>formEditar(u)]);
    if(puedeEliminarCuenta(u,actor))items.push(['trs','Eliminar cuenta',()=>eliminarCuenta(u),true]);
  }else if(esNivelAdmin()){
    const m=misionPorId(id);if(!m)return;
    items.push(['edt','Editar misión',()=>formularioMision(m)],['trs','Eliminar misión',()=>eliminarMision(m),true]);
  }
  if(!items.length)return;
  const menu=document.createElement('div');menu.className='menu-pop';menu.setAttribute('role','menu');menu._btn=btn;
  menu.innerHTML=items.map(([i,t,,p],k)=>`${p&&k>0?'<hr>':''}<button type="button" role="menuitem" data-k="${k}"${p?' class="peligro"':''}>${ic(i,15)} ${esc(t)}</button>`).join('');
  menu.style.visibility='hidden';document.body.append(menu);
  const r=btn.getBoundingClientRect(),w=menu.offsetWidth,h=menu.offsetHeight;
  menu.style.left=Math.min(Math.max(8,r.right-w),innerWidth-w-8)+'px';
  menu.style.top=(r.bottom+4+h>innerHeight-8?Math.max(8,r.top-h-4):r.bottom+4)+'px';
  menu.style.visibility='';
  menu.onclick=e=>{const o=e.target.closest('button[data-k]');if(!o)return;const it=items[+o.dataset.k];cerrarMenuMas();it[2]()};
  menuAbierto=menu;
  const primero=menu.querySelector('button');if(primero)primero.focus();
}
document.addEventListener('click',e=>{if(menuAbierto&&!menuAbierto.contains(e.target)&&!e.target.closest('[data-mas]'))cerrarMenuMas()});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&menuAbierto){e.stopPropagation();cerrarMenuMas()}},true);
addEventListener('scroll',cerrarMenuMas,true);
addEventListener('resize',cerrarMenuMas);
addEventListener('hashchange',cerrarMenuMas);

// ---------- Formularios (ventanita con campos) ----------
const ERRORES_AUTH={
  'auth/email-already-in-use':'Ya existe una cuenta con ese correo.',
  'auth/invalid-email':'Ese correo no es válido.',
  'auth/weak-password':'La contraseña debe tener al menos 6 caracteres.'
};
// editorRoles: la lista de roles de una cuenta, una fila «Nivel + Misión» por espacio (el nivel Administrador y su
// Editor son del espacio general y no llevan misión). varias=true deja añadir y quitar filas (solo el Administrador);
// misionFija = id de misión que se usa siempre (una cuenta de misión crea solo dentro de la suya).
// Devuelve {leer(), validar()}: leer() da [{nivel,misionId}], validar() da un texto de error o null.
function editorRoles(zona,{filas,niveles,varias,misionFija}){
  const norm=id=>!id||id==='sin-mision'?'':id;
  let F=filas.map(f=>({nivel:f.nivel,misionId:esNivelGeneral(f.nivel)?'':norm(f.misionId)}));
  const misiones=listaMisiones();
  const pinta=()=>{
    zona.innerHTML=(varias?'<div style="font-weight:700;margin:4px 0 8px">Roles <span style="color:var(--gris);font-weight:500">(uno por espacio)</span></div>':'')
      +F.map((f,i)=>{
        const gen=esNivelGeneral(f.nivel),huerfana=f.misionId&&!misionPorId(f.misionId);
        return `<div class="rfila" data-i="${i}">
          <label class="fl2">Nivel<select data-rn>${niveles.map(([v,t])=>`<option value="${v}" ${v===f.nivel?'selected':''}>${esc(t)}</option>`).join('')}</select></label>
          ${misionFija?'':`<label class="fl2" ${gen?'hidden':''}>Misión<select data-rm>${f.misionId?'':'<option value="">(elige una misión)</option>'}${huerfana?`<option value="${esc(f.misionId)}" selected>(misión eliminada)</option>`:''}${misiones.map(m=>`<option value="${m.id}" ${m.id===f.misionId?'selected':''}>${esc(etiquetaMision(m))}</option>`).join('')}</select></label>`}
          ${varias&&F.length>1?`<button type="button" class="ic" data-rq="${i}" aria-label="Quitar este rol" title="Quitar este rol">${ic('trs',15)}</button>`:''}
        </div>`}).join('')
      +(varias?`<button type="button" class="sec" data-ra style="margin-bottom:12px">${ic('pls',15)} Añadir rol</button>`:'');
  };
  pinta();
  zona.onchange=e=>{
    const fila=e.target.closest('.rfila');if(!fila)return;const f=F[+fila.dataset.i];
    if(e.target.matches('[data-rn]')){f.nivel=e.target.value;if(esNivelGeneral(f.nivel))f.misionId='';pinta()}
    else if(e.target.matches('[data-rm]'))f.misionId=e.target.value;
  };
  zona.onclick=e=>{
    const b=e.target.closest('button');if(!b)return;
    if(b.dataset.rq!=null){F.splice(+b.dataset.rq,1);pinta()}
    else if(b.dataset.ra!=null){F.push({nivel:(niveles.find(([v])=>v==='usuario')||niveles[0])[0],misionId:''});pinta()}
  };
  const leer=()=>F.map(f=>({nivel:f.nivel,misionId:esNivelGeneral(f.nivel)?null:(misionFija||f.misionId)}));
  const validar=()=>{
    const R=leer(),usados=new Set();
    if(!R.length)return 'La cuenta necesita al menos un rol.';
    for(const r of R){
      if(!niveles.some(([v])=>v===r.nivel))return 'Ese nivel no está permitido para tu cuenta.';
      if(!esNivelGeneral(r.nivel)&&(!r.misionId||r.misionId==='sin-mision'))return 'Elige la misión de cada rol, o crea una misión primero.';
      const esp=esNivelGeneral(r.nivel)?GENERAL:r.misionId;
      if(usados.has(esp))return 'Solo puede tener un rol por espacio (el general o cada misión). Quita el repetido.';
      usados.add(esp);
    }
    return null;
  };
  return {leer,validar};
}

function formNuevo(){
  const actor=sesion(),niveles=rolesCreables();
  if(!niveles.length)return;
  const varias=esAdministrador();                  // solo el Administrador da varios roles a una misma cuenta
  const fija=esNivelAdmin()?null:miMision();       // una cuenta de misión crea siempre dentro de la suya; el Administrador y su Editor eligen
  const o=modal(`<div class="mh"><h2>Nueva cuenta</h2><button class="ic" data-cx aria-label="Cerrar">${ic('x')}</button></div>
    <label class="fl2" style="margin-bottom:12px">Nombre<input id="fn" autocomplete="off"></label>
    <label class="fl2" style="margin-bottom:12px">Correo<input id="fe" type="email" autocomplete="off"></label>
    <label class="fl2" style="margin-bottom:12px">Contraseña (mínimo 6 caracteres)<input id="fc" type="text" autocomplete="off"></label>
    <div id="rl"></div>
    <p class="error" role="alert" hidden></p>
    <div class="barra" style="justify-content:flex-end;margin:6px 0 0"><button class="sec" data-cx>Cancelar</button><button id="ok">Crear</button></div>`);
  const rl=editorRoles($('#rl',o),{filas:[{nivel:niveles[0][0],misionId:fija||''}],niveles,varias,misionFija:fija});
  const err=t=>{const p=$('.error',o);p.textContent=t;p.hidden=!t};
  const aceptar=async()=>{
    const nombre=$('#fn',o).value.trim(),correo=$('#fe',o).value.trim(),clave=$('#fc',o).value;
    if(!correo||!clave)return err('Escribe correo y contraseña.');
    const problema=rl.validar();if(problema)return err(problema);
    const btn=$('#ok',o);btn.disabled=true;
    try{
      const uid=await crearCuentaComoAdmin(correo,clave);
      await guardar('usuarios',uid,{nombre:nombre||correo,correo,...camposDeRoles(rl.leer()),activo:true,creadoPor:actor.id,requiereVerificacion:false,creadoEn:Date.now()});
      o.remove();aviso('Cuenta creada.');
    }catch(ex){
      btn.disabled=false;
      err(ERRORES_AUTH[ex.code]||'No se pudo crear la cuenta. Intenta de nuevo.');
    }
  };
  o.onclick=e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.cx!=null)o.remove();else if(b.id==='ok')aceptar()};
  o.onkeydown=e=>{if(e.key==='Enter'&&e.target.tagName!=='SELECT'){e.preventDefault();aceptar()}};
}

export function formEditar(u){
  if(!u)return;
  const actor=sesion(),propia=u.id===actor.id;
  const roles=rolesDe(u);
  const editaRoles=esNivelAdmin();                              // el Administrador y su Editor cambian niveles y misiones (una cuenta de misión no)
  const varias=esAdministrador();                               // solo el Administrador da o quita roles (varios por cuenta)
  const bloqueado=editaRoles&&!varias&&roles.length>1;          // el Editor del administrador no toca cuentas con varios roles
  const niveles=Object.entries(NIVELES).filter(([v])=>esAdministrador()||v!=='admin');
  const pendiente=u.requiereVerificacion&&!u.emailVerified;
  const o=modal(`<div class="mh"><h2>Editar cuenta</h2><button class="ic" data-cx aria-label="Cerrar">${ic('x')}</button></div>
    <label class="fl2" style="margin-bottom:12px">Nombre<input id="fn" value="${esc(u.nombre||'')}" autocomplete="off"></label>
    <label class="fl2" style="margin-bottom:12px">Correo<input id="fe" value="${esc(u.correo||'')}" disabled></label>
    ${editaRoles&&!bloqueado?'<div id="rl"></div>':''}
    ${bloqueado?`<p style="margin:0 0 12px;color:var(--gris);font-size:13.5px"><b style="color:var(--tx)">Roles:</b> ${esc(descripcionRoles(u))}.<br>Esta cuenta tiene varios roles: solo un Administrador puede cambiarlos.</p>`:''}
    <p style="margin:0 0 12px;color:var(--gris);font-size:13.5px">La contraseña solo la cambia cada cuenta desde el botón «Mi cuenta» de su propia sesión. El correo no se puede cambiar aquí.</p>
    ${pendiente&&!propia?`<label class="chk" style="margin:2px 0 14px"><input type="checkbox" id="fv"> Dejarla entrar sin verificar su correo (si quedó bloqueada y no le llega el correo)</label>`:''}
    ${propia?'':`<label class="chk" style="margin:2px 0 14px"><input type="checkbox" id="fa" ${u.activo===false?'':'checked'}> Cuenta activa (puede iniciar sesión)</label>`}
    <p class="error" role="alert" hidden></p>
    <div class="barra" style="justify-content:flex-end;margin:6px 0 0"><button class="sec" data-cx>Cancelar</button><button id="ok">Guardar</button></div>`);
  const rl=editaRoles&&!bloqueado?editorRoles($('#rl',o),{filas:roles,niveles,varias,misionFija:null}):null;
  const err=t=>{const p=$('.error',o);p.textContent=t;p.hidden=!t};
  const clave=R=>R.map(r=>r.nivel+'@'+(esNivelGeneral(r.nivel)||r.misionId==='sin-mision'?'':(r.misionId||''))).sort().join('|');
  const aceptar=()=>{
    const nombre=$('#fn',o).value.trim();
    const cambios={nombre:nombre||u.correo};
    if(!propia)cambios.activo=$('#fa',o).checked;
    if(rl){
      const problema=rl.validar();if(problema)return err(problema);
      const nuevos=rl.leer();
      if(nuevos.some(r=>r.nivel==='admin')&&!esAdministrador())return err('Solo un Administrador puede crear otro Administrador.');
      if(clave(nuevos)!==clave(roles)){                            // los campos de roles solo se escriben si de verdad cambiaron
        if(roles.some(r=>r.nivel==='admin')&&!nuevos.some(r=>r.nivel==='admin')){
          if(U.filter(esAdminU).length<=1)return err('Debe quedar al menos una cuenta de Administrador.');
          if(!confirm('«'+(u.nombre||u.correo)+'» dejará de ser Administrador. ¿Continuar?'))return;
        }
        Object.assign(cambios,camposDeRoles(nuevos));
      }
    }
    if(pendiente&&!propia&&$('#fv',o).checked)cambios.requiereVerificacion=false;
    guardar('usuarios',u.id,cambios);
    o.remove();aviso('Cambios guardados.');
  };
  o.onclick=e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.cx!=null)o.remove();else if(b.id==='ok')aceptar()};
  o.onkeydown=e=>{if(e.key==='Enter'&&e.target.tagName!=='SELECT'){e.preventDefault();aceptar()}};
}

// ---------- Pantalla de Inicio: bienvenida, Novedades y accesos rápidos ----------
// Cuentas: mismo alcance que la pantalla Usuarios (el Administrador y su Editor ven todo, una Misión
// o su Editor solo su propio equipo). Canciones: las mismas que ya se ven en Canciones (E.canciones de
// estado.js, que respeta la biblioteca general + la privada de la misión).
let elInicio=null;

function tiempoRelativo(ms){
  if(!ms)return '';
  const seg=Math.max(0,(Date.now()-ms)/1000);
  if(seg<90)return 'hace un momento';
  const min=Math.round(seg/60);if(min<60)return `hace ${min} min`;
  const hr=Math.round(min/60);if(hr<24)return `hace ${hr} h`;
  const d=Math.round(hr/24);if(d<30)return `hace ${d} día${d===1?'':'s'}`;
  const mes=Math.round(d/30);if(mes<12)return `hace ${mes} mes${mes===1?'':'es'}`;
  const anio=Math.round(mes/12);return `hace ${anio} año${anio===1?'':'s'}`;
}

// Las novedades de canciones duran 5 días y luego desaparecen solas.
const DIAS_NOVEDAD=5;
// eventoCancion: qué se le muestra a una canción en Novedades y desde cuándo.
//   creadoEn (la crea crear()) · acordesEn (primera vez que se le añaden acordes) · editadoEn (cualquier otro cambio guardado; los pone editor.js)
//   Gana el más reciente: «Editado» > «Acordes añadidos» > «Nueva canción».
function eventoCancion(c){
  const n=c.creadoEn||0,a=c.acordesEn||0,e=c.editadoEn||0;
  if(e&&e>=a&&e>=n)return {texto:'Editado',cuando:e};
  if(a&&a>=n)return {texto:'Acordes añadidos',cuando:a};
  return {texto:'Nueva canción',cuando:n};
}

function novedades(){
  const actor=sesion();if(!actor)return [];
  const cuentas=cuentasVisibles(actor).filter(u=>u.id!==actor.id).map(u=>({
    tipo:'cuenta',
    creadoEn:u.creadoEn||0,
    titulo:u.nombre||u.correo,
    sub:descripcionRoles(u)
  }));
  const limite=Date.now()-DIAS_NOVEDAD*24*60*60*1000;
  const canciones=E.canciones.map(c=>{
    const ev=eventoCancion(c),alb=E.albumes.find(a=>a.id===c.albumId)||{};
    return {
      tipo:'cancion',
      creadoEn:ev.cuando,                                  // (es la fecha del evento: sirve para ordenar y para «hace X»)
      titulo:c.titulo,
      sub:[ev.texto,alb.nombre].filter(Boolean).join(' · '),
      foto:alb.foto||''                                    // la foto del álbum de la canción
    };
  }).filter(x=>x.creadoEn>=limite);
  return [...cuentas,...canciones].sort((a,b)=>b.creadoEn-a.creadoEn).slice(0,6);
}

function pintarInicio(){
  if(!elInicio||!elInicio.isConnected)return;
  const actor=sesion();if(!actor)return;
  const wrap=elInicio.querySelector('.inicio');if(!wrap)return;
  const items=novedades();
  const iconoDe=tipo=>tipo==='cancion'?ic('mus',18):ic('usr',18);
  const filaNovedad=it=>{
    const cuando=tiempoRelativo(it.creadoEn);
    const estiloFoto=it.foto?` style="background:url('${esc(it.foto)}') center/cover no-repeat"`:'';   // con foto de álbum: la foto en lugar del ícono
    return `<div class="ufila"><span class="nic ${it.tipo}"${estiloFoto}>${it.foto?'':iconoDe(it.tipo)}</span><div class="un"><b>${esc(it.titulo)}</b>${it.sub?`<small>${esc(it.sub)}</small>`:''}</div>${cuando?`<span class="cuando">${esc(cuando)}</span>`:''}</div>`;
  };
  wrap.innerHTML=`<div class="bienvenida">
      <div><h1>Hola, ${esc(actor.nombre||actor.correo)}</h1><p>${hoyLargo()}</p></div>
    </div>
    <div class="col2">
      <section class="c2 novedades">
        <div class="nh"><h2>Novedades</h2><small>Lo más reciente</small></div>
        <div class="ulist">${items.map(filaNovedad).join('')||'<p class="vacio">Aún no hay novedades.</p>'}</div>
      </section>
      <aside class="barra-lateral">${tarjetaLiturgica()}</aside>
    </div>`;
}
const inicioOrig=vistas.inicio;
vistas.inicio=contenedor=>{
  inicioOrig(contenedor);
  elInicio=contenedor;
  pintarInicio();
};
addEventListener('hashchange',()=>{const v=location.hash.slice(1)||'inicio';if(v!=='inicio')elInicio=null});
alCambiar(pintarInicio);
alCambiarLiturgia(pintarInicio);   // al cargar las misiones se conoce el país y se pintan sus fiestas

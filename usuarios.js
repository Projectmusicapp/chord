// =====================================================================
//  USUARIOS.JS  ·  Cuentas y permisos (exactamente 3 roles, con ministerios)
//
//  Las cuentas usan Firebase Authentication (correo + contraseña, ver
//  base.js): el id de cada cuenta aquí es el uid que le da Firebase Auth,
//  no un id de Firestore cualquiera. El documento en «usuarios» solo
//  guarda los datos propios de la app (rol, nombre, a qué ministerio
//  pertenece...); la contraseña la maneja Firebase, nunca se guarda aquí.
//
//  Roles:
//   admin ..... control total: biblioteca general, puede ocultar álbumes
//               de la biblioteca general, y crear cuentas de cualquier
//               rol (otros admin, ministerios, usuarios). Todas las
//               cuentas admin tienen el mismo poder (no hay «el admin
//               original» y «sus ayudantes»: son todas iguales).
//   ministerio  un equipo de una MISIÓN (misión y ministerio son lo mismo).
//               Ve la biblioteca general (lo que pone el admin) sin poder
//               editarla. Tiene la biblioteca privada, el calendario, las
//               escalas y los repertorios de SU misión (los comparte con las
//               demás cuentas de esa misión). Puede crear cuentas «ministerio»
//               y «usuario» para su misma misión.
//   usuario ... solo ve (su misión + la biblioteca general). No crea
//               ni edita nada. También puede llegar aquí por autorregistro
//               (ver login.js): esas cuentas quedan con requiereVerificacion
//               = true hasta que confirman su correo.
//
//  Las misiones las crea el Administrador en la pantalla «Misiones» (ver
//  misiones.js). Cada cuenta ministerio/usuario guarda en «ministerioId» el
//  id de su misión, y los datos de cada misión (álbumes propios, calendario,
//  escalas...) se separan con ese mismo campo (ver conAmbito y ambitoActual
//  en base.js). «creadoEn» (fecha en milisegundos) se usa para la sección
//  «Novedades» de Inicio.
//
//  Una cuenta creada por un Administrador o un Ministerio (desde «Nueva
//  cuenta») queda con requiereVerificacion:false: se confía en quien la
//  dio de alta. Solo el autorregistro público exige verificar el correo.
// =====================================================================
import {$,esc,guardar,eliminar,escuchar,vistas,ic,modal,aviso,imagen,sesion,establecerSesion,esNivelAdmin,puedeEditar,configActual,hoyLargo,auth,cambiarMiClave,crearCuentaAuth,crearCuentaComoAdmin,enviarVerificacion} from "./base.js";
import {ventana as abrirRespaldo} from "./respaldo.js";
import {E,alCambiar} from "./estado.js";
import {misionesCargadas,alCambiarMisiones,listaMisiones,misionPorId,etiquetaMision} from "./misiones.js";

const ROLES={admin:'Administrador',ministerio:'Ministerio',usuario:'Usuario (solo ver)'};

const st=document.createElement('style');
st.textContent=`header .menu-usuario{position:relative;margin-left:auto}
header .btn-usuario{background:#ffffff14;color:#DDE3F5;min-height:36px;padding:6px 12px;font-size:14px;flex:none;display:inline-flex;align-items:center;gap:6px;max-width:160px}
header .btn-usuario span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
header .btn-usuario:hover{background:#ffffff26;filter:none}
header .dd-usuario{position:absolute;right:0;top:100%;margin-top:6px;z-index:12;background:var(--blanco);border:1px solid var(--linea);border-radius:14px;box-shadow:var(--sombra-2);padding:8px;min-width:200px;display:grid;gap:2px}
header .dd-usuario .nombre{padding:8px 10px 10px;font-weight:700;color:var(--tx);border-bottom:1px solid var(--linea);margin-bottom:4px}
header .dd-usuario button{background:transparent;color:var(--tx);justify-content:flex-start;text-align:left;min-height:38px}
header .dd-usuario button:hover{background:var(--capa);filter:none}
@media(max-width:480px){header .btn-usuario{max-width:40px;padding:0;justify-content:center}header .btn-usuario span{display:none}}
.inicio{display:flex;flex-direction:column;gap:24px}
.bienvenida{background:linear-gradient(135deg,var(--azul),var(--azul-2));border-radius:var(--r-xl);padding:28px 32px;display:flex;align-items:center;justify-content:space-between;gap:20px;flex-wrap:wrap;box-shadow:var(--sombra-2)}
.bienvenida h1{color:#fff;margin:0}
.bienvenida p{color:#C9D1EC;margin:8px 0 0;font-size:15px}
.bienvenida .chip{background:var(--oro);color:var(--azul);font-weight:800;font-size:13px;padding:7px 16px;border-radius:999px;white-space:nowrap}
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
.novedades .nic.cuenta{background:var(--capa);color:var(--azul)}
.novedades .nic.cancion{background:var(--oro-claro);color:var(--oro-texto)}
.novedades .un{flex:1;min-width:0}
.novedades .un b{display:block}
.novedades .un small{display:block;color:var(--gris);font-weight:500;margin-top:2px}
.novedades .cuando{color:var(--gris);font-size:12.5px;font-weight:600;white-space:nowrap;padding-top:2px}
.espacio .eh{display:flex;align-items:center;gap:10px;margin-bottom:6px;color:var(--oro-texto)}
.espacio .eh h3{color:var(--tx);margin:0;font-size:15px}
.espacio p{margin:0;color:var(--gris);font-size:13.5px;font-weight:600;line-height:1.5}
@media(max-width:760px){.bienvenida{padding:22px}}
[data-vista=usuarios] .config{background:var(--capa);border-radius:var(--r-m);padding:14px;margin-bottom:18px;display:flex;flex-direction:column;gap:10px}
[data-vista=usuarios] .config .mb2{margin:0}
[data-vista=usuarios] .ulist{display:grid;gap:8px;margin-top:14px}
[data-vista=usuarios] .ufila{display:flex;align-items:center;gap:12px;background:var(--capa);border-radius:var(--r-m);padding:10px 12px;flex-wrap:wrap}
[data-vista=usuarios] .ufila .un{flex:1;min-width:160px}
[data-vista=usuarios] .ufila b{display:block}
[data-vista=usuarios] .ufila small{display:block;color:var(--gris);font-weight:500}
[data-vista=usuarios] .rolchip{display:inline-block;background:var(--suave);color:var(--azul);border-radius:999px;padding:2px 10px;font-size:12.5px;font-weight:700}
[data-vista=usuarios] .ufila.inactiva{opacity:.55}
[data-vista=usuarios] .mb2{display:flex;gap:6px;flex-wrap:wrap}`;
document.head.append(st);

let U=[],listo=false,el=null;
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
alCambiarMisiones(()=>{if(el)pintar();pintarInicio()});   // si cambian las misiones, se vuelven a dibujar los nombres

// ---------- A qué misión pertenecen las cuentas ----------
// miMision: la misión de esta cuenta (su «ministerioId»). El Administrador no tiene (null: trabaja en el espacio general).
const miMision=u=>u.rol==='admin'?null:(u.ministerioId||null);
const esMinisterioTier=u=>u.rol==='ministerio';
// misionesDisponibles: para el selector de misión del autorregistro (ver login.js). Ya vienen ordenadas por país.
export function misionesDisponibles(){
  return listaMisiones().map(m=>({id:m.id,nombre:m.nombre,pais:m.pais||''}));
}
// misionDe: el texto de la misión de una cuenta, para mostrarlo en pantalla.
function misionDe(u){
  if(u.rol==='admin')return '';
  if(!u.ministerioId)return 'Sin misión';
  const m=misionPorId(u.ministerioId);
  return m?etiquetaMision(m):'(misión eliminada)';
}

// ---------- Primera cuenta / autorregistro (los llama login.js) ----------
export async function crearPrimerAdmin(nombre,correo,clave){
  const cred=await crearCuentaAuth(correo,clave);
  await guardar('usuarios',cred.user.uid,{nombre:nombre||correo,correo,rol:'admin',ministerioId:null,activo:true,creadoPor:null,requiereVerificacion:false,creadoEn:Date.now()});
  return cred.user;
}
export async function autorregistrar(nombre,correo,clave,ministerioId){
  const cred=await crearCuentaAuth(correo,clave);
  await enviarVerificacion(cred.user);
  await guardar('usuarios',cred.user.uid,{nombre:nombre||correo,correo,rol:'usuario',ministerioId,activo:true,creadoPor:null,requiereVerificacion:true,creadoEn:Date.now()});
  return cred.user;
}

function rolesCreables(actor){
  if(esNivelAdmin())return [['admin','Administrador (como tú)'],['ministerio','Ministerio'],['usuario','Usuario (solo ver)']];
  if(esMinisterioTier(actor))return [['ministerio','Ministerio (de tu misión)'],['usuario','Usuario (solo ver)']];
  return [];
}
function cuentasVisibles(actor){
  if(esNivelAdmin())return U;
  const mision=miMision(actor);
  return mision?U.filter(u=>u.ministerioId===mision):[];
}
function puedeGestionar(u,actor){
  if(u.id===actor.id)return false;              // su propia cuenta no se gestiona desde aquí
  if(esNivelAdmin())return true;
  const mision=miMision(actor);
  return esMinisterioTier(actor)&&!!mision&&u.ministerioId===mision;
}

// ---------- Menú de usuario en la cabecera: nombre, Mi cuenta, Configuración y Salir ----------
// (no van en la barra de navegación: son acciones de la cuenta, no secciones de contenido)
export function montarMenuUsuario(salir){
  const actor=sesion();
  const header=document.querySelector('header');
  if(!header||!actor||header.querySelector('.menu-usuario'))return;
  const cont=document.createElement('div');
  cont.className='menu-usuario';
  cont.innerHTML=`<button class="btn-usuario" aria-haspopup="true" aria-expanded="false"><span>${esc(actor.nombre||actor.correo)}</span> &#9662;</button>
    <div class="dd-usuario" hidden>
      <div class="nombre">${esc(actor.nombre||actor.correo)}</div>
      <button data-mc>${ic('usr',15)} Mi cuenta</button>
      ${puedeEditar()?`<button data-cfg>${ic('cfg',15)} Configuración</button>`:''}
      ${esNivelAdmin()?`<button data-mis>${ic('pin',15)} Misiones</button>`:''}
      <button data-sal>${ic('out',15)} Salir</button>
    </div>`;
  const boton=cont.querySelector('.btn-usuario'),dd=cont.querySelector('.dd-usuario');
  const cerrar=()=>{dd.hidden=true;boton.setAttribute('aria-expanded','false')};
  boton.onclick=()=>{const abrir=dd.hidden;dd.hidden=!abrir;boton.setAttribute('aria-expanded',String(abrir))};
  document.addEventListener('click',e=>{if(!dd.hidden&&!cont.contains(e.target))cerrar()});
  cont.querySelector('[data-mc]').onclick=()=>{cerrar();location.hash='cuenta'};
  const cfgBtn=cont.querySelector('[data-cfg]');if(cfgBtn)cfgBtn.onclick=()=>{cerrar();location.hash='usuarios'};
  const misBtn=cont.querySelector('[data-mis]');if(misBtn)misBtn.onclick=()=>{cerrar();location.hash='misiones'};
  cont.querySelector('[data-sal]').onclick=()=>{cerrar();salir()};
  header.append(cont);
}

// ---------- Pantalla «Mi cuenta» (cualquier rol): datos propios y contraseña ----------
vistas.cuenta=contenedor=>{
  const actor=sesion();if(!actor)return;
  const mision=misionDe(actor);
  contenedor.innerHTML=`<div class="ch2"><h1>Mi cuenta</h1></div>
    ${mision?`<p style="color:var(--gris)">Misión a la que perteneces: <b>${esc(mision)}</b></p>`:''}
    <label class="fl2" style="margin-bottom:12px">Nombre<input id="fn" value="${esc(actor.nombre||'')}" autocomplete="off"></label>
    <label class="fl2" style="margin-bottom:12px">Correo<input id="fe" value="${esc(actor.correo||'')}" disabled></label>
    <label class="fl2" style="margin-bottom:12px">Nueva contraseña (vacío = no cambiar)<input id="fc1" type="password" autocomplete="new-password"></label>
    <label class="fl2" style="margin-bottom:12px">Repetir contraseña<input id="fc2" type="password" autocomplete="new-password"></label>
    <p class="error" role="alert" hidden></p>
    <button id="ok">Guardar</button>`;
  const err=t=>{const p=$('.error',contenedor);p.textContent=t;p.hidden=!t};
  contenedor.onclick=async e=>{
    if(!e.target.closest('#ok'))return;
    const nombre=$('#fn',contenedor).value.trim(),c1=$('#fc1',contenedor).value,c2=$('#fc2',contenedor).value;
    if(c1&&c1!==c2)return err('Las contraseñas no coinciden.');
    if(c1&&c1.length<6)return err('La contraseña debe tener al menos 6 caracteres.');
    if(c1){
      try{await cambiarMiClave(auth.currentUser,c1)}
      catch(e2){return err(e2.code==='auth/requires-recent-login'?'Por seguridad, cierra sesión y vuelve a entrar antes de cambiar la contraseña.':'No se pudo cambiar la contraseña.')}
    }
    const cambios={nombre:nombre||actor.correo};
    guardar('usuarios',actor.id,cambios);
    establecerSesion({...actor,...cambios});
    document.querySelectorAll('.menu-usuario .btn-usuario span,.menu-usuario .dd-usuario .nombre').forEach(elx=>elx.textContent=cambios.nombre);
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
  if(!el)return;
  const actor=sesion();if(!actor)return;
  const lista=cuentasVisibles(actor).slice().sort((a,b)=>(a.nombre||a.correo).localeCompare(b.nombre||b.correo,'es'));
  const admin=esNivelAdmin(),cfg=configActual();
  const config=admin?`<div class="config"><h2 style="margin:0">Administración</h2>
      <div class="mb2"><button id="bl">${ic('img',16)} Cambiar logo</button>${cfg.logo?`<button class="sec" id="bq">${ic('x',16)} Quitar logo</button>`:''}<button id="bn">${ic('edt',16)} Cambiar nombre</button><button class="sec" id="br">${ic('cfg',16)} Copia de seguridad</button><input type="file" id="fl" accept="image/*" hidden></div>
    </div>`:'';
  el.innerHTML=`<div class="ch2"><h1>Usuarios</h1><button data-nu>${ic('pls',16)} Nueva cuenta</button></div>
    ${config}
    <div class="ulist">${lista.map(u=>fila(u,actor)).join('')||'<p class="vacio">Aún no hay cuentas aquí.</p>'}</div>`;
  el.onclick=clic;
  if(admin){
    const bl=$('#bl',el);if(bl)bl.onclick=()=>$('#fl',el).click();
    const fl=$('#fl',el);if(fl)fl.onchange=async e=>guardar('config','app',{logo:await imagen(e.target.files[0],200)});
    const bq=$('#bq',el);if(bq)bq.onclick=()=>{if(confirm('¿Quitar el logo y volver al icono por defecto?'))guardar('config','app',{logo:''})};
    const bn=$('#bn',el);if(bn)bn.onclick=()=>{const n=prompt('Nombre de la app',cfg.nombre);if(n)guardar('config','app',{nombre:n})};
    const br=$('#br',el);if(br)br.onclick=abrirRespaldo;
  }
}

function fila(u,actor){
  const gestiona=puedeGestionar(u,actor);
  const tuya=u.id===actor.id;
  const pendiente=u.requiereVerificacion&&!u.emailVerified&&u.id!==actor.id;
  const sub=[ROLES[u.rol]||u.rol,misionDe(u)].filter(Boolean).join(' · ');
  return `<div class="ufila${u.activo===false?' inactiva':''}">
    <div class="un"><b>${esc(u.nombre||u.correo)}${tuya?' (tú)':''}</b><small>${esc(u.correo||'')}${u.activo===false?' · Desactivada':''}</small></div>
    <span class="rolchip">${esc(sub)}</span>
    ${gestiona?`<div class="mb2"><button class="sec" data-ed="${u.id}">${ic('edt',15)} Editar</button><button class="ic rj" data-el="${u.id}" aria-label="Eliminar a ${esc(u.nombre||u.correo)}" title="Eliminar">${ic('trs',16)}</button></div>`:''}
  </div>`;
}

function clic(e){
  const b=e.target.closest('button');if(!b)return;const d=b.dataset;
  if(d.nu!=null)formNuevo();
  else if(d.ed)formEditar(U.find(x=>x.id===d.ed));
  else if(d.el){
    const u=U.find(x=>x.id===d.el);if(!u)return;
    if(u.rol==='admin'&&U.filter(x=>x.rol==='admin').length<=1)return alert('Debe quedar al menos una cuenta de Administrador.');
    if(confirm('¿Eliminar la cuenta "'+(u.nombre||u.correo)+'"? Dejará de verse en la app, pero su acceso de inicio de sesión no queda totalmente revocado (eso requiere la consola de Firebase). Para solo quitarle el acceso, mejor desactívala desde «Editar».')){
      eliminar('usuarios',u,'la cuenta "'+(u.nombre||u.correo)+'"',true);
    }
  }
}

// ---------- Formularios (ventanita con campos) ----------
const ERRORES_AUTH={
  'auth/email-already-in-use':'Ya existe una cuenta con ese correo.',
  'auth/invalid-email':'Ese correo no es válido.',
  'auth/weak-password':'La contraseña debe tener al menos 6 caracteres.'
};
function formNuevo(){
  const actor=sesion(),roles=rolesCreables(actor);
  if(!roles.length)return;
  const elegirMision=esNivelAdmin();                // el admin elige la misión; un ministerio crea siempre dentro de la suya
  const misiones=listaMisiones();
  const o=modal(`<div class="mh"><h2>Nueva cuenta</h2><button class="ic" data-cx aria-label="Cerrar">${ic('x')}</button></div>
    <label class="fl2" style="margin-bottom:12px">Nombre<input id="fn" autocomplete="off"></label>
    <label class="fl2" style="margin-bottom:12px">Correo<input id="fe" type="email" autocomplete="off"></label>
    <label class="fl2" style="margin-bottom:12px">Contraseña (mínimo 6 caracteres)<input id="fc" type="text" autocomplete="off"></label>
    <label class="fl2" style="margin-bottom:12px">Nivel<select id="fr">${roles.map(([v,t])=>`<option value="${v}">${esc(t)}</option>`).join('')}</select></label>
    ${elegirMision?`<label class="fl2" id="fmw" style="margin-bottom:12px">Misión<select id="fm">${misiones.map(m=>`<option value="${m.id}">${esc(etiquetaMision(m))}</option>`).join('')||'<option value="">(crea primero una misión)</option>'}</select></label>`:''}
    <p class="error" role="alert" hidden></p>
    <div class="barra" style="justify-content:flex-end;margin:6px 0 0"><button class="sec" data-cx>Cancelar</button><button id="ok">Crear</button></div>`);
  const actualizaCampos=()=>{
    const wm=$('#fmw',o);if(wm)wm.hidden=$('#fr',o).value==='admin';   // un Administrador no pertenece a ninguna misión
  };
  actualizaCampos();
  $('#fr',o).onchange=actualizaCampos;
  const err=t=>{const p=$('.error',o);p.textContent=t;p.hidden=!t};
  const aceptar=async()=>{
    const nombre=$('#fn',o).value.trim(),correo=$('#fe',o).value.trim(),clave=$('#fc',o).value,rol=$('#fr',o).value;
    if(!correo||!clave)return err('Escribe correo y contraseña.');
    let ministerioId=null;                          // ministerioId = el id de la misión (null para un Administrador)
    if(rol!=='admin'){
      ministerioId=elegirMision?($('#fm',o).value||''):miMision(actor);
      if(!ministerioId)return err('Elige la misión a la que pertenece, o crea una misión primero.');
    }
    const btn=$('#ok',o);btn.disabled=true;
    try{
      const uid=await crearCuentaComoAdmin(correo,clave);
      await guardar('usuarios',uid,{nombre:nombre||correo,correo,rol,ministerioId,activo:true,creadoPor:actor.id,requiereVerificacion:false,creadoEn:Date.now()});
      o.remove();aviso('Cuenta creada.');
    }catch(ex){
      btn.disabled=false;
      err(ERRORES_AUTH[ex.code]||'No se pudo crear la cuenta. Intenta de nuevo.');
    }
  };
  o.onclick=e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.cx!=null)o.remove();else if(b.id==='ok')aceptar()};
  o.onkeydown=e=>{if(e.key==='Enter'&&e.target.tagName!=='SELECT'){e.preventDefault();aceptar()}};
}

function formEditar(u){
  if(!u)return;
  const cambiaMision=esNivelAdmin()&&u.rol!=='admin';           // solo el admin pasa una cuenta a otra misión
  const sinMision=!u.ministerioId||!misionPorId(u.ministerioId);
  const o=modal(`<div class="mh"><h2>Editar cuenta</h2><button class="ic" data-cx aria-label="Cerrar">${ic('x')}</button></div>
    <label class="fl2" style="margin-bottom:12px">Nombre<input id="fn" value="${esc(u.nombre||'')}" autocomplete="off"></label>
    <label class="fl2" style="margin-bottom:12px">Correo<input id="fe" value="${esc(u.correo||'')}" disabled></label>
    ${cambiaMision?`<label class="fl2" style="margin-bottom:12px">Misión<select id="fm">${sinMision?'<option value="">(elige una misión)</option>':''}${listaMisiones().map(m=>`<option value="${m.id}" ${m.id===u.ministerioId?'selected':''}>${esc(etiquetaMision(m))}</option>`).join('')}</select></label>`:''}
    <p style="margin:0 0 12px;color:var(--gris);font-size:13.5px">La contraseña solo la cambia cada cuenta desde el botón «Mi cuenta» de su propia sesión. El correo no se puede cambiar aquí.</p>
    <label class="chk" style="margin:2px 0 14px"><input type="checkbox" id="fa" ${u.activo===false?'':'checked'}> Cuenta activa (puede iniciar sesión)</label>
    <p class="error" role="alert" hidden></p>
    <div class="barra" style="justify-content:flex-end;margin:6px 0 0"><button class="sec" data-cx>Cancelar</button><button id="ok">Guardar</button></div>`);
  const err=t=>{const p=$('.error',o);p.textContent=t;p.hidden=!t};
  const aceptar=()=>{
    const nombre=$('#fn',o).value.trim(),activo=$('#fa',o).checked;
    const cambios={nombre:nombre||u.correo,activo};
    if(cambiaMision){const v=$('#fm',o).value;if(v)cambios.ministerioId=v}
    guardar('usuarios',u.id,cambios);
    o.remove();aviso('Cambios guardados.');
  };
  o.onclick=e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.cx!=null)o.remove();else if(b.id==='ok')aceptar()};
  o.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();aceptar()}};
}

// ---------- Pantalla de Inicio: bienvenida, Novedades y accesos rápidos ----------
// Cuentas: mismo alcance que la pantalla Usuarios (el Administrador ve todo, un Ministerio
// solo su propio equipo). Canciones: las mismas que ya se ven en Canciones (E.canciones de
// estado.js, que respeta la biblioteca general + la privada del ministerio).
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

// contextoInicio: qué mostrar en el chip de bienvenida y en la tarjeta «Tu misión»/«Espacio».
function contextoInicio(actor){
  if(actor.rol==='admin')return{
    chip:'Administrador · Espacio General',
    espacioTitulo:'Espacio',
    espacioSub:'General. Desde el menú de tu cuenta puedes gestionar las cuentas, las misiones y la configuración.'
  };
  const m=misionPorId(actor.ministerioId);
  const nombreM=m?m.nombre:(actor.ministerioId?'(misión eliminada)':'Sin misión');
  const paisM=m&&m.pais?' · '+m.pais:'';
  return{chip:(ROLES[actor.rol]||actor.rol)+paisM,espacioTitulo:'Tu misión',espacioSub:nombreM+paisM};
}

function novedades(){
  const actor=sesion();if(!actor)return [];
  const cuentas=cuentasVisibles(actor).filter(u=>u.id!==actor.id).map(u=>({
    tipo:'cuenta',
    creadoEn:u.creadoEn||0,
    titulo:u.nombre||u.correo,
    sub:[ROLES[u.rol]||u.rol,misionDe(u)].filter(Boolean).join(' · ')
  }));
  const canciones=E.canciones.map(c=>({
    tipo:'cancion',
    creadoEn:c.creadoEn||0,
    titulo:c.titulo,
    sub:['Canción',(E.albumes.find(a=>a.id===c.albumId)||{}).nombre].filter(Boolean).join(' · ')
  }));
  return [...cuentas,...canciones].sort((a,b)=>b.creadoEn-a.creadoEn).slice(0,6);
}

function pintarInicio(){
  if(!elInicio||!elInicio.isConnected)return;
  const actor=sesion();if(!actor)return;
  const wrap=elInicio.querySelector('.inicio');if(!wrap)return;
  const ctx=contextoInicio(actor);
  const items=novedades();
  const iconoDe=tipo=>tipo==='cancion'?ic('mus',18):ic('usr',18);
  const filaNovedad=it=>{
    const cuando=tiempoRelativo(it.creadoEn);
    return `<div class="ufila"><span class="nic ${it.tipo}">${iconoDe(it.tipo)}</span><div class="un"><b>${esc(it.titulo)}</b>${it.sub?`<small>${esc(it.sub)}</small>`:''}</div>${cuando?`<span class="cuando">${esc(cuando)}</span>`:''}</div>`;
  };
  wrap.innerHTML=`<div class="bienvenida">
      <div><h1>Hola, ${esc(actor.nombre||actor.correo)}</h1><p>${hoyLargo()}</p></div>
      <span class="chip">${esc(ctx.chip)}</span>
    </div>
    <div class="col2">
      <section class="c2 novedades">
        <div class="nh"><h2>Novedades</h2><small>Lo más reciente</small></div>
        <div class="ulist">${items.map(filaNovedad).join('')||'<p class="vacio">Aún no hay novedades.</p>'}</div>
      </section>
      <aside class="barra-lateral">
        <div class="c2 espacio"><div class="eh">${ic('pin',16)}<h3>${esc(ctx.espacioTitulo)}</h3></div><p>${esc(ctx.espacioSub)}</p></div>
      </aside>
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

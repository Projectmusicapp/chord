// =====================================================================
//  USUARIOS.JS  ·  Cuentas y permisos (3 niveles, con ministerios)
//
//  Niveles:
//   admin ............... control total. Puede crear Editores (con sus
//                          mismos permisos), crear Ministerios, y ocultar
//                          álbumes de la biblioteca general.
//   editor .............. mismos permisos que admin (lo designa un admin).
//   ministerio .......... un equipo/misión. Ve la biblioteca general (lo
//                          que pone el admin) pero no la edita. Tiene su
//                          propia biblioteca privada, calendario y escalas,
//                          separados de los demás ministerios. Puede crear
//                          sus propios «editorMinisterio» y «usuario».
//   editorMinisterio .... mismos permisos que su ministerio, dentro de ese
//                          mismo ministerio (lo designa ese ministerio).
//   usuario ............. solo ve (de su ministerio + la biblioteca
//                          general). No crea ni edita nada.
//
//  Los datos de cada ministerio (álbumes propios, calendario, escalas...)
//  se separan con el campo «ministerioId» (ver conAmbito en base.js).
//  Un admin/editor puede «entrar» al espacio de un ministerio con el
//  selector de la cabecera (montarSelectorAmbito) para revisarlo o
//  ayudarle, y volver a «General» cuando quiera.
//
//  OJO: igual que el login anterior, esto no protege los datos en Firebase
//  directamente: solo la propia app respeta estos permisos. Las claves se
//  guardan tal cual, sin cifrar.
// =====================================================================
import {$,esc,guardar,crear,eliminar,escuchar,vistas,ic,modal,aviso,sesion,establecerSesion,esNivelAdmin,puedeEditar,ambitoActual,cambiarAmbito} from "./base.js";

const ROLES={admin:'Administrador',editor:'Editor',ministerio:'Ministerio',editorMinisterio:'Editor de ministerio',usuario:'Usuario (solo ver)'};

const st=document.createElement('style');
st.textContent=`header .sel-ambito{margin-left:auto;margin-right:10px;max-width:160px;min-height:36px;background:#ffffff14;color:#fff;border-color:transparent}
header .btn-clave{margin-left:auto;margin-right:8px;background:#ffffff14;color:#DDE3F5;min-height:36px;padding:6px 12px;font-size:14px;flex:none;display:inline-flex;align-items:center;gap:6px}
header .btn-clave:hover{background:#ffffff26;filter:none}
@media(max-width:480px){header .btn-clave span{display:none}header .btn-clave{width:40px;padding:0;justify-content:center}}
[data-vista=usuarios] .ulist{display:grid;gap:8px;margin-top:14px}
[data-vista=usuarios] .ufila{display:flex;align-items:center;gap:12px;background:var(--capa);border-radius:var(--r-m);padding:10px 12px;flex-wrap:wrap}
[data-vista=usuarios] .ufila .un{flex:1;min-width:160px}
[data-vista=usuarios] .ufila b{display:block}
[data-vista=usuarios] .ufila small{display:block;color:var(--gris);font-weight:500}
[data-vista=usuarios] .rolchip{display:inline-block;background:var(--suave);color:var(--azul);border-radius:999px;padding:2px 10px;font-size:12.5px;font-weight:700}
[data-vista=usuarios] .ufila.inactiva{opacity:.55}
[data-vista=usuarios] .mb2{display:flex;gap:6px;flex-wrap:wrap}`;
document.head.append(st);

let U=[],listo=false,elSelect=null,el=null;
const esperando=[];
export const cargado=()=>listo?Promise.resolve():new Promise(r=>esperando.push(r));

escuchar('usuarios',l=>{
  U=l;
  if(!l.length){
    // Primera vez que se usa la app: no hay ninguna cuenta. Se crea el admin inicial.
    crear('usuarios',{usuario:'admin',clave:'admin',nombre:'Administrador',rol:'admin',ministerioId:null,activo:true,creadoPor:null});
    return;   // se espera el siguiente aviso de Firebase, ya con esta cuenta creada
  }
  if(!listo){listo=true;esperando.forEach(r=>r());esperando.length=0}
  pintaSelector();
  if(el)pintar();
});

export function intentarLogin(usuario,clave){
  const u=U.find(x=>(x.usuario||'').trim().toLowerCase()===usuario.trim().toLowerCase()&&x.clave===clave&&x.activo!==false);
  return u?{...u}:null;
}
export function usuarioPorId(id){
  const u=U.find(x=>x.id===id);
  return u&&u.activo!==false?{...u}:null;
}

// ---------- A qué ministerio pertenecen las cuentas que crea/gestiona cada rol ----------
const miMinisterio=u=>u.rol==='ministerio'?u.id:(u.ministerioId||null);
const esMinisterioTier=u=>u.rol==='ministerio'||u.rol==='editorMinisterio';

function rolesCreables(actor){
  if(esNivelAdmin())return [['editor','Editor (como Administrador)'],['ministerio','Ministerio (equipo nuevo)'],['editorMinisterio','Editor de un ministerio'],['usuario','Usuario (solo ver)']];
  if(esMinisterioTier(actor))return [['editorMinisterio','Editor de tu ministerio'],['usuario','Usuario (solo ver)']];
  return [];
}
function cuentasVisibles(actor){
  if(esNivelAdmin())return U;
  const amb=miMinisterio(actor);
  return U.filter(u=>(u.ministerioId||null)===amb);
}
function puedeGestionar(u,actor){
  if(u.id===actor.id)return false;              // su propia cuenta no se gestiona desde aquí
  if(esNivelAdmin())return true;
  return esMinisterioTier(actor)&&(u.ministerioId||null)===miMinisterio(actor)&&u.rol!=='ministerio';
}

// ---------- Selector de espacio de trabajo (solo Administrador/Editor), en la cabecera ----------
function pintaSelector(){
  if(!elSelect)return;
  const amb=ambitoActual()||'';
  elSelect.innerHTML=`<option value="">General</option>`+U.filter(u=>u.rol==='ministerio').map(m=>`<option value="${m.id}">${esc(m.nombre||m.usuario)}</option>`).join('');
  elSelect.value=amb;
}
export function montarSelectorAmbito(){
  if(!esNivelAdmin())return;
  const header=document.querySelector('header');
  if(!header||elSelect)return;
  elSelect=document.createElement('select');
  elSelect.className='sel-ambito';
  elSelect.title='Espacio de trabajo';
  elSelect.setAttribute('aria-label','Espacio de trabajo');
  elSelect.onchange=()=>cambiarAmbito(elSelect.value||null);
  pintaSelector();
  const salir=header.querySelector('.salir');
  if(salir)header.insertBefore(elSelect,salir);else header.append(elSelect);
}

// ---------- Cambiar mi contraseña (cualquier cuenta, incluido el rol «usuario») ----------
export function montarCambiarClave(){
  const header=document.querySelector('header');
  if(!header||!sesion()||header.querySelector('.btn-clave'))return;
  const b=document.createElement('button');
  b.className='btn-clave';
  b.title='Cambiar mi contraseña';
  b.setAttribute('aria-label','Cambiar mi contraseña');
  b.innerHTML=ic('edt',16)+'<span>Contraseña</span>';
  b.onclick=formMiClave;
  const salir=header.querySelector('.salir');
  if(salir)header.insertBefore(b,salir);else header.append(b);
}
function formMiClave(){
  const actor=sesion();if(!actor)return;
  const o=modal(`<div class="mh"><h2>Cambiar mi contraseña</h2><button class="ic" data-cx aria-label="Cerrar">${ic('x')}</button></div>
    <p style="margin-top:0;color:var(--gris)">Cuenta: <b>${esc(actor.usuario)}</b></p>
    <label class="fl2" style="margin-bottom:12px">Nueva contraseña<input id="fc1" type="password" autocomplete="new-password"></label>
    <label class="fl2" style="margin-bottom:12px">Repetir contraseña<input id="fc2" type="password" autocomplete="new-password"></label>
    <p class="error" role="alert" hidden></p>
    <div class="barra" style="justify-content:flex-end;margin:6px 0 0"><button class="sec" data-cx>Cancelar</button><button id="ok">Guardar</button></div>`);
  const err=t=>{const p=$('.error',o);p.textContent=t;p.hidden=!t};
  const aceptar=()=>{
    const c1=$('#fc1',o).value,c2=$('#fc2',o).value;
    if(!c1)return err('Escribe una contraseña.');
    if(c1!==c2)return err('Las contraseñas no coinciden.');
    guardar('usuarios',actor.id,{clave:c1});
    o.remove();aviso('Contraseña actualizada.');
  };
  o.onclick=e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.cx!=null)o.remove();else if(b.id==='ok')aceptar()};
  o.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();aceptar()}};
}

// ---------- Pantalla «Usuarios» ----------
vistas.usuarios=contenedor=>{
  el=contenedor;
  if(!puedeEditar()){el.innerHTML='<p class="vacio">No tienes acceso a esta pantalla.</p>';return}
  pintar();
};
addEventListener('hashchange',()=>{if(location.hash!=='#usuarios')el=null});

function etiquetaMinisterio(u){
  if(!u.ministerioId)return '';
  const m=U.find(x=>x.id===u.ministerioId);
  return m?(m.nombre||m.usuario):'(ministerio eliminado)';
}

function pintar(){
  if(!el)return;
  const actor=sesion();if(!actor)return;
  const lista=cuentasVisibles(actor).slice().sort((a,b)=>(a.nombre||a.usuario).localeCompare(b.nombre||b.usuario,'es'));
  el.innerHTML=`<div class="ch2"><h1>Usuarios</h1><button id="nu">${ic('pls',16)} Nueva cuenta</button></div>
    <div class="ulist">${lista.map(u=>fila(u,actor)).join('')||'<p class="vacio">Aún no hay cuentas aquí.</p>'}</div>`;
  el.onclick=clic;
}

function fila(u,actor){
  const gestiona=puedeGestionar(u,actor);
  const tuya=u.id===actor.id;
  const sub=[ROLES[u.rol]||u.rol,etiquetaMinisterio(u)].filter(Boolean).join(' · ');
  return `<div class="ufila${u.activo===false?' inactiva':''}">
    <div class="un"><b>${esc(u.nombre||u.usuario)}${tuya?' (tú)':''}</b><small>Usuario: ${esc(u.usuario)}${u.activo===false?' · Desactivada':''}</small></div>
    <span class="rolchip">${esc(sub)}</span>
    ${gestiona?`<div class="mb2"><button class="sec" data-ed="${u.id}">${ic('edt',15)} Editar</button><button class="ic rj" data-el="${u.id}" aria-label="Eliminar a ${esc(u.nombre||u.usuario)}" title="Eliminar">${ic('trs',16)}</button></div>`:''}
  </div>`;
}

function clic(e){
  const b=e.target.closest('button');if(!b)return;const d=b.dataset;
  if(d.nu!=null)formNuevo();
  else if(d.ed)formEditar(U.find(x=>x.id===d.ed));
  else if(d.el){
    const u=U.find(x=>x.id===d.el);if(!u)return;
    if((u.rol==='admin'||u.rol==='editor')&&U.filter(x=>x.rol==='admin'||x.rol==='editor').length<=1)return alert('Debe quedar al menos una cuenta de Administrador o Editor.');
    eliminar('usuarios',u,'la cuenta "'+(u.nombre||u.usuario)+'"');
  }
}

// ---------- Formularios (ventanita con campos) ----------
function formNuevo(){
  const actor=sesion(),roles=rolesCreables(actor);
  if(!roles.length)return;
  const necesitaMinisterio=esNivelAdmin();
  const ministerios=U.filter(u=>u.rol==='ministerio');
  const o=modal(`<div class="mh"><h2>Nueva cuenta</h2><button class="ic" data-cx aria-label="Cerrar">${ic('x')}</button></div>
    <label class="fl2" style="margin-bottom:12px">Nombre<input id="fn" autocomplete="off"></label>
    <label class="fl2" style="margin-bottom:12px">Usuario (para iniciar sesión)<input id="fu" autocomplete="off"></label>
    <label class="fl2" style="margin-bottom:12px">Contraseña<input id="fc" type="text" autocomplete="off"></label>
    <label class="fl2" style="margin-bottom:12px">Nivel<select id="fr">${roles.map(([v,t])=>`<option value="${v}">${esc(t)}</option>`).join('')}</select></label>
    ${necesitaMinisterio?`<label class="fl2" id="fmw" style="margin-bottom:12px">Ministerio<select id="fm">${ministerios.map(m=>`<option value="${m.id}">${esc(m.nombre||m.usuario)}</option>`).join('')||'<option value="">(crea primero un ministerio)</option>'}</select></label>`:''}
    <p class="error" role="alert" hidden></p>
    <div class="barra" style="justify-content:flex-end;margin:6px 0 0"><button class="sec" data-cx>Cancelar</button><button id="ok">Crear</button></div>`);
  const actualizaMinisterio=()=>{const w=$('#fmw',o);if(w)w.hidden=!['editorMinisterio','usuario'].includes($('#fr',o).value)};
  if(necesitaMinisterio){actualizaMinisterio();$('#fr',o).onchange=actualizaMinisterio}
  const err=t=>{const p=$('.error',o);p.textContent=t;p.hidden=!t};
  const aceptar=()=>{
    const nombre=$('#fn',o).value.trim(),usuario=$('#fu',o).value.trim(),clave=$('#fc',o).value,rol=$('#fr',o).value;
    if(!usuario||!clave)return err('Escribe usuario y contraseña.');
    if(U.some(x=>x.usuario.trim().toLowerCase()===usuario.toLowerCase()))return err('Ya existe una cuenta con ese usuario.');
    let ministerioId=null;
    if(esMinisterioTier(actor))ministerioId=miMinisterio(actor);
    else if(['editorMinisterio','usuario'].includes(rol)){
      ministerioId=$('#fm',o)?.value||'';
      if(!ministerioId)return err('Elige a qué ministerio pertenece, o crea un ministerio primero.');
    }
    crear('usuarios',{usuario,clave,nombre:nombre||usuario,rol,ministerioId,activo:true,creadoPor:actor.id}).then(ref=>{
      if(rol==='ministerio')guardar('usuarios',ref.id,{ministerioId:ref.id});
    });
    o.remove();aviso('Cuenta creada.');
  };
  o.onclick=e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.cx!=null)o.remove();else if(b.id==='ok')aceptar()};
  o.onkeydown=e=>{if(e.key==='Enter'&&e.target.tagName!=='SELECT'){e.preventDefault();aceptar()}};
}

function formEditar(u){
  if(!u)return;
  const o=modal(`<div class="mh"><h2>Editar cuenta</h2><button class="ic" data-cx aria-label="Cerrar">${ic('x')}</button></div>
    <label class="fl2" style="margin-bottom:12px">Nombre<input id="fn" value="${esc(u.nombre||'')}" autocomplete="off"></label>
    <label class="fl2" style="margin-bottom:12px">Usuario<input id="fu" value="${esc(u.usuario)}" autocomplete="off"></label>
    <label class="fl2" style="margin-bottom:12px">Nueva contraseña (vacío = no cambiar)<input id="fc" type="text" autocomplete="off"></label>
    <label class="chk" style="margin:2px 0 14px"><input type="checkbox" id="fa" ${u.activo===false?'':'checked'}> Cuenta activa (puede iniciar sesión)</label>
    <p class="error" role="alert" hidden></p>
    <div class="barra" style="justify-content:flex-end;margin:6px 0 0"><button class="sec" data-cx>Cancelar</button><button id="ok">Guardar</button></div>`);
  const err=t=>{const p=$('.error',o);p.textContent=t;p.hidden=!t};
  const aceptar=()=>{
    const nombre=$('#fn',o).value.trim(),usuario=$('#fu',o).value.trim(),clave=$('#fc',o).value,activo=$('#fa',o).checked;
    if(!usuario)return err('Escribe un usuario.');
    if(U.some(x=>x.id!==u.id&&x.usuario.trim().toLowerCase()===usuario.toLowerCase()))return err('Ya existe otra cuenta con ese usuario.');
    const cambios={usuario,nombre:nombre||usuario,activo};
    if(clave)cambios.clave=clave;
    guardar('usuarios',u.id,cambios);
    o.remove();aviso('Cambios guardados.');
  };
  o.onclick=e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.cx!=null)o.remove();else if(b.id==='ok')aceptar()};
  o.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();aceptar()}};
}

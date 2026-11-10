// ===== LOGIN (Firebase Authentication: correo + contraseña, con autorregistro) =====
import {establecerSesion,alCambiarAuth,iniciarSesionAuth,cerrarSesionAuth,enviarVerificacion,recargarUsuarioAuth,escucharDoc,guardar} from "./base.js";
import {montarMenuUsuario,cargado,sinCuentas,misionesDisponibles,crearPrimerAdmin,autorregistrar} from "./usuarios.js";
import {selectorBandera,activarSelectores} from "./misiones.js";

const svg=d=>`<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const NOTA='<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>';
// Recarga la página después de salir: así no queda nada de la sesión anterior pegado en
// la cabecera (el menú con el nombre, etc.) ni en el estado interno de las pantallas.
const salir=async()=>{try{await cerrarSesionAuth()}finally{location.reload()}};

const ERRORES_AUTH={
  'auth/invalid-credential':'Correo o contraseña incorrectos. Revisa los datos e inténtalo otra vez.',
  'auth/wrong-password':'Correo o contraseña incorrectos. Revisa los datos e inténtalo otra vez.',
  'auth/user-not-found':'Correo o contraseña incorrectos. Revisa los datos e inténtalo otra vez.',
  'auth/too-many-requests':'Demasiados intentos. Espera un momento e inténtalo de nuevo.',
  'auth/email-already-in-use':'Ya existe una cuenta con ese correo.',
  'auth/invalid-email':'Ese correo no es válido.',
  'auth/weak-password':'La contraseña debe tener al menos 6 caracteres.'
};
const marco=contenido=>`<form class="login" novalidate>${contenido}</form>`;

// Carga todas las pantallas a la vez y, cuando están listas, dibuja la pantalla actual
// vieneDeLogin: se pone en true cuando se muestra cualquier pantalla de entrada (login, crear cuenta,
// primer administrador). Así, al entrar, la app va al Inicio; pero si solo recargas la página
// con la sesión ya abierta, te quedas en la pantalla donde estabas.
let vieneDeLogin = false;
async function iniciarApp() {
  document.body.classList.remove('sin-sesion');
  if (vieneDeLogin) { vieneDeLogin = false; history.replaceState(null, '', '#inicio'); }
  const [base] = await Promise.all(['base', 'canciones', 'calendario', 'escalas', 'repertorio', 'respaldo', 'ver'].map(m => import(`./${m}.js`)));
  if (base.appCargada) base.appCargada();   // (por si el navegador aún tiene guardada una versión anterior de base.js)
  dispatchEvent(new HashChangeEvent('hashchange'));
  montarMenuUsuario(salir);
}

function mostrarLogin() {
  vieneDeLogin = true;
  document.body.classList.add('sin-sesion');
  document.title = 'Iniciar sesión · Músicapp';
  const app = document.getElementById('app');
  app.innerHTML = marco(`
    <div class="marca">${svg(NOTA).replace('width="18" height="18"', 'width="28" height="28"')}</div>
    <h1>Músicapp</h1>
    <p class="ayuda">Inicia sesión para continuar</p>
    <label>Correo<input name="correo" type="email" autocomplete="email" required></label>
    <label>Contraseña<input name="clave" type="password" autocomplete="current-password" required></label>
    <p class="error" role="alert" hidden></p>
    <button type="submit">Entrar</button>
    <p class="ayuda" style="margin-top:14px">¿No tienes cuenta? <button type="button" class="lnk" id="irRegistro">Crear cuenta</button></p>`);
  const f = app.querySelector('form');
  f.correo.focus();
  const err = t => { const p = f.querySelector('.error'); p.textContent = t || 'Correo o contraseña incorrectos. Revisa los datos e inténtalo otra vez.'; p.hidden = false };
  f.onsubmit = async e => {
    e.preventDefault();
    const btn = f.querySelector('button[type=submit]'); btn.disabled = true;
    try {
      await iniciarSesionAuth(f.correo.value.trim(), f.clave.value);
      // el resto lo maneja alCambiarAuth, más abajo
    } catch (err2) {
      err(ERRORES_AUTH[err2.code]);
      f.clave.value = ''; f.clave.focus();
      btn.disabled = false;
    }
  };
  app.querySelector('#irRegistro').onclick = () => mostrarRegistro();
}

async function mostrarRegistro() {
  vieneDeLogin = true;
  document.body.classList.add('sin-sesion');
  document.title = 'Crear cuenta · Músicapp';
  const app = document.getElementById('app');
  app.innerHTML = marco(`<p class="ayuda">Cargando misiones…</p>`);
  await cargado();
  const misiones = misionesDisponibles();
  app.innerHTML = marco(`
    <div class="marca">${svg(NOTA).replace('width="18" height="18"', 'width="28" height="28"')}</div>
    <h1>Crear cuenta</h1>
    <p class="ayuda">Quedas como Usuario (solo ver) de la misión que elijas.</p>
    <label>Nombre<input name="nombre" autocomplete="name" required></label>
    <label>Correo<input name="correo" type="email" autocomplete="email" required></label>
    <label>Misión
      ${selectorBandera({ name: 'mision', placeholder: 'Elige tu misión…', opciones: misiones.map(m => ({ valor: m.id, texto: m.nombre + (m.pais ? ' · ' + m.pais : ''), codigo: m.codigo })) })}
    </label>
    <label>Contraseña (mínimo 6 caracteres)<input name="clave" type="password" autocomplete="new-password" required></label>
    <label>Repetir contraseña<input name="clave2" type="password" autocomplete="new-password" required></label>
    <p class="error" role="alert" hidden></p>
    <button type="submit">Crear cuenta</button>
    <p class="ayuda" style="margin-top:14px">¿Ya tienes cuenta? <button type="button" class="lnk" id="irLogin">Inicia sesión</button></p>`);
  const f = app.querySelector('form');
  activarSelectores(app);
  if (!misiones.length) { f.querySelector('.sb').insertAdjacentHTML('afterend', '<small style="color:var(--rojo)">Aún no hay ninguna misión creada. Pide a un Administrador que cree una primero.</small>') }
  f.nombre.focus();
  const err = t => { const p = f.querySelector('.error'); p.textContent = t; p.hidden = false };
  f.onsubmit = async e => {
    e.preventDefault();
    if (f.clave.value !== f.clave2.value) return err('Las contraseñas no coinciden.');
    if (!f.mision.value) return err('Elige una misión.');
    const btn = f.querySelector('button[type=submit]'); btn.disabled = true;
    try {
      await autorregistrar(f.nombre.value.trim(), f.correo.value.trim(), f.clave.value, f.mision.value);
      // el resto lo maneja alCambiarAuth, más abajo (va a pedir verificar el correo)
    } catch (err2) {
      err(ERRORES_AUTH[err2.code] || 'No se pudo crear la cuenta. Intenta de nuevo.');
      btn.disabled = false;
    }
  };
  app.querySelector('#irLogin').onclick = () => mostrarLogin();
}

function mostrarPrimerAdmin() {
  vieneDeLogin = true;
  document.body.classList.add('sin-sesion');
  document.title = 'Configurar · Músicapp';
  const app = document.getElementById('app');
  app.innerHTML = marco(`
    <div class="marca">${svg(NOTA).replace('width="18" height="18"', 'width="28" height="28"')}</div>
    <h1>Primeros pasos</h1>
    <p class="ayuda">Aún no hay ninguna cuenta. Crea la primera: será el Administrador.</p>
    <label>Nombre<input name="nombre" autocomplete="name" required></label>
    <label>Correo<input name="correo" type="email" autocomplete="email" required></label>
    <label>Contraseña (mínimo 6 caracteres)<input name="clave" type="password" autocomplete="new-password" required></label>
    <p class="error" role="alert" hidden></p>
    <button type="submit">Crear Administrador</button>`);
  const f = app.querySelector('form');
  f.nombre.focus();
  const err = t => { const p = f.querySelector('.error'); p.textContent = t; p.hidden = false };
  f.onsubmit = async e => {
    e.preventDefault();
    const btn = f.querySelector('button[type=submit]'); btn.disabled = true;
    try {
      await crearPrimerAdmin(f.nombre.value.trim(), f.correo.value.trim(), f.clave.value);
      // el resto lo maneja alCambiarAuth, más abajo
    } catch (err2) {
      err(ERRORES_AUTH[err2.code] || 'No se pudo crear la cuenta. Intenta de nuevo.');
      btn.disabled = false;
    }
  };
}

function mostrarVerificar(user) {
  document.body.classList.add('sin-sesion');
  document.title = 'Verifica tu correo · Músicapp';
  const app = document.getElementById('app');
  app.innerHTML = marco(`
    <div class="marca">${svg(NOTA).replace('width="18" height="18"', 'width="28" height="28"')}</div>
    <h1>Verifica tu correo</h1>
    <p class="ayuda">Te enviamos un enlace a <b>${user.email}</b>. Ábrelo y luego vuelve aquí (revisa también spam/correo no deseado).</p>
    <p class="error" role="alert" hidden></p>
    <button type="button" id="yaVerifique">Ya lo verifiqué, continuar</button>
    <button type="button" class="sec" id="reenviar" style="margin-top:8px">Reenviar correo</button>
    <p class="ayuda" style="margin-top:14px"><button type="button" class="lnk" id="salirVerif">Salir</button></p>`);
  const form = app.querySelector('form');
  const err = t => { const p = form.querySelector('.error'); p.textContent = t; p.hidden = false };
  form.querySelector('#yaVerifique').onclick = async () => {
    try {
      await recargarUsuarioAuth(user);
      if (user.emailVerified) { appIniciada = true; iniciarApp() }
      else err('Aún no verificamos tu correo. Revisa tu bandeja (y spam).');
    } catch (e) { err('No pudimos revisar el estado. Intenta de nuevo.') }
  };
  form.querySelector('#reenviar').onclick = async () => {
    try { await enviarVerificacion(user); err('Te lo volvimos a enviar.') }
    catch (e) { err('No se pudo reenviar. Intenta más tarde.') }
  };
  form.querySelector('#salirVerif').onclick = () => salir();
}

// Ventana Compartir (#ver/ID): se abre SIN login y solo carga lo necesario para ver el repertorio
async function iniciarVer() {
  document.body.classList.add('modo-ver');
  const [base] = await Promise.all(['base', 'ver'].map(m => import(`./${m}.js`)));
  if (base.appCargada) base.appCargada();   // (por si el navegador aún tiene guardada una versión anterior de base.js)
  dispatchEvent(new HashChangeEvent('hashchange'));
  // Si desde aquí se cambia la dirección a otra parte de la app, se recarga para pasar por el login
  addEventListener('hashchange', () => { if (!location.hash.startsWith('#ver/')) location.reload(); });
}

let appIniciada = false, dejarDeEscuchar = null;

function escucharAuth() {
  alCambiarAuth(async user => {
    if (dejarDeEscuchar) { dejarDeEscuchar(); dejarDeEscuchar = null }
    appIniciada = false;
    if (!user) {
      establecerSesion(null);
      await cargado();
      if (sinCuentas()) mostrarPrimerAdmin(); else mostrarLogin();
      return;
    }
    const esperaMax = setTimeout(() => {
      if (!appIniciada) {
        document.body.classList.add('sin-sesion');
        const app = document.getElementById('app');
        app.innerHTML = marco(`<h1>No encontramos tu cuenta</h1><p class="ayuda">Puede que un Administrador la haya eliminado. Contáctalo, o intenta salir y entrar de nuevo.</p><button type="button" id="salirSinCuenta">Salir</button>`);
        app.querySelector('#salirSinCuenta').onclick = () => salir();
      }
    }, 6000);
    dejarDeEscuchar = escucharDoc('usuarios', user.uid, datos => {
      if (!datos) return;   // aún se está creando (justo después de registrarse) o ya no existe
      clearTimeout(esperaMax);
      if (datos.activo === false) { salir(); return }
      establecerSesion({ id: user.uid, correo: user.email, emailVerified: user.emailVerified, ...datos });
      if (appIniciada) return;   // ya está dentro de la app; esto solo refresca la sesión (p.ej. le cambiaron el rol)
      appIniciada = true;
      const necesitaVerificar = datos.requiereVerificacion && !user.emailVerified;
      if (necesitaVerificar) { mostrarVerificar(user); return }
      // Ya está verificado (por este camino o porque abrió el enlace y volvió a entrar):
      // se guarda para que el resto de la app (p.ej. Configuración) ya no lo marque pendiente.
      if (datos.requiereVerificacion) guardar('usuarios', user.uid, { requiereVerificacion: false });
      iniciarApp();
    });
  });
}

if (location.hash.startsWith('#ver/')) iniciarVer(); else escucharAuth();

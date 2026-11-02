// ===== LOGIN (cuentas reales en Firebase: admin, ministerio, usuario) =====
// Ojo: esto solo pide usuario y contraseña en pantalla. No protege los datos de Firebase.
import {establecerSesion} from "./base.js";
import {cargado,intentarLogin,usuarioPorId,montarMenuUsuario} from "./usuarios.js";

const LLAVE='musicapp_sesion_id';
const leerId=()=>{try{return localStorage.getItem(LLAVE)}catch{return null}};
const escribirId=id=>{try{id?localStorage.setItem(LLAVE,id):localStorage.removeItem(LLAVE)}catch{}};
const svg=d=>`<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const NOTA='<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>';
const salir=()=>{escribirId(null);establecerSesion(null);location.hash='';location.reload()};

// Carga todas las pantallas a la vez y, cuando están listas, dibuja la pantalla actual
async function iniciarApp() {
  document.body.classList.remove('sin-sesion');
  const [base] = await Promise.all(['base', 'canciones', 'calendario', 'escalas', 'repertorio', 'respaldo', 'ver'].map(m => import(`./${m}.js`)));
  if (base.appCargada) base.appCargada();   // (por si el navegador aún tiene guardada una versión anterior de base.js)
  dispatchEvent(new HashChangeEvent('hashchange'));
  montarMenuUsuario(salir);
}

function mostrarLogin() {
  document.body.classList.add('sin-sesion');
  document.title = 'Iniciar sesión · Músicapp';
  const app = document.getElementById('app');
  app.innerHTML = `
    <form class="login" novalidate>
      <div class="marca">${svg(NOTA).replace('width="18" height="18"', 'width="28" height="28"')}</div>
      <h1>Músicapp</h1>
      <p class="ayuda">Inicia sesión para continuar</p>
      <label>Usuario<input name="u" autocomplete="username" autocapitalize="none" spellcheck="false" required></label>
      <label>Contraseña<input name="c" type="password" autocomplete="current-password" required></label>
      <p class="error" role="alert" hidden>Usuario o contraseña incorrectos. Revisa los datos e inténtalo otra vez.</p>
      <button type="submit">Entrar</button>
    </form>`;
  const f = app.querySelector('form');
  f.u.focus();
  f.onsubmit = e => {
    e.preventDefault();
    const u = intentarLogin(f.u.value, f.c.value);
    if (u) {
      establecerSesion(u);
      escribirId(u.id);
      app.innerHTML = '';
      iniciarApp();
    } else {
      f.querySelector('.error').hidden = false;
      f.c.value = '';
      f.c.focus();
    }
  };
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

async function arrancar() {
  await cargado();                       // espera la primera lectura de la colección «usuarios»
  const id = leerId(), u = id && usuarioPorId(id);
  if (u) { establecerSesion(u); iniciarApp() }
  else { escribirId(null); mostrarLogin() }
}

if (location.hash.startsWith('#ver/')) iniciarVer();
else arrancar();

// =====================================================================
//  SW.JS · Service Worker: deja abrir la app sin conexión a internet
//
//  Guarda en el dispositivo el «cascarón» de la app (HTML, CSS, JS, íconos
//  y el SDK de Firebase) la primera vez que se abre con internet. Así,
//  sin conexión, la página carga igual (con los últimos datos que
//  Firestore ya tenía guardados en este dispositivo — ver el comentario
//  sobre persistentLocalCache en base.js). Este archivo SOLO se encarga
//  de que la página en sí cargue sin conexión; los datos los maneja
//  Firestore por su cuenta, incluidas las escrituras hechas sin conexión
//  (quedan en cola y se guardan solas en cuanto vuelve el internet).
//
//  CACHE_VERSION: súbela (v2, v3...) cuando cambies la lista de archivos
//  de abajo (p. ej. al agregar un archivo .js nuevo a la app), así los
//  dispositivos borran la copia vieja y guardan la nueva.
// =====================================================================
const CACHE_VERSION='v2';
const CACHE='musicapp-'+CACHE_VERSION;

// El cascarón de la app: todo lo que hace falta para que la página cargue y funcione,
// sin contar los datos (eso lo cachea Firestore aparte). Si agregas un archivo .js a la
// app, agrégalo aquí también.
const CASCARON=[
  './','index.html','estilos.css','manifest.json','icon.svg','icon-192.png','icon-512.png',
  'firebase-config.js','base.js','estado.js','misiones.js','banderas.js','usuarios.js',
  'login.js','respaldo.js','canciones.js','editor.js','etiquetas.js','escalas.js','equipos.js',
  'calendario.js','milista.js','repertorio.js','ver.js','hoja.js','musica.js','formato.js','liturgico.js',
  'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js',
  'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js',
  'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js'
];

// Solo se maneja lo propio de la app: el mismo origen y el puñado de dominios de donde vienen
// sus archivos estáticos (el SDK de Firebase y las fuentes). Todo lo demás —Firestore, Firebase
// Auth, y cosas internas de esos SDK como su propio aviso de conexión— se deja pasar sin tocar,
// tal cual se comportaría sin este Service Worker.
const PROPIOS=['www.gstatic.com','fonts.googleapis.com','fonts.gstatic.com'];

self.addEventListener('install',e=>{
  e.waitUntil((async()=>{
    const cache=await caches.open(CACHE);
    // Uno por uno (en vez de cache.addAll): si uno falla por una conexión floja, los demás
    // igual quedan guardados en vez de perderse todos.
    await Promise.all(CASCARON.map(url=>cache.add(url).catch(err=>console.warn('No se pudo guardar en caché:',url,err))));
    self.skipWaiting();
  })());
});

self.addEventListener('activate',e=>{
  e.waitUntil((async()=>{
    const nombres=await caches.keys();
    await Promise.all(nombres.filter(n=>n!==CACHE).map(n=>caches.delete(n)));
    self.clients.claim();
  })());
});

self.addEventListener('fetch',e=>{
  const req=e.request;
  if(req.method!=='GET')return;                               // las escrituras (POST) nunca pasan por aquí
  const url=new URL(req.url);
  if(url.origin!==self.location.origin&&!PROPIOS.includes(url.hostname))return;   // no es de la app: se deja pasar sin tocar

  // El cascarón se sirve de la caché al instante (la app abre rápido, con o sin conexión) y se
  // actualiza en segundo plano si hay internet, para que la próxima vez ya esté al día.
  e.respondWith((async()=>{
    const cache=await caches.open(CACHE);
    const enCache=await cache.match(req);
    const deRed=fetch(req).then(res=>{if(res&&res.ok)cache.put(req,res.clone());return res}).catch(()=>null);
    if(enCache)return enCache;
    const fresco=await deRed;
    if(fresco)return fresco;
    if(req.mode==='navigate')return (await cache.match('./'))||new Response('Sin conexión',{status:503,statusText:'Sin conexión'});
    return new Response('',{status:503,statusText:'Sin conexión'});
  })());
});

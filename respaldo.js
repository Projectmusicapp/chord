// ===== COPIA DE SEGURIDAD: descargar y restaurar todos los datos =====
import {$,guardar,escuchar,vistas,ic,modal,esNivelAdmin} from "./base.js";

const ico=(p,s=16)=>`<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
const DL='<path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/>',UP='<path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/>';
// Copia completa (sin separar por ministerio): solo para el nivel Administrador.
const COLS=['config','albumes','canciones','etiquetas','repertorios','personas','escalas','eventos','dias','usuarios'];

// Lee una colección completa una sola vez
const leer=col=>new Promise(res=>{let u;u=escuchar(col,l=>{res(l);setTimeout(()=>u&&u(),0)})});
const dos=n=>String(n).padStart(2,'0');

async function descargar(){
  const datos={};
  for(const c of COLS)datos[c]=await leer(c);
  const f=new Date(),n=Object.values(datos).reduce((a,l)=>a+l.length,0);
  const blob=new Blob([JSON.stringify({app:'ministerio-musica',version:1,fecha:f.toISOString(),datos})],{type:'application/json'});
  const a=document.createElement('a');
  a.href=URL.createObjectURL(blob);
  a.download='copia-ministerio-musica-'+f.getFullYear()+'-'+dos(f.getMonth()+1)+'-'+dos(f.getDate())+'.json';
  document.body.append(a);a.click();a.remove();
  try{localStorage.setItem('ultimaCopia',f.toISOString())}catch(e){}
  return n;
}

async function restaurar(file){
  let j;
  try{j=JSON.parse(await file.text())}catch(e){return 'El archivo no es una copia v\u00e1lida.'}
  if(j.app!=='ministerio-musica'||!j.datos)return 'Este archivo no es una copia de Ministerio de m\u00fasica.';
  const items=COLS.flatMap(c=>(j.datos[c]||[]).filter(x=>x&&x.id).map(({id,...d})=>[c,id,d]));
  if(!items.length)return 'La copia no contiene datos.';
  const cuando=j.fecha?new Date(j.fecha).toLocaleString('es'):'fecha desconocida';
  if(!confirm('Se restaurar\u00e1n '+items.length+' elementos de la copia del '+cuando+'.\n\nLo que tenga el mismo identificador se reemplaza por lo de la copia. Lo que creaste despu\u00e9s de la copia se conserva.\n\n\u00bfContinuar?'))return '';
  for(let i=0;i<items.length;i+=20)await Promise.all(items.slice(i,i+20).map(([c,id,d])=>guardar(c,id,d,false)));
  return 'Listo: se restauraron '+items.length+' elementos.';
}

function ventana(){
  const u=(()=>{try{return localStorage.getItem('ultimaCopia')}catch(e){return null}})();
  const o=modal(`<div class="mh"><h2>Copia de seguridad</h2><button class="ic" data-cx aria-label="Cerrar">${ic('x')}</button></div>
    <p style="margin-top:0">Descarga un archivo con todas tus canciones, \u00e1lbumes, etiquetas, repertorios, escalas y eventos. Gu\u00e1rdalo en un lugar seguro (Drive, correo...).</p>
    <p style="color:var(--gris);font-size:13.5px">${u?'\u00daltima copia descargada en este dispositivo: '+new Date(u).toLocaleString('es'):'A\u00fan no has descargado ninguna copia en este dispositivo.'}</p>
    <div style="display:grid;gap:10px"><button id="dl">${ico(DL)} Descargar copia</button><button class="sec" id="up">${ico(UP)} Restaurar desde un archivo</button><input type="file" id="fi" accept=".json,application/json" hidden></div>
    <p id="ms" role="status" style="margin-bottom:0;font-weight:600"></p>`);
  const ms=t=>{$('#ms',o).textContent=t};
  o.onclick=async e=>{
    const b=e.target.closest('button');if(!b)return;
    if(b.dataset.cx!=null)o.remove();
    else if(b.id==='dl'){b.disabled=true;ms('Preparando la copia...');
      try{const n=await descargar();ms('Copia descargada ('+n+' elementos). Revisa tu carpeta de Descargas.')}catch(err){ms('No se pudo crear la copia. Revisa tu conexi\u00f3n e int\u00e9ntalo de nuevo.')}
      b.disabled=false}
    else if(b.id==='up')$('#fi',o).click();
  };
  o.onchange=async e=>{
    if(e.target.id!=='fi'||!e.target.files[0])return;
    ms('Restaurando...');
    try{ms(await restaurar(e.target.files[0]))}catch(err){ms('No se pudo restaurar la copia.')}
    e.target.value='';
  };
}

// Agrega el botón en la pantalla de Inicio
const inicio=vistas.inicio;
vistas.inicio=el=>{
  inicio(el);
  if(!esNivelAdmin())return;
  const barra=el.querySelector('.ajustes');if(!barra)return;
  const b=document.createElement('button');b.dataset.respaldo='';b.innerHTML=ico(DL,16)+' Copia de seguridad';b.onclick=ventana;
  barra.append(b);
};
// Si la pantalla de Inicio ya se dibujó antes de cargar este archivo, se añade el botón ahora
{const app=document.getElementById('app');if(esNivelAdmin()&&app&&app.querySelector('.ajustes')&&!app.querySelector('.ajustes [data-respaldo]'))vistas.inicio(app)}

// =====================================================================
//  EQUIPOS.JS  ·  Elegir una escala (un equipo de un día) para un repertorio
//
//  Usa los MISMOS datos de la pantalla «Escalas» (días, equipos y personas).
//  No crea nada nuevo: solo lee y guarda en el repertorio cuál se eligió.
//
//  Una escala elegida se guarda así:  {dia:'sabado', eq:0, nombre:'Equipo A'}
//   - dia ...... id del día en Escalas
//   - eq ....... posición del equipo dentro del día
//   - nombre ... nombre del equipo (por si cambian el orden de los equipos)
//
//  QUÉ HAY AQUÍ:
//   equipoDe(sel) ........ {dia, equipo, miembros} con los datos actuales (o null)
//   textoEquipo(sel) ..... «Sábado · Equipo A»
//   htmlMiembros(sel) .... lista de integrantes para mostrar en un cuadro
//   elegirEscala(sel, cb)  ventana con los días desplegables para elegir un equipo
//   alCambiarEquipos(fn) . avisa cuando cambian días, equipos o personas
//   diasDeEscalas() ...... los días con sus equipos (ya filtrados por misión)
//   listaPersonas() ...... las personas (ya filtradas por misión)
//
//  La pantalla «Escalas» (escalas.js) lee también de aquí en vez de escuchar
//  «escalas»/«personas» por su cuenta: así solo hay UN listener por colección
//  (antes había dos, y el de escalas.js ni siquiera filtraba por misión).
// =====================================================================
import {$,esc,escucharPropio,ic,modal} from "./base.js";

let X=[],P=[];
const oyentes=[];
export const alCambiarEquipos=fn=>{oyentes.push(fn)};
export const diasDeEscalas=()=>X;
export const listaPersonas=()=>P;
const avisar=()=>oyentes.forEach(f=>f());
escucharPropio('escalas',l=>{X=[...l].sort((a,b)=>(a.orden||0)-(b.orden||0));avisar()});
escucharPropio('personas',l=>{P=l;avisar()});

const st=document.createElement('style');
st.textContent=`.mesc details{background:var(--capa);border-radius:var(--r-m);margin-bottom:8px}
.mesc summary{list-style:none;cursor:pointer;display:flex;align-items:center;gap:8px;padding:12px 14px;font-weight:800;color:var(--azul);font-size:15.5px}
.mesc summary::-webkit-details-marker{display:none}
.mesc summary .chev{display:inline-flex;color:var(--gris);transition:transform .15s}
.mesc details[open] summary .chev{transform:rotate(90deg)}
.mesc summary small{margin-left:auto;color:var(--gris);font-weight:600}
.mesc .eqs{display:grid;gap:6px;padding:0 10px 10px}
.mesc .eqs button{display:block;text-align:left;background:var(--blanco);color:var(--tx);border:1.5px solid var(--linea);padding:10px 12px;font-weight:700}
.mesc .eqs button:hover{border-color:var(--linea-2);filter:none}
.mesc .eqs button.on{border-color:var(--azul);box-shadow:inset 0 0 0 1px var(--azul)}
.mesc .eqs button small{display:block;color:var(--gris);font-weight:500;margin-top:2px;line-height:1.35}
.mesc .pie{display:flex;justify-content:space-between;gap:8px;margin-top:10px}
.miembros{list-style:none;margin:0;padding:0;display:grid;gap:4px}
.miembros li{display:flex;justify-content:space-between;gap:12px;padding:5px 0;border-bottom:1px solid var(--linea)}
.miembros li:last-child{border-bottom:0}
.miembros small{color:var(--gris)}`;
document.head.append(st);

// Mismo orden que en Escalas: primero «Voz», luego por ocupación y nombre
const oc=p=>(p.ocupacion||'').trim().toLowerCase();
const ordenar=ids=>ids.map(id=>P.find(p=>p.id===id)).filter(Boolean).sort((a,b)=>{
  const va=oc(a).includes('voz'),vb=oc(b).includes('voz');
  if(va!==vb)return va?-1:1;
  return oc(a).localeCompare(oc(b))||(a.nombre||'').localeCompare(b.nombre||'');
});

export function equipoDe(sel){
  if(!sel||!sel.dia)return null;
  const d=X.find(x=>x.id===sel.dia);if(!d)return null;
  const eqs=d.equipos||[];
  let q=eqs[sel.eq];
  if(!q||(sel.nombre&&q.nombre!==sel.nombre))q=eqs.find(e=>e.nombre===sel.nombre)||q;   // si cambiaron el orden, se busca por nombre
  if(!q)return null;
  return {dia:d.nombre,equipo:q.nombre,miembros:ordenar(q.miembros||[])};
}
export const textoEquipo=sel=>{const e=equipoDe(sel);return e?e.dia+' · '+e.equipo:''};
export function htmlMiembros(sel){
  const e=equipoDe(sel);
  if(!e)return '<p class="vac" style="margin:0">La escala elegida ya no existe en Escalas.</p>';
  return e.miembros.length?`<ul class="miembros">${e.miembros.map(p=>`<li><span>${esc(p.nombre)}</span><small>${esc(p.ocupacion||'')}</small></li>`).join('')}</ul>`:'<p class="vac" style="margin:0">Este equipo aún no tiene personas.</p>';
}

// elegirEscala(actual, alElegir): ventana con los días (listas desplegables) y sus equipos.
// alElegir recibe {dia, eq, nombre}, o null si se pulsa «Quitar escala».
export function elegirEscala(actual,alElegir){
  const o=modal('<div class="mesc" id="mesc"></div>'),z=$('#mesc',o);
  const abiertos=new Set(actual&&actual.dia?[actual.dia]:X.slice(0,1).map(d=>d.id));
  const pinta=()=>{
    z.innerHTML=`<div class="mh"><h2>Elegir escala</h2><button class="ic" data-cx aria-label="Cerrar">${ic('x')}</button></div>`
      +(X.map(d=>`<details data-d="${d.id}" ${abiertos.has(d.id)?'open':''}><summary><span class="chev">${ic('rgt',16)}</span>${esc(d.nombre)}<small>${(d.equipos||[]).length} equipos</small></summary><div class="eqs">`
        +(d.equipos||[]).map((q,i)=>{const on=actual&&actual.dia===d.id&&equipoDe(actual)?.equipo===q.nombre;const m=ordenar(q.miembros||[]);
          return `<button data-dia="${d.id}" data-eq="${i}" class="${on?'on':''}" aria-pressed="${!!on}">${esc(q.nombre)}<small>${m.length?m.map(p=>esc(p.nombre)).join(', '):'Sin personas'}</small></button>`}).join('')
        +'</div></details>').join('')||'<p class="vac">Aún no hay escalas. Créalas en la pantalla «Escalas».</p>')
      +`<div class="pie">${actual&&actual.dia?'<button class="sec" data-quitar>Quitar escala</button>':'<span></span>'}<button class="sec" data-cx>Cancelar</button></div>`;
  };
  pinta();
  z.addEventListener('toggle',e=>{const d=e.target.dataset.d;if(d){e.target.open?abiertos.add(d):abiertos.delete(d)}},true);
  o.onclick=e=>{const b=e.target.closest('button');if(!b)return;const d=b.dataset;
    if(d.cx!=null)o.remove();
    else if(d.quitar!=null){o.remove();alElegir(null)}
    else if(d.dia){const dia=X.find(x=>x.id===d.dia),q=dia.equipos[+d.eq];o.remove();alElegir({dia:d.dia,eq:+d.eq,nombre:q.nombre})}};
}

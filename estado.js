// =====================================================================
//  ESTADO.JS  ·  Datos compartidos
//  Aquí se leen de Firebase los álbumes, canciones, etiquetas y
//  repertorios UNA sola vez. Los demás archivos los usan así:
//     E.albumes   E.canciones   E.etiquetas   E.repertorios
//
//  Antes, calendario.js/repertorio.js/milista.js tenían cada uno su
//  propio listener sobre las mismas colecciones (leyéndolas varias
//  veces por sesión), y el de repertorio.js ni siquiera filtraba por
//  misión (igual que el bug que se corrigió en escalas.js): mostraba,
//  y dejaba editar o borrar, canciones/álbumes/repertorios de
//  CUALQUIER misión en el buscador y la lista de Repertorio.
//
//  Para enterarte cuando algo cambia:
//     const dejarDeEscuchar = alCambiar(() => { ...tu código... });
// =====================================================================
import {escuchar,escucharPropio,guardar,visibleBiblioteca} from "./base.js";

export const E={albumes:[],canciones:[],etiquetas:[],repertorios:[]};

// ---------- Lista de quienes quieren enterarse de los cambios ----------
const oyentes=[];
export function alCambiar(funcion){
  oyentes.push(funcion);
  funcion();   // por si ya había datos cuando alguien se suscribe (si no, se quedaría con el estado inicial vacío para siempre)
  return ()=>{const i=oyentes.indexOf(funcion);if(i>=0)oyentes.splice(i,1)};   // devuelve cómo dejar de escuchar
}
const avisar=()=>oyentes.slice().forEach(f=>f());

// ---------- Etiquetas que vienen creadas la primera vez ----------
const ETIQUETAS_BASE=['Canto de entrada','Kyrie','Gloria','Aclamaci\u00f3n','Peticiones','Ofertorio','Santo','Elevaci\u00f3n','Anunciamos','Am\u00e9n','Cordero','Comuni\u00f3n','Acci\u00f3n de gracias','Canto a Mar\u00eda'];

// ---------- Álbumes y canciones: se filtran según quién esté viendo (ver visibleBiblioteca en base.js) ----------
// Una canción es visible si su álbum lo es. Se recalcula cuando cambian los álbumes,
// las canciones, o el ámbito actual (al cambiar de espacio de trabajo).
let crudoAlbumes=[],crudoCanciones=[];
function recalcularBiblioteca(){
  E.albumes=crudoAlbumes.filter(visibleBiblioteca);
  const idsVisibles=new Set(E.albumes.map(a=>a.id));
  E.canciones=crudoCanciones.filter(c=>idsVisibles.has(c.albumId));
  avisar();
}
escuchar('albumes',l=>{crudoAlbumes=l;recalcularBiblioteca()});
escuchar('canciones',l=>{crudoCanciones=l;recalcularBiblioteca()});
addEventListener('ambitocambio',recalcularBiblioteca);

// ---------- Escuchar Firebase ----------
escuchar('etiquetas',l=>{
  E.etiquetas=l.sort((a,b)=>a.nombre.localeCompare(b.nombre));
  if(!l.length)ETIQUETAS_BASE.forEach(n=>guardar('etiquetas','b-'+n.toLowerCase().replace(/\W+/g,'-'),{nombre:n}));   // crea las etiquetas base si no hay ninguna
  avisar();
});

// Repertorios (y las «Mi lista», que viven en la misma colección): ya filtrados por misión.
// Cada pantalla que los use (repertorio.js, calendario.js, milista.js) aplica su propio filtro
// extra sobre esta misma lista (p.ej. sin «Mi lista», o solo las de un día, o solo las propias).
escucharPropio('repertorios',l=>{E.repertorios=l;avisar()});

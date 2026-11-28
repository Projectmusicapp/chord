// =====================================================================
//  FORMATO.JS  ·  Fuentes, colores e íconos
//  Herramientas pequeñas que usa el editor para dar formato al texto.
//
//  QUÉ HAY AQUÍ:
//   FIJAS, PROPOR ... listas de tipos de letra
//   cssFuente(n) .... convierte un nombre de letra en CSS
//   OKC ............. comprueba que un color sea válido
//   colorOk(c) ...... convierte cualquier color a #rrggbb
//   plano(linea) .... devuelve el texto de una línea sin formato
//   svgI y las rutas  dibujan los íconos (UNDO, REDO, BRUSH ...)
//   CT, CH .......... colores de la paleta (texto y resaltado)
//                      OJO: el rojo de la paleta (#B3161E) es a propósito distinto al rojo de los acordes (#B3261E, ver ROJO en editor.js
//                      y ROJOV en hoja.js): ese rojo exacto se muestra con el color de acordes que cada cuenta elige en Tema.
// =====================================================================
export const FIJAS={'Est\u00e1ndar (Arial)':'','Courier New':'"Courier New",Courier,monospace','Consolas':'Consolas,"Courier New",monospace','Lucida Console':'"Lucida Console",Monaco,monospace','Menlo / Monaco':'Menlo,Monaco,"Courier New",monospace'};
export const PROPOR=['Arial','Calibri','Cambria','Century Gothic','Comic Sans MS','Georgia','Segoe UI','Tahoma','Times New Roman','Trebuchet MS','Verdana'];
export const cssFuente=n=>!n?'':(FIJAS[n]||('"'+String(n).replace(/["\\<>]/g,'')+'",sans-serif'));
export const OKC=/^(#[0-9a-f]{3,8}|rgba?\([\d\s,.]+\))$/i;
export const cvx=document.createElement('canvas').getContext('2d');
export const colorOk=c=>{if(!c)return '';cvx.fillStyle='#000001';cvx.fillStyle=c;const v=cvx.fillStyle;if(v==='#000001'&&!/^(#000001|rgb\(0,\s*0,\s*1\))$/i.test(c))return '';return /,\s*0\)$/.test(v)?'':v};
export const plano=l=>l.r.map(x=>x.t).join('');
// ---------- Íconos (dibujos simples) ----------
export const svgI=(p,s=18)=>`<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
export const UNDO='<path d="M3 7v6h6"/><path d="M21 17a9 9 0 00-15-6.7L3 13"/>',REDO='<path d="M21 7v6h-6"/><path d="M3 17a9 9 0 0115-6.7L21 13"/>',AL_L='<path d="M3 6h18M3 12h12M3 18h16"/>',AL_C='<path d="M3 6h18M7 12h10M5 18h14"/>',AL_R='<path d="M3 6h18M9 12h12M5 18h16"/>',AL_J='<path d="M3 6h18M3 12h18M3 18h18"/>',IND='<path d="M3 6h18M11 12h10M11 18h10M3 9l3 3-3 3"/>',OUTD='<path d="M3 6h18M11 12h10M11 18h10M6 9l-3 3 3 3"/>',FIND='<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>',BRUSH='<path d="M18 3l3 3-9 9-3-3z"/><path d="M9 12c-3 0-5 2-5 5 0 2-1 3-1 3s5 1 7-1c1-1 1-3 0-4"/>';
export const CT=['#000000','#434343','#757575','#B3161E','#E67E22','#F1C40F','#2E7D32','#1F6FEB','#7B1FA2','#D81B60','#00897B','#6D4C41'],CH=['#FFF176','#A5D6A7','#90CAF9','#F48FB1','#FFCC80','#CE93D8','#80DEEA','#E0E0E0'];
export const MARK='<path d="M9 11l-6 6v3h9l3-3"/><path d="M22 12l-4.6 4.6a2 2 0 01-2.8 0l-5.2-5.2a2 2 0 010-2.8L14 4"/>';

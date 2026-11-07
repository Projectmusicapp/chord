// =====================================================================
//  HOJA.JS  ·  Cómo se dibuja una canción en la hoja del repertorio
//  Lo usan la vista previa de Repertorio y la ventana Compartir (ver.js),
//  así las dos se ven exactamente igual.
// =====================================================================
import {esc} from "./base.js";

const st=document.createElement('style');
st.textContent=`.hojap{background:#fff;max-width:794px;padding:44px 52px;box-shadow:var(--sombra-2);border-radius:6px;min-height:520px;font-size:16px;line-height:1.35;margin:0 auto;overflow-x:auto}
.rt{margin:0 0 4px;font-size:30px}.rf{color:var(--gris);margin-bottom:22px}.rf::first-letter{text-transform:uppercase}.blk{margin:0 0 18px}
.lab{font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--oro-texto);border-bottom:1px solid var(--linea);margin-bottom:6px;padding-bottom:3px}
.st{font-family:var(--fuente-titulo);font-weight:600;font-size:20px;color:var(--azul);margin:8px 0 4px}.st small{font:600 12.5px var(--fuente);color:var(--gris);margin-left:10px}
.sg{font-family:Arial,"Helvetica Neue",Helvetica,sans-serif}.rl,.rc{font-family:inherit;white-space:pre-wrap;line-height:var(--lh,1.35)}.rc{white-space:pre;font-weight:700;color:#b3261e}
.falta{color:var(--rojo);font-weight:600;font-size:13px;font-style:normal}.sg{margin-bottom:14px}
.hojap .falta{font-size:15px;color:var(--gris);text-align:center;padding:60px 20px;border:1px dashed var(--linea-2);border-radius:var(--r-m)}
.sal{font:600 13px var(--fuente);color:var(--gris);margin:-2px 0 14px;line-height:1.3}
.txn{white-space:pre-wrap;overflow-wrap:anywhere;line-height:1.4}.tl{min-height:1.2em}`;
document.head.append(st);

export const MOM=[['entrada','Canto de entrada'],['kyrie','Kyrie'],['gloria','Gloria'],['aclamacion','Aclamaci\u00f3n'],['peticiones','Peticiones'],['ofertorio','Ofertorio'],['santo','Santo'],['elevacion','Elevaci\u00f3n'],['anunciamos','Anunciamos'],['amen','Am\u00e9n'],['cordero','Cordero'],['comunion','Comuni\u00f3n'],['gracias','Acci\u00f3n de gracias'],['maria','Canto a Mar\u00eda']];
export const MES=['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'],DIA=['domingo','lunes','martes','mi\u00e9rcoles','jueves','viernes','s\u00e1bado'];
export const fechaLarga=f=>{if(!f)return'';const [y,m,d]=f.split('-').map(Number);return DIA[new Date(y,m-1,d).getDay()]+' '+d+' de '+MES[m-1]+' de '+y};

const FF={'Courier New':'Arial,Courier,monospace','Arial':'Arial,"Courier New",monospace','Lucida Console':'"Lucida Console",Monaco,monospace','Menlo / Monaco':'Menlo,Monaco,"Courier New",monospace'};
export const fcss=n=>!n?'':(FF[n]||('"'+String(n).replace(/["\\<>]/g,'')+'",sans-serif'));
export const OKC=/^(#[0-9a-f]{3,8}|rgba?\([\d\s,.]+\))$/i;
export const est=r=>(r.s?'font-size:'+r.s+'px;':'')+(r.k?'font-weight:700;color:#b3261e;':'')+(r.b?'font-weight:700;':'')+(r.i?'font-style:italic;':'')+((r.u||r.x)?'text-decoration:'+[r.u&&'underline',r.x&&'line-through'].filter(Boolean).join(' ')+';':'')+(OKC.test(r.c||'')?'color:'+r.c+';':'')+(OKC.test(r.h||'')?'background-color:'+r.h+';':'');
const hl=(c,t)=>{c=c||[];t=String(t||'');let h='',i=0;while(i<t.length){let j=i;while(j<t.length&&(c[j]||0)===(c[i]||0))j++;h+=OKC.test(c[i]||'')?`<span style="color:${c[i]}">${esc(t.slice(i,j))}</span>`:esc(t.slice(i,j));i=j}return h};

// Álbum de la canción (gris, pequeño, debajo del título). Si no hay álbum no dibuja nada.
const albumHtml=a=>a?`<div class="sal">${esc(a)}</div>`:'';
// En el momento «Peticiones» no se muestra el álbum
export const esPeticiones=n=>String(n||'').trim().toLowerCase()==='peticiones';
// Textos escritos a mano en el repertorio (salmo, comentario...):  r.textos={id:{titulo,texto,despues}}  y  r.textosOrd=[ids en orden]
// «despues» dice después de qué bloque va: 'ini' (al principio), un momento de la misa (kyrie, gloria...) o el id de una sección del evento.
// textosDespues(r,k) devuelve los textos que van después de k (los vacíos solo si todos=true, para el editor).
export const textosDespues=(r,k,todos)=>(r.textosOrd||[]).filter(id=>r.textos&&r.textos[id]).map(id=>({id,...r.textos[id]})).filter(t=>t.despues===k&&(todos||(t.titulo||'').trim()||(t.texto||'').trim()));
// Cada texto guarda sus líneas {r:[tramos]} (mismo modelo que las canciones) y su tipo de letra. Los textos antiguos solo tienen «texto» simple.
const planoL=l=>l.r.map(x=>x.t).join('');
export const lineasTx=t=>t&&t.lineas&&t.lineas.length?t.lineas:String((t&&t.texto)||'').split('\n').map(s=>({r:s?[{t:s}]:[]}));
export const lineasTxHtml=ls=>ls.map(l=>`<div class="tl" style="font-size:${l.s||16}px;${l.a?'text-align:'+l.a+';':''}${l.n?'padding-left:'+l.n*28+'px;':''}">${l.r.map(x=>`<span style="${est(x)}">${esc(x.t)}</span>`).join('')||'<br>'}</div>`).join('');
export const textoHtml=t=>{const ls=lineasTx(t),f=fcss(t&&t.fuente);return ls.some(l=>planoL(l).trim())?`<div class="sg"><div class="txn" style="${f?'font-family:'+esc(f)+';':''}">${lineasTxHtml(ls)}</div></div>`:''};

function hojaAcordes(c,o){
  const f=fcss(c.fuenteA),tono=c.tonoAct||c.tono;
  let h=`<div class="sg" style="${f?'font-family:'+f+';':''}${c.lh?'--lh:'+c.lh+';':''}"><div class="st">${esc(c.titulo)}${(o.tono||tonoNormal)(tono||'')}</div>${albumHtml(o.album)}`;
  c.lineasA.forEach(l=>{h+=`<div class="rl" style="font-size:${l.s||16}px;padding-left:${(l.n||0)*28}px;${l.a?'text-align:'+l.a+';':''}">${l.r.map(x=>`<span style="${est(x)}">${esc(x.t)}</span>`).join('')||'&nbsp;'}</div>`});
  return h+'</div>';
}
// cancion(c, ac, o): dibuja una canción. ac = mostrar acordes.
//   o.album = nombre del álbum que se escribe debajo del título ('' = no mostrarlo)
//   o.tono(texto) devuelve lo que va al lado del título (por defecto «Tono: X»). La ventana Compartir lo usa para el botón de tono.
const tonoNormal=t=>t?`<small>Tono: ${esc(t)}</small>`:'';
export function cancion(c,ac,o={}){
  if(ac&&c.lineasA&&c.lineasA.some(l=>l.r.length))return hojaAcordes(c,o);
  const cc=c.cc||{},blq=(n,t,k)=>`<div class="rc"><b>${n}:</b>${hl(cc[k],t)}</div>`;
  const L=c.lineas||(c.letra||'').split('\n').map(t=>({r:t?[{t}]:[]})),it=c.interludios||[];
  let h=`<div class="sg" style="${fcss(ac?c.fuenteA:c.fuente)?'font-family:'+fcss(ac?c.fuenteA:c.fuente)+';':''}${c.lh?'--lh:'+c.lh+';':''}"><div class="st">${esc(c.titulo)}${ac?(o.tono||tonoNormal)(c.tonoAct||c.tono||''):''}</div>${albumHtml(o.album)}`;
  if(ac&&c.intro&&c.intro.trim())h+=blq('Intro',c.intro,'intro');
  L.forEach((l,i)=>{
    const z=l.s||16,ca=ac&&c.ac&&c.ac[i];
    if(ca&&ca.trim())h+=`<div class="rc" style="font-size:${z}px;padding-left:${(l.n||0)*28}px">${hl(cc['a'+i],ca)}</div>`;
    h+=`<div class="rl" style="font-size:${z}px;padding-left:${(l.n||0)*28}px;${!ac&&l.a?'text-align:'+l.a+';':''}">${l.r.map(r=>`<span style="${est(r)}">${esc(r.t)}</span>`).join('')||'&nbsp;'}</div>`;
    if(ac)it.filter(x=>x.despues===i).forEach(x=>{if((x.texto||'').trim())h+=blq('Interludio',x.texto,'i:'+x.id)});
  });
  if(ac)it.filter(x=>x.despues<0||x.despues>=L.length).forEach(x=>{if((x.texto||'').trim())h+=blq('Interludio',x.texto,'i:'+x.id)});
  if(ac&&c.final!=null&&String(c.final).trim())h+=blq('Final',c.final,'final');
  return h+'</div>';
}


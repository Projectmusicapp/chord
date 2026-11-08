// =====================================================================
//  EDITOR.JS  ·  El editor de canciones (la hoja con la barra de herramientas)
//
//  Se abre desde la pantalla Canciones con  abrir(cancion, alCerrar, {soloLectura}).
//  Con soloLectura:true (rol «usuario», o álbumes que no son del ministerio) se ve la misma hoja
//  pero sin botones de edición, y solo se puede cambiar de pestaña, hacer zoom y transponer (sin guardar).
//  alCerrar es una función que se ejecuta cuando cierras el editor.
//
//  MAPA (usa Ctrl+F para buscar cada parte):
//   ESTILOS ............ colores y tamaños del editor (CSS)
//   HERRAMIENTAS DE TEXTO .. funciones puras (comp, armar, aChars...) fuera del editor
//   Las dos hojas (Letra y Acordes) son documentos libres: se escribe
//   lo que se quiera. Los acordes se distinguen con el botón «Ac».
//   1. HERRAMIENTAS BÁSICAS .. funciones pequeñas de formato
//   2. HISTORIAL ............. Deshacer / Rehacer
//   3. TONALIDAD ............. botón «Tonalidad» y cambio de tono
//   4. LEER Y PEGAR .......... leerDom, limpiaHtml
//   5. FORMATO ............... captura de la selección y fmt (negrita, color, tamaño...)
//   6. BUSCAR Y REEMPLAZAR ... buscar
//   7. DIBUJAR LA HOJA ....... hojaHtml, cnt, optsFuente
//   8. ACORDES ............... marcar acordes, transponer, escribir en modo acorde
//   9. DIBUJAR LA BARRA ...... pinta
//  10. EVENTOS ............... clics, teclas, pegar
//
//  REGLA GENERAL DE FORMATO: todo lo que apliques con la barra afecta SOLO a lo
//  seleccionado (letra por letra). Sin selección, B/I/U/color/resaltado/tamaño
//  quedan «pendientes» y se aplican a lo que escribas a continuación.
//  Alineación y sangría son de párrafo: afectan a las líneas tocadas por la selección.
//  Interlineado, tipo de letra y zoom son de toda la hoja.
// =====================================================================
import {$,esc,guardar,crear,modal,puedeEditarAlbum} from "./base.js";
import {E} from "./estado.js";
import {ix,MAY,MEN,tokensAcorde,tokensMarcado,nuevaRaiz,usaSostenidos,transponerChars} from "./musica.js";
import {FIJAS,PROPOR,cssFuente,OKC,plano,colorOk,CT,CH,svgI,UNDO,REDO,AL_L,AL_C,AL_R,AL_J,IND,OUTD,FIND,BRUSH,MARK} from "./formato.js";

let ed=null;                 // la canción que se está editando (null = ningún editor abierto)
let limpieza=null;           // función para limpiar escuchas y temporizadores al cerrar
let LOCALES=[];              // fuentes instaladas en este equipo (se cargan si el usuario lo pide)
export const editando=()=>ed!==null;   // ¿hay un editor abierto?
export function forzarCierre(){        // cierra el editor sin guardar (por ejemplo al cambiar de pantalla)
  if(limpieza)limpieza();
  limpieza=null;
  document.querySelectorAll('#editor').forEach(x=>x.remove());
  ed=null;
}

// ---------- ESTILOS del editor ----------
const st=document.createElement('style');
st.textContent=`#editor.ed{background:#D3D9E6;padding:0 16px 16px}
html:has(#editor.ed),html:has(#editor.ed) body{overflow:hidden}
.tb{position:sticky;top:0;z-index:3;background:#D3D9E6e8;backdrop-filter:blur(6px);margin:0 -16px;padding:14px 16px 8px;border-bottom:1px solid #c3cadb}
.pg{background:linear-gradient(90deg,#f1f3f8 0,#f1f3f8 34px,#fff 34px);max-width:794px;min-height:1123px;margin:10px auto 40px;padding:48px 56px;box-shadow:0 2px 14px #0003;font-size:16px;line-height:var(--lh,1.35);font-family:Arial,"Helvetica Neue",Helvetica,sans-serif}
@media(max-width:700px){.pg{padding:20px 14px 20px 44px;min-height:80vh}}
.le{outline:none;min-height:400px}.ln{white-space:pre-wrap;min-height:1.35em}
.ln [data-k]{font-weight:700;color:#b3261e}
.fl{overflow-x:auto}.fl .ln{white-space:pre}
.rib{display:flex;flex-wrap:wrap;gap:4px;align-items:center;margin-bottom:6px}.rib .sp{width:1px;height:24px;background:#9aa3bf;margin:0 4px}
.rib button,.pp button{padding:6px 9px;min-width:34px}.rib select,.rib input{padding:6px;max-width:170px}.rib .bi{font-family:Georgia,serif}
.rib .cs{width:22px;height:22px;border-radius:5px;border:2px solid #fff;box-shadow:0 0 0 1px #9aa3bf;padding:0;min-width:0}
.rib button.on,.pp button.on{background:#1F2A4D;color:#fff;box-shadow:0 0 0 2px #C58A2B}.cnt{margin-left:auto;font-size:12px;color:#4b5575;font-weight:600}
.tb .top{align-items:center;margin-bottom:10px}.tb #ti{flex:1 1 220px;min-width:150px;font-weight:700;font-size:16px}.tb #al{flex:0 1 190px;min-width:0}.tb .et .box{min-width:150px}
.tb .acc{margin-left:auto;display:flex;gap:8px}
/* Herramientas ocultas: solo queda una barra fina con Letra/Acordes, Guardar y el botón para mostrar */
#editor.plegada .tb{display:flex;align-items:center;gap:8px;padding-top:8px;padding-bottom:8px}
#editor.plegada .tb .top{order:2;margin:0;flex:none;flex-wrap:nowrap}
#editor.plegada .tabs{order:1;flex:1;margin:0;flex-wrap:nowrap}
#editor.plegada .tabs .der{width:auto;margin-left:auto}
#editor.plegada #ti,#editor.plegada #al,#editor.plegada .et,#editor.plegada .tb .top>.dd,#editor.plegada #no,#editor.plegada #zm,#editor.plegada #cnt{display:none!important}
#editor.plegada .tb .acc{width:auto;margin:0}
@media(max-width:760px){.tb{padding:10px 8px 6px;margin:0 -8px}.tb .top{gap:6px}.tb #al{flex:1 1 140px}.tb .et{flex:1 1 160px}.tb .et .box{min-width:0;width:100%}.tb .acc{width:100%}.tb .acc button{flex:1}
  .rib{flex-wrap:nowrap;overflow-x:auto;padding-bottom:4px;-webkit-overflow-scrolling:touch;scrollbar-width:thin}.gr{flex:none}.tabs .der{margin-left:0;width:100%;justify-content:space-between}#editor.ed{padding:0 8px 8px}}
.gr{display:flex;align-items:center;gap:4px;padding:5px 8px 16px;border:1px solid #B9C1D6;border-radius:var(--r-m);position:relative;background:#E6EAF3}
.gr::after{content:attr(data-g);position:absolute;bottom:1px;left:0;right:0;text-align:center;font-size:10.5px;color:#4b5575;font-weight:700}
.rib{gap:8px}.rib button,.pp button{padding:3px 7px;min-width:32px;height:32px;min-height:0;border-radius:var(--r-s)}.rib select,.pp select{padding:3px 6px;height:32px;min-height:0;border-radius:var(--r-s)}.rib input[type=text]{padding:3px 6px;height:32px;min-height:0;border-radius:var(--r-s)}
.dd{position:relative;display:inline-block}.szb{position:relative;display:inline-block}.rib .szb input{width:68px;padding-right:26px}.rib .szb button{position:absolute;right:2px;top:2px;bottom:2px;height:auto;width:24px;min-width:0;padding:0;background:transparent;border:0;box-shadow:none}.rib .szb button:hover{background:#0000000d}
.pp{position:absolute;top:100%;left:0;z-index:9;background:#fff;border:1px solid var(--linea);border-radius:var(--r-m);box-shadow:var(--sombra-2);padding:10px;min-width:170px;margin-top:4px}.pp[hidden]{display:none}

.pp.tamb{min-width:72px;max-height:260px;overflow:auto;padding:4px;background:#fff}
.pp.tamb button{display:block;width:100%;height:auto;min-width:0;padding:5px 12px;background:#fff;color:#1d2233;border:0;box-shadow:none;border-radius:6px;text-align:left;font-weight:500}
.pp.tamb button.actual{background:#e1e6f2;font-weight:700}
.pp.tamb button:hover,.pp.tamb button.actual:hover{background:#1F2A4D;color:#fff}

.pal{display:grid;grid-template-columns:repeat(6,26px);gap:6px}.rib .pal button,.pp .pal button{width:26px;height:26px;padding:0;min-width:0;border-radius:6px;border:2px solid #fff;box-shadow:0 0 0 1px #9aa3bf}
.pie{display:flex;gap:6px;margin-top:8px;align-items:center}.mas{display:inline-flex;align-items:center;gap:6px;padding:4px 8px;border-radius:8px;cursor:pointer;font-size:13px;font-weight:600}.mas input{width:24px;height:24px;padding:0;border:0;background:none}
.ia{font-weight:800;font-size:14px;line-height:1}.cb{display:block;width:16px;height:4px;border-radius:2px;margin-top:2px}.rib .dd>button{flex-direction:column;gap:0}
.menuAa{display:grid;gap:4px}.menuAa button{justify-content:flex-start}
.tonbox{width:270px}.tr1{display:flex;gap:6px;margin-bottom:8px;flex-wrap:wrap}.tinfo{font-size:12px;color:#4b5575;margin:6px 0 4px;font-weight:600}
.keys{display:grid;grid-template-columns:repeat(4,1fr);gap:6px}.kq{padding:6px 0;min-width:0;background:#e1e6f2;color:#1F2A4D}.kq.on{background:#1F2A4D;color:#fff}.kq.or{box-shadow:0 0 0 2px #C58A2B}
.tabs{display:flex;align-items:center;gap:6px;margin:6px 0 2px;flex-wrap:wrap}.tabs .der{margin-left:auto;display:flex;align-items:center;gap:8px}.tabs select,.tabs button{height:34px;min-height:0;padding-top:3px;padding-bottom:3px}
.btnk{color:#b3261e;font-size:18px;line-height:1}.on .btnk{color:#fff}
.blq{margin:10px 0}.blq b{color:#b3261e}.it{border-left:4px solid #c58a2b;padding-left:8px}
.et{position:relative;display:inline-flex;gap:4px}.et .box{display:flex;flex-wrap:wrap;gap:4px;align-items:center;border:1px solid #c3cae0;background:#fff;border-radius:10px;padding:6px 8px;min-width:240px}.et .box input{border:0;outline:none;min-width:120px;flex:1;padding:2px;background:transparent}.et .box input::placeholder{color:#1d2233;opacity:1;font-weight:600}
.et .box{padding:3px 34px 3px 8px;min-height:40px}.et .box input{min-height:0;box-shadow:none}
.et #eta{position:absolute;right:3px;top:3px;bottom:3px;width:30px;min-width:0;padding:0;background:transparent;color:#1d2233}
.et #eta:hover{background:#e1e6f2}
.et .lista label{border-radius:8px;cursor:pointer}
.et .lista label:hover{background:#e1e6f2}
.et .lista label:has(input:checked){background:#1F2A4D;color:#fff}
.et:has(.lista:not([hidden])) #eta{background:#1F2A4D;color:#fff}
.et .lista{min-width:240px;position:absolute;top:100%;left:0;background:#fff;box-shadow:0 2px 10px #0003;border-radius:10px;padding:6px;z-index:5;max-height:260px;overflow:auto;white-space:nowrap}.et .lista label{display:block;padding:3px 6px}`;
document.head.append(st);

// ---------- HERRAMIENTAS DE TEXTO (no dependen del editor abierto) ----------
// Una línea es {r:[tramos], s?, a?, n?}. Un tramo es {t:'texto', k,b,i,u,x,c,h,s}.
//   k = acorde, b/i/u/x = negrita/cursiva/subrayado/tachado, c = color, h = resaltado,
//   s = tamaño propio del tramo (solo si es distinto del tamaño de su línea).
const TAM=16,ROJO='#b3261e',DEFC='#1d2233',FMT=['b','i','u','x','c','h','s'];
const TAMS=[8,10,12,14,16,18,20,22,24,28,32,36,40,48,60];
const px=l=>l.s||TAM;                                   // tamaño base de una línea
const lim=z=>Math.max(6,Math.min(120,z));
const pick=r=>{const o={};for(const k in r)if(k!=='t'&&r[k]!=null)o[k]=r[k];return o};   // el formato de un tramo (todo menos el texto)
const aChars=l=>l.r.flatMap(r=>[...r.t].map(ch=>({ch,...pick(r)})));   // una línea como lista de letras (puntos de código), cada una con su formato
// comp: junta letras vecinas con el mismo formato en tramos. Las claves van ordenadas para que dos líneas iguales den el mismo JSON.
const comp=cs=>{
  const out=[];let ult=null,clave='';
  for(const c of cs){
    const {ch,...f}=c,o={};
    Object.keys(f).sort().forEach(k=>{if(f[k]!=null&&f[k]!==false)o[k]=f[k]});
    const cl=JSON.stringify(o);
    if(ult&&cl===clave)ult.t+=ch;else{ult={...o,t:ch};clave=cl;out.push(ult)}
  }
  return out;
};
const linea=(r,s,a,n)=>({r,...(s&&s!==TAM?{s}:{}),...(a?{a}:{}),...(n?{n}:{})});   // arma una línea con las claves siempre en el mismo orden
// armar: reconstruye una línea desde sus letras. Si todas miden lo mismo, el tamaño pasa a la línea; si no, quedan tamaños por tramo.
const armar=(l,chars)=>{
  const base=px(l);let z=l.s;
  if(chars.length){
    const sz=new Set(chars.map(c=>c.s||base));
    if(sz.size===1){z=[...sz][0];chars.forEach(c=>{delete c.s})}
    else chars.forEach(c=>{if(c.s===base)delete c.s});
  }
  return linea(comp(chars),z,l.a,l.n);
};
const mapaCp=t=>{const m=[];let cp=0;for(let i=0;i<t.length;){const w=t.codePointAt(i)>0xFFFF?2:1;for(let k=0;k<w;k++)m[i+k]=cp;i+=w;cp++}return m};   // posición en unidades UTF-16 → posición en letras (emojis cuentan 1)
const recorta=ls=>{const o=[...ls];while(o.length>1&&!o[o.length-1].r.length)o.pop();return o};   // quita líneas vacías del final

// ---------- LA FUNCIÓN PRINCIPAL ----------
export function abrir(s,alCerrar,opc={}){
  if(ed)forzarCierre();
  const soloLectura=!!opc.soloLectura;                       // true = nadie guarda nada desde esta ventana
  const A=E.albumes.filter(puedeEditarAlbum),T=E.etiquetas;   // álbumes donde se puede mover esta canción (el suyo ya está permitido) y etiquetas
  ed={titulo:'',tono:'',tonoAct:'',etiquetas:[],acordes:{},ac:null,cc:{},intro:'',interludios:[],final:null,fuente:'',fuenteA:'',lh:0,...structuredClone(s)};
  if(!ed.tonoAct)ed.tonoAct=ed.tono;
  ed.albumId=ed.albumId||A[0]?.id;
  ed.lineas=structuredClone(s.lineas||(s.letra||'').split('\n').map(t=>({r:t?[{t}]:[]}))).map(l=>armar(l,aChars(l)));
  if(!ed.ac){ed.ac={};for(const l in ed.acordes){let f='';[...ed.acordes[l]].sort((a,b)=>a.i-b.i).forEach(a=>{f=f.padEnd(a.i,' ')+(f.length>a.i?' ':'')+a.c});ed.ac[l]=f}}
  let modo='letra',verEt=false,eq='',rango=null,rangoCol=null,modoAcorde=false,pincel=null,pend=null,zoom=100,plegada=false,popAb=null,uc='#B3261E',uh='#FFF176',ancla=null,inicial='',base='';
  // rango: la última selección hecha dentro de la hoja (con o sin texto). pend: formato «pendiente» para lo que escribas sin selección.
  const ov=document.createElement('div');ov.id='editor';ov.className='ed';document.body.append(ov);
  const nom=i=>T.find(t=>t.id===i)?.nombre||'';
  const filtra=()=>T.filter(t=>t.nombre.toLowerCase().includes(eq.toLowerCase()));
  const listaEt=()=>filtra().map(t=>`<label><input type="checkbox" value="${t.id}" ${ed.etiquetas.includes(t.id)?'checked':''}> ${esc(t.nombre)}</label>`).join('')||'<small style="padding:6px;display:block;color:#6b7390">No hay etiquetas con ese nombre</small>';
  const resumen=()=>{const n=ed.etiquetas.map(nom).filter(Boolean);return n.length?(n.length>1?'Varios':n[0]):'Sin etiqueta'};
  const refEt=()=>{const i=$('#eq',ov),l=ov.querySelector('.lista');if(i)i.placeholder=resumen();if(l)l.innerHTML=listaEt()};
  const alterna=(id,on)=>{ed.etiquetas=on?[...new Set([...ed.etiquetas,id])]:ed.etiquetas.filter(x=>x!==id);refEt()};
  // ================= 1. HERRAMIENTAS BÁSICAS =================
  // est: el CSS de un tramo. fin: la lista de letras de lo leído en pantalla.
  // OJO: el rojo y la negrita de los acordes los pone el CSS (.ln [data-k]), NO el estilo en línea.
  // Así, al releer la hoja no se «pegan» como formato real y el acorde se puede desmarcar.
  const AL=['center','right','justify'];
  const est=r=>(r.b?'font-weight:700;':'')+(r.i?'font-style:italic;':'')+((r.u||r.x)?'text-decoration:'+[r.u&&'underline',r.x&&'line-through'].filter(Boolean).join(' ')+';':'')+(OKC.test(r.c||'')?'color:'+r.c+';':'')+(OKC.test(r.h||'')?'background-color:'+r.h+';':'')+(r.s?'font-size:'+r.s+'px;':'');
  // Solo pueden ser acorde las letras A-G y el # o b que va pegado a una de ellas (el bemol/sostenido es parte de la nota).
  // También se limpia el rojo/negrita «pegado» de versiones anteriores.
  const fin=r=>{
    const cs=[];let raizK=false;
    for(const x of r)for(const ch of x.t){
      const o={ch,...pick(x)};
      if(o.k){delete o.b;if(o.c&&colorOk(o.c)===ROJO)delete o.c}
      raizK=!!o.k&&/[A-G]/.test(ch);cs.push(o);
    }
    return comp(cs);
  };
  const lineasDe=()=>modo==='letra'?ed.lineas:ed.lineasA;           // las líneas de la hoja que estás viendo
  const ponerLineas=l=>{if(modo==='letra')ed.lineas=l;else ed.lineasA=l};

  // ================= 2. HISTORIAL (Deshacer / Rehacer) =================
  // punto() guarda una «foto» del estado cada vez que algo cambia. Deshacer vuelve a la foto anterior.
  const hist=[],fut=[];
  const snap=()=>JSON.stringify({l:ed.lineas,a:ed.lineasA,t:ed.tonoAct});
  const punto=()=>{if(!ed)return;leer();const x=snap();if(x!==base){hist.push(base);if(hist.length>80)hist.shift();base=x;fut.length=0}};
  let reloj=null;
  const programaPunto=()=>{clearTimeout(reloj);reloj=setTimeout(()=>{if(ed)punto()},500)};   // guarda la foto medio segundo después de dejar de escribir
  const aplicaH=x=>{const o=JSON.parse(x);ed.lineas=o.l;ed.lineasA=o.a;ed.tonoAct=o.t;pend=null;pinta()};
  const deshacer=()=>{punto();if(!hist.length)return;fut.push(base);base=hist.pop();aplicaH(base)};
  const rehacer=()=>{punto();if(!fut.length)return;hist.push(base);base=fut.pop();aplicaH(base)};
  const snapFull=()=>JSON.stringify({t:ed.titulo,a:ed.albumId,e:[...ed.etiquetas].sort(),l:ed.lineas,la:ed.lineasA,to:ed.tono,ta:ed.tonoAct,fu:ed.fuente,fa:ed.fuenteA,lh:ed.lh});

  // ================= 3. TONALIDAD =================
  // Solo mayores o solo menores, según el tono original. Transpone los acordes marcados con el botón «Ac».
  const raiz=k=>k.replace(/m$/,''),esMenor=k=>/m$/.test(k),nomTono=(i,m)=>(m?MEN:MAY)[((i%12)+12)%12];
  const cambiaTono=d=>{
    if(!ed.tono)return;
    const nuevo=nomTono(ix(raiz(ed.tonoAct||ed.tono))+d,esMenor(ed.tono));
    punto();                                 // guarda lo anterior para poder deshacer
    ed.tonoAct=nuevo;                        // el tono nuevo se asigna ANTES de dibujar, así el botón y el panel ya lo muestran
    transponer(d,usaSostenidos(nuevo));      // siempre se transponen TODOS los acordes marcados de la hoja
    punto();
  };
  const irATono=k=>{const d=((ix(raiz(k))-ix(raiz(ed.tonoAct||ed.tono)))%12+12)%12;if(d)cambiaTono(d)};
  const refTono=()=>{
    const p=ov.querySelector('.tonbox'),act=ed.tonoAct||ed.tono;
    const b=$('#tonb',ov);if(b)b.innerHTML='Tonalidad'+(act?' \u00b7 <b>'+esc(act)+'</b>':'');
    if(!p)return;
    const sq=l=>l.map(k=>`<button class="fb kq${k===act?' on':''}${k===ed.tono?' or':''}" data-tk="${k}" ${k===ed.tono?'title="Tono original"':''}>${k}</button>`).join('');
    p.innerHTML=ed.tono?`<div class="tr1"><button class="sec fb" data-tt="-2">-1</button><button class="sec fb" data-tt="-1">-\u00bd</button><button class="sec fb" data-tt="1">+\u00bd</button><button class="sec fb" data-tt="2">+1</button></div>
      <div class="tr1"><button class="sec fb" data-tv>Volver al original</button>${soloLectura?'':'<button class="sec fb" data-tf>Fijar como original</button>'}</div>
      <div class="tinfo">Original: <b>${esc(ed.tono)}</b> \u00b7 Actual: <b>${esc(act)}</b></div><div class="keys">${sq(esMenor(ed.tono)?MEN:MAY)}</div>${soloLectura?'':'<button class="lnk fb" data-tr>Cambiar tono original</button>'}`
      :`<div class="tinfo">\u00bfEn qu\u00e9 tono est\u00e1n escritos los acordes?</div><div class="tinfo">Mayores</div><div class="keys">${sq(MAY)}</div><div class="tinfo">Menores</div><div class="keys">${sq(MEN)}</div>`;
  };
    const marcaTam=()=>{const v=parseFloat($('#sz',ov).value);ov.querySelectorAll('[data-pp="sz"] button').forEach(x=>x.classList.toggle('actual',+x.dataset.f.split(':')[1]===v))};   // resalta en la lista el tamaño actual
  const cierraPop=()=>{if(popAb){popAb=null;ov.querySelectorAll('.pp').forEach(x=>x.hidden=true)}};
  // Los desplegables viven en .tb (no dentro de .rib) para que en móvil, donde .rib se desplaza, no queden recortados.
  const colocaPop=n=>{
    const tb=ov.querySelector('.tb'),p=ov.querySelector(`.pp[data-pp="${n}"]`),b=ov.querySelector(`[data-pop="${n}"]`);
    if(!tb||!p||!b)return;
    const T0=tb.getBoundingClientRect(),B=b.getBoundingClientRect();
    p.style.top=(B.bottom-T0.top)+'px';
    p.style.left=Math.max(4,Math.min(B.left-T0.left,T0.width-p.offsetWidth-4))+'px';
  };

  // ================= 4. LEER Y PEGAR =================
  // Convierte lo escrito en la hoja (un <div> por línea) en líneas con formato.
  // El tamaño de un tramo solo se guarda si es distinto del de su línea.
  const leerDom=root=>{
    const out=[];let cur=[],L={},vivo=false,sb={};
    const fin2=()=>{out.push(linea(fin(cur),L.s,L.a,L.n));cur=[];L={...sb};vivo=false};
    const w=(n,sty,k)=>{
      if(n.nodeType===3){
        const t=n.data.replace(/\u00a0/g,' ');
        if(t){if(!L.s&&k.s)L.s=k.s;const o={...sty,t};if(k.s&&L.s&&k.s!==L.s)o.s=k.s;cur.push(o);vivo=true}
        return}
      if(n.nodeType!==1)return;
      if(n.nodeName==='BR'){fin2();return}
      const q={...sty},cs=n.style,blk=/^(DIV|P)$/.test(n.nodeName),td=cs.textDecoration+cs.textDecorationLine,fw=cs.fontWeight;
      if(/^(B|STRONG)$/.test(n.nodeName)||fw==='bold'||+fw>=600)q.b=1;else if(fw==='normal'||fw==='400')delete q.b;
      if(/^(I|EM)$/.test(n.nodeName)||cs.fontStyle==='italic')q.i=1;else if(cs.fontStyle==='normal')delete q.i;
      if(n.dataset&&n.dataset.k)q.k=1;                       // letra marcada como acorde
      if(n.nodeName==='U'||/underline/.test(td))q.u=1;
      if(/^(S|STRIKE|DEL)$/.test(n.nodeName)||/line-through/.test(td))q.x=1;
      if(/none/.test(td)&&!/underline|line-through/.test(td)){delete q.u;delete q.x}
      if(OKC.test(cs.color)){if(colorOk(cs.color)===DEFC)delete q.c;else q.c=cs.color}
      const bg=cs.backgroundColor;if(bg){if(OKC.test(bg)&&!/,\s*0\)$/.test(bg))q.h=bg;else delete q.h}
      const k2=blk?{s:parseFloat(cs.fontSize)||k.s,a:AL.includes(cs.textAlign)?cs.textAlign:k.a,n:(n.dataset&&+n.dataset.n)||k.n}:{...k,s:parseFloat(cs.fontSize)||k.s};
      const sv=sb;
      if(blk){if(vivo)fin2();sb=k2;L={...k2}}
      n.childNodes.forEach(c=>w(c,q,k2));
      if(blk){if(vivo)fin2();sb=sv;L={...sb}}
    };
    w(root,{},{});
    if(vivo||!out.length)fin2();
    return out;                                              // las líneas vacías del final se conservan; se recortan solo al guardar
  };
  const leer=()=>{const le=$('#le',ov);if(le)ponerLineas(leerDom(le))};   // lee lo que hay en pantalla y lo guarda en la hoja actual

  // Al pegar: conserva negrita, cursiva, subrayado, tachado, color, resaltado y tamaño
  const limpiaHtml=html=>{
    const d=new DOMParser().parseFromString(html,'text/html'),out=[];
    const w=(n,st)=>{
      if(n.nodeType===3){const t=n.data.replace(/[\r\n\t]+/g,' ').replace(/\u00a0/g,' ');if(!t)return;if(!t.trim()&&(!out.length||out[out.length-1].br))return;out.push({...st,t});return}
      if(n.nodeType!==1)return;
      const nm=n.nodeName;if(/^(SCRIPT|STYLE|META|LINK|HEAD|TITLE|NOSCRIPT)$/.test(nm))return;
      if(nm==='BR'){out.push({br:1});return}
      const cs=n.style||{},q={...st},td=(cs.textDecoration||'')+(cs.textDecorationLine||''),fw=cs.fontWeight,esK=!!(n.dataset&&n.dataset.k);
      if(n.dataset&&n.dataset.k)q.k=1;
      // en un acorde, la negrita y el rojo vienen del propio acorde (al copiar, el navegador los añade en línea): no son formato del usuario
      if(!esK&&(/^(B|STRONG)$/.test(nm)||fw==='bold'||+fw>=600))q.b=1;
      if(/^(I|EM)$/.test(nm)||cs.fontStyle==='italic')q.i=1;
      if(nm==='U'||/underline/.test(td))q.u=1;
      if(/^(S|STRIKE|DEL)$/.test(nm)||/line-through/.test(td))q.x=1;
      const c=colorOk(cs.color||(n.getAttribute&&n.getAttribute('color')));if(c&&c!=='#000000'&&c!==DEFC&&!(esK&&c===ROJO))q.c=c;
      const bg=colorOk(cs.backgroundColor);if(bg&&bg!=='#ffffff')q.h=bg;
      const fs=cs.fontSize||'';if(/pt$/.test(fs))q.s=Math.round(parseFloat(fs)*4/3);else if(/px$/.test(fs))q.s=Math.round(parseFloat(fs));
      const blk=/^(DIV|P|LI|H[1-6]|TR|TABLE|UL|OL|BLOCKQUOTE|PRE)$/.test(nm);
      if(blk&&out.length&&!out[out.length-1].br)out.push({br:1});
      n.childNodes.forEach(x=>w(x,q));
      if(blk&&out.length&&!out[out.length-1].br)out.push({br:1});
    };
    w(d.body,{});
    while(out.length&&out[out.length-1].br)out.pop();
    return out.map(x=>x.br?'<br>':`<span ${x.k?'data-k="1" ':''}style="${est(x)}">${esc(x.t)}</span>`).join('');
  };

  // ================= 5. FORMATO =================
  // fmt(p,v) aplica un formato a lo seleccionado. p dice cuál:
  //   b i u = negrita, cursiva, subrayado     c h = color y resaltado     s s+ s- = tamaño
  //   a = alineación     n = sangría     case = mayúsculas     k = acorde (botón «Ac»)
  //   undo redo = deshacer y rehacer     clear = borrar formato     pincel = copiar formato
  //
  // Cómo funciona: captura() lee la hoja y la selección como (línea, letra). aplicaFormato() cambia
  // SOLO esas letras en el modelo, repintaHoja() redibuja la hoja y ponSel() devuelve la selección.
  const rangoActual=()=>{                                   // la selección viva si está en la hoja; si no, la última que hubo
    const le=$('#le',ov);if(!le)return null;
    const x=getSelection();
    if(x.rangeCount&&le.contains(x.getRangeAt(0).commonAncestorContainer))return x.getRangeAt(0);
    return rango&&le.contains(rango.commonAncestorContainer)?rango:null;
  };
  const haySel=()=>{const r=rangoActual();return !!r&&!r.collapsed};   // ¿hay texto seleccionado en la hoja?
  const MA='\uE000',MB='\uE001';
  const ruta=(n,raiz0)=>{const r=[];while(n&&n!==raiz0){const p=n.parentNode;r.unshift([...p.childNodes].indexOf(n));n=p}return r};
  const porRuta=(raiz0,r)=>r.reduce((n,i)=>n&&n.childNodes[i],raiz0);
  // captura: sincroniza el modelo con lo que hay escrito y devuelve la selección como {a:{l,c}, b:{l,c}}
  // (l = número de línea, c = número de letra). Pone marcas invisibles en una COPIA de la hoja, así funciona
  // aunque el DOM esté «raro» (por ejemplo tras pegar) y no toca lo que ves.
  function captura(){
    const le=$('#le',ov),r=rangoActual();if(!le||!r)return null;
    const hijos=[...le.children];if(!hijos.length)return null;
    const aj=(n,o,ini)=>{
      if(n===le){
        if(ini)return o<hijos.length?[hijos[o],0]:[hijos[hijos.length-1],hijos[hijos.length-1].childNodes.length];
        return o>0?[hijos[o-1],hijos[o-1].childNodes.length]:[hijos[0],0];
      }
      if(n.nodeType===1&&o>0&&o===n.childNodes.length&&n.childNodes[o-1].nodeName==='BR')return [n,o-1];
      return [n,o];
    };
    const [sn,so]=aj(r.startContainer,r.startOffset,true),[en,eo]=aj(r.endContainer,r.endOffset,false);
    const cl=le.cloneNode(true),S=porRuta(cl,ruta(sn,le)),F=porRuta(cl,ruta(en,le));
    if(!S||!F)return null;
    const mk=(n,o,ch)=>{const q=document.createRange();q.setStart(n,o);q.collapse(true);q.insertNode(document.createTextNode(ch))};
    mk(F,eo,MB);if(!r.collapsed)mk(S,so,MA);
    let pa=null,pb=null;
    const out=leerDom(cl).map((l,i)=>{
      const chars=aChars(l);let toco=false;
      for(let j=chars.length-1;j>=0;j--){
        if(chars[j].ch===MB){pb={l:i,c:j};chars.splice(j,1);toco=true}
        else if(chars[j].ch===MA){pa={l:i,c:j};chars.splice(j,1);toco=true}
      }
      return toco?linea(comp(chars),l.s,l.a,l.n):l;
    });
    if(pa&&pb&&pa.l===pb.l)pb.c-=1;                         // la marca de inicio ya no está antes de la de fin
    ponerLineas(out);
    if(!pa&&!pb)return null;
    return {a:pa||pb,b:pb||pa};
  }
  const domPos=(ln,c)=>{                                    // (línea del DOM, letra) → (nodo de texto, posición)
    const tw=document.createTreeWalker(ln,NodeFilter.SHOW_TEXT);let n,acum=0,ult=null;
    while(n=tw.nextNode()){const cp=[...n.data];if(acum+cp.length>=c)return [n,cp.slice(0,c-acum).join('').length];acum+=cp.length;ult=n}
    return ult?[ult,ult.data.length]:[ln,0];
  };
  const ponSel=(a,b)=>{                                     // devuelve la selección a la hoja recién dibujada
    const le=$('#le',ov);if(!le||!a)return;
    const lns=[...le.children],p=lns[a.l],f=lns[(b||a).l];if(!p||!f)return;
    const i=domPos(p,a.c),z=domPos(f,(b||a).c);
    le.focus({preventScroll:true});
    const r=document.createRange();r.setStart(i[0],i[1]);r.setEnd(z[0],z[1]);
    const x=getSelection();x.removeAllRanges();x.addRange(r);rango=r.cloneRange();
  };
  const repintaHoja=()=>{const le=$('#le',ov);if(!le)return;le.innerHTML=hojaHtml();cnt()};   // redibuja solo la hoja (la barra no se toca)
  const recompone=()=>{const S=captura();if(!S)return;repintaHoja();ponSel(S.a,S.b)};          // deja el DOM limpio (una línea = un div)
  const posCaret=()=>{const r=rangoActual();if(!r||!r.collapsed)return null;const ln=lineaDe(r.startContainer);return ln?{ln,pos:desplazamiento(ln,r.startContainer,r.startOffset)}:null};
  const copiaFmt=(c,l)=>{const o={};FMT.forEach(k=>{if(c[k]!=null)o[k]=c[k]});o.s=c.s||px(l);return o};   // el formato de una letra (para el pincel)

  function fmt(p,v){fmtInterno(p,v);if(p!=='undo'&&p!=='redo')programaPunto();marcarBotones()}
  function fmtInterno(p,v){
    if(p==='undo')return deshacer();
    if(p==='redo')return rehacer();
    if(p==='k')return botonAcorde();
    punto();                                                // guarda el estado antes de cambiarlo (para poder deshacer)
    aplicaFormato(p,v);
  }
  function aplicaFormato(p,v){
    const S=captura();if(!S)return;                         // sin hoja o sin cursor, no hay nada que formatear
    const ls=lineasDe(),{a,b}=S,colapsada=a.l===b.l&&a.c===b.c;
    const filas=[];
    for(let i=a.l;i<=b.l&&i<ls.length;i++){const chars=aChars(ls[i]);filas.push({i,chars,ini:i===a.l?a.c:0,fin:i===b.l?b.c:chars.length})}
    if(!filas.length)return;
    const sel=filas.flatMap(f=>f.chars.slice(f.ini,f.fin));   // las letras seleccionadas (mismos objetos que en filas)
    const hecho=()=>{ponerLineas(ls);repintaHoja();ponSel(a,b)};

    // --- de párrafo: alineación y sangría (afectan a las líneas tocadas) ---
    if(p==='a'||p==='n'){
      const ult=filas[filas.length-1];
      filas.forEach(f=>{
        if(!colapsada&&f===ult&&filas.length>1&&b.c===0&&f.chars.length>0)return;   // la selección solo roza el principio de la última línea
        const l=ls[f.i];
        ls[f.i]=p==='a'?linea(l.r,l.s,v==='left'?undefined:v,l.n):linea(l.r,l.s,l.a,Math.max(0,Math.min(8,(l.n||0)+ +v)));
      });
      return hecho();
    }

    // --- sin selección: el formato queda pendiente para lo que escribas ---
    if(colapsada){
      const f=filas[0],l=ls[f.i];
      if(p==='pincel'){pincel=pincel?null:copiaFmt(f.chars[f.ini-1]||f.chars[f.ini]||{},l);return}
      if(!['b','i','u','c','h','s','s+','s-'].includes(p))return;
      if(p[0]==='s'&&!f.chars.length){                      // línea vacía: el tamaño se lo pones a la línea
        ls[f.i]=linea(l.r,p==='s'?lim(+v):lim(px(l)+(p==='s+'?2:-2)),l.a,l.n);return hecho()}
      const ref=f.chars[f.ini-1]||f.chars[f.ini]||{};       // al escribir se hereda el formato de la letra anterior
      const nf=pend?{...pend.f}:Object.fromEntries(FMT.filter(k=>ref[k]!=null).map(k=>[k,ref[k]]));
      if(p==='b'||p==='i'||p==='u'){if(nf[p])delete nf[p];else nf[p]=1}
      else if(p==='c'){const cv=v==='auto'?null:colorOk(v);if(!cv||cv===DEFC)delete nf.c;else nf.c=cv}
      else if(p==='h'){const hv=v==='none'?null:colorOk(v);if(hv)nf.h=hv;else delete nf.h}
      else nf.s=p==='s'?lim(+v):lim((nf.s||ref.s||px(l))+(p==='s+'?2:-2));
      const pos=posCaret();if(pos)pend={f:nf,ln:pos.ln,c:pos.pos};
      return;
    }

    // --- con selección: se cambian SOLO las letras seleccionadas ---
    if(p==='b'||p==='i'||p==='u'||p==='x'){
      const cand=sel.filter(c=>!c.k),ref=cand.length?cand:sel,todos=ref.length>0&&ref.every(c=>c[p]);   // si todas ya lo tienen, se quita
      sel.forEach(c=>{if(todos)delete c[p];else c[p]=1});
    }
    else if(p==='c'){const cv=v==='auto'?null:colorOk(v);sel.forEach(c=>{if(!cv||cv===DEFC)delete c.c;else c.c=cv})}
    else if(p==='h'){const hv=v==='none'?null:colorOk(v);sel.forEach(c=>{if(hv)c.h=hv;else delete c.h})}
    else if(p==='s'||p==='s+'||p==='s-'){
      const nuevo=cur=>p==='s'?lim(+v):lim(cur+(p==='s+'?2:-2));
      filas.forEach(f=>{
        const l=ls[f.i];
        if(!f.chars.length){ls[f.i]=linea(l.r,nuevo(px(l)),l.a,l.n);return}   // línea vacía dentro de la selección
        for(let j=f.ini;j<f.fin;j++){const c=f.chars[j];c.s=nuevo(c.s||px(l))}
      });
    }
    else if(p==='case'){
      const may=ch=>{const u=ch.toUpperCase();return [...u].length===1?u:ch},men=ch=>{const u=ch.toLowerCase();return [...u].length===1?u:ch};
      filas.forEach(f=>{for(let j=f.ini;j<f.fin;j++){
        const c=f.chars[j];if(c.k)continue;                 // los acordes siempre van en mayúscula
        const prev=j>0?f.chars[j-1].ch:'';
        c.ch=v==='up'?may(c.ch):v==='low'?men(c.ch):(!prev||/[\s\u00bf\u00a1(]/.test(prev)?may(c.ch):men(c.ch));
      }});
    }
    else if(p==='clear'){                                   // quita el formato de lo seleccionado (el acorde se quita con «Ac»)
      filas.forEach(f=>{
        const l=ls[f.i];
        if(!f.chars.length){ls[f.i]=linea(l.r,undefined,l.a,l.n);return}
        for(let j=f.ini;j<f.fin;j++){const c=f.chars[j];FMT.forEach(k=>delete c[k]);c.s=TAM}
      });
    }
    else if(p==='pincel'){
      if(!pincel){pincel=copiaFmt(sel[0]||{},ls[filas[0].i]);return}   // 1.º clic: copia el formato de la primera letra seleccionada
      sel.forEach(c=>{FMT.forEach(k=>delete c[k]);Object.assign(c,pincel)});
      pincel=null;
    }
    else return;
    filas.forEach(f=>{if(f.chars.length)ls[f.i]=armar(ls[f.i],f.chars)});
    hecho();
  }

  // ================= 6. BUSCAR Y REEMPLAZAR =================
  function buscar(){
    const o=modal(`<div class="mh"><h2>Buscar y reemplazar</h2><button class="ic" data-cx aria-label="Cerrar">\u00d7</button></div>
      <label class="fl2">Buscar<input id="fb"></label><label class="fl2" style="margin-top:8px">Reemplazar con<input id="fr"></label>
      <label class="chk"><input type="checkbox" id="fm"> Coincidir may\u00fasculas y min\u00fasculas</label>
      <label class="chk"><input type="checkbox" id="fo"> Tambi\u00e9n en la otra hoja</label>
      <div class="barra"><button class="sec" id="fc">Contar</button><button id="fa">Reemplazar todo</button></div><p id="fs" role="status" style="font-weight:600;margin:0"></p>`);
    const re=()=>{const f=$('#fb',o).value;return f?new RegExp(f.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),$('#fm',o).checked?'g':'gi'):null};
    o.onclick=e=>{
      const b=e.target.closest('button');if(!b)return;
      if(b.dataset.cx!=null){o.remove();return}
      const r=re(),fs=$('#fs',o);if(!r){fs.textContent='Escribe qu\u00e9 buscar.';return}
      leer();const ambas=$('#fo',o).checked;
      if(b.id==='fc')fs.textContent=(ambas?[ed.lineas,ed.lineasA]:[lineasDe()]).reduce((n,ls)=>n+ls.reduce((m,l)=>m+(plano(l).match(r)||[]).length,0),0)+' coincidencias';
      else if(b.id==='fa'){
        punto();const rp=$('#fr',o).value;let n=0;
        const cambiar=ls=>ls.map(l=>{
          const t=plano(l),ms=[...t.matchAll(r)];if(!ms.length)return l;n+=ms.length;
          const ar=l.r.flatMap(x=>x.t.split('').map(ch=>({ch,...pick(x)})));   // aquí se cuenta por unidades UTF-16 porque m.index también
          for(let k=ms.length-1;k>=0;k--){const m=ms[k],fm=ar[m.index]?pick(ar[m.index]):{};ar.splice(m.index,m[0].length,...rp.split('').map(ch=>({ch,...fm})))}
          return armar(l,ar);
        });
        if(ambas){ed.lineas=cambiar(ed.lineas);ed.lineasA=cambiar(ed.lineasA)}else ponerLineas(cambiar(lineasDe()));
        fs.textContent=n+' reemplazos';pinta();punto();
      }
    };
  }
  async function cargarLocales(){
    if(!window.queryLocalFonts){alert('Tu navegador no permite leer las fuentes instaladas. Usa Chrome o Edge en una computadora.');return pinta()}
    try{const f=await window.queryLocalFonts();LOCALES=[...new Set(f.map(x=>x.family))].sort((a,b)=>a.localeCompare(b))}catch(err){alert('No se dio permiso para leer las fuentes del equipo.')}
    if(!ed)return;                                          // si cerraste el editor mientras el navegador pedía permiso, no hay nada que dibujar
    pinta();
  }

  // ================= 7. DIBUJAR LA HOJA =================
  // htmlLinea: el contenido de UNA línea. hojaHtml: todas las líneas de la hoja que estás viendo (o de las que le pases).
  const htmlLinea=l=>l.r.map(r=>`<span ${r.k?'data-k="1" ':''}style="${est(r)}">${esc(r.t)}</span>`).join('')||'<br>';
  const hojaHtml=(ls=lineasDe())=>ls.map(l=>`<div class="ln" data-n="${l.n||0}" style="font-size:${px(l)}px;${l.a?'text-align:'+l.a+';':''}padding-left:${(l.n||0)*28}px">${htmlLinea(l)}</div>`).join('');
  const cnt=()=>{const e=$('#cnt',ov);if(!e)return;const le=$('#le',ov),t=le?le.innerText:lineasDe().map(plano).join('\n'),n=t.trim()?t.trim().split(/\s+/).length:0;e.textContent=n+' palabras \u00b7 '+t.replace(/\n/g,'').length+' caracteres'};
  const optsFuente=()=>{
    const cur=(modo==='letra'?ed.fuente:ed.fuenteA)||'Est\u00e1ndar (Arial)',op=n=>`<option ${n===cur?'selected':''}>${esc(n)}</option>`;
    const todas=[...Object.keys(FIJAS),...PROPOR,...LOCALES];
    return todas.map(op).join('')+(todas.includes(cur)?'':`<option selected>${esc(cur)}</option>`)
      +(window.queryLocalFonts&&!LOCALES.length?'<option value="__local">Cargar fuentes de este equipo...</option>':'');
  };

  // ================= 8. ACORDES =================
  // Un acorde es una letra A-G con la marca «k». Se ve en negrita y rojo (lo pone el CSS), y es lo único que transpone el botón «Tonalidad».
  // Lo que acompaña a la letra (m, 7, sus, #, b...) queda como texto normal.
  // Todas las posiciones se cuentan en LETRAS (un emoji cuenta 1), igual que aChars.
  const lineaDe=nodo=>{const el=nodo&&(nodo.nodeType===3?nodo.parentElement:nodo);return el&&el.closest?el.closest('#le .ln'):null};
  const desplazamiento=(ln,nodo,off)=>{const r=document.createRange();r.selectNodeContents(ln);r.setEnd(nodo,off);return [...r.toString()].length};   // cuántas letras hay antes del cursor en la línea
  function ponerCursor(ln,pos){
    const [n,o]=domPos(ln,pos),r=document.createRange();r.setStart(n,o);r.collapse(true);
    const x=getSelection();x.removeAllRanges();x.addRange(r);
  }

  // Botón «Ac»: con texto seleccionado marca (o desmarca) los acordes; sin selección activa o desactiva el modo «escribir acordes».
  function botonAcorde(){
    if(modo!=='acordes')return;
    if(haySel()){marcarSeleccion();return}
    modoAcorde=!modoAcorde;
    marcarBotones();
    const le=$('#le',ov);if(le)le.focus();
  }
  // marcarBotones: enciende B, I, U, acorde y alineación según el texto donde está el cursor o la selección.
  // mostrarTam: escribe en la casilla de tamaño el tamaño del texto donde está el cursor o la selección.
  const el0=n=>n&&(n.nodeType===3?n.parentElement:n);
  const formatoEn=el=>{
    const cs=getComputedStyle(el);let u=false;
    for(let n=el;n&&n.nodeType===1&&n.id!=='le';n=n.parentElement){if(/underline/.test(getComputedStyle(n).textDecorationLine)){u=true;break}}
    return {b:+cs.fontWeight>=600&&!el.closest('[data-k]'),i:/italic|oblique/.test(cs.fontStyle),u};
  };
  const tamEn=el=>{for(let n=el;n&&n.id!=='le';n=n.parentElement){const f=n.style&&parseFloat(n.style.fontSize);if(f)return f}return TAM};   // tamaño en px de un elemento de la hoja
  function mostrarTam(forzar){
    const sz=$('#sz',ov),le=$('#le',ov);
    if(!sz||!le||(!forzar&&document.activeElement===sz))return;
    const r=rangoActual();
    if(!r){if(forzar)sz.value='';return}
    const v=new Set();
    if(r.collapsed){
      if(pend&&pend.f.s)v.add(pend.f.s);
      else{const n=r.startContainer,hijo=n.nodeType===1&&r.startOffset>0?n.childNodes[r.startOffset-1]:null;v.add(tamEn(el0(hijo&&hijo.nodeType===1?hijo:n)))}
    }else{
      const tw=document.createTreeWalker(le,NodeFilter.SHOW_TEXT);let n;
      while(n=tw.nextNode()){
        if(!r.intersectsNode(n))continue;
        const a=n===r.startContainer?r.startOffset:0,z=n===r.endContainer?r.endOffset:n.data.length;
        if(z>a)v.add(tamEn(n.parentElement));
      }
      if(!v.size)le.querySelectorAll('.ln').forEach(e=>{if(r.intersectsNode(e))v.add(tamEn(e))});   // solo líneas vacías
    }
    const t=[...v].map(x=>Math.round(x*10)/10);
    if(t.length===1){sz.value=t[0];sz.placeholder=String(t[0])}
    else{sz.value='';sz.placeholder=t.length?'\u2013':String(TAM)}
  }
  const marcarBotones=()=>{
    const pg=ov.querySelector('.pg'),le=$('#le',ov);
    if(!pg||!le)return;
    const x=getSelection(),r=x.rangeCount?x.getRangeAt(0):null,enHoja=!!(r&&le.contains(r.commonAncestorContainer));
    const kb=$('[data-f="k"]',ov);
    if(kb)kb.classList.toggle('on',modoAcorde||(enHoja&&!!el0(r.startContainer).closest('[data-k]')));
    const bp=$('[data-f="pincel"]',ov);if(bp)bp.classList.toggle('on',!!pincel);
    if(enHoja){
      const ini=el0(r.startContainer),ln=ini.closest('.ln'),e={b:false,i:false,u:false};
      if(r.collapsed){
        const f=pend?{b:!!pend.f.b,i:!!pend.f.i,u:!!pend.f.u}:formatoEn(ini);   // con formato pendiente, se muestra el pendiente
        e.b=f.b;e.i=f.i;e.u=f.u;
      }else{
        const tw=document.createTreeWalker(le,NodeFilter.SHOW_TEXT);let n,t=0,b=0,i=0,u=0;
        while(n=tw.nextNode()){
          if(!r.intersectsNode(n))continue;
          const a=n===r.startContainer?r.startOffset:0,z=n===r.endContainer?r.endOffset:n.data.length;
          if(z<=a)continue;
          const f=formatoEn(n.parentElement);t++;b+=f.b;i+=f.i;u+=f.u;
        }
        e.b=t>0&&b===t;e.i=t>0&&i===t;e.u=t>0&&u===t;
      }
      const alin=(ln&&ln.style.textAlign)||'left';
      ov.querySelectorAll('.rib [data-f]').forEach(bt=>{
        const f=bt.dataset.f;
        if(f==='b'||f==='i'||f==='u'){bt.classList.toggle('on',e[f]);bt.setAttribute('aria-pressed',String(e[f]))}
        else if(f.startsWith('a:'))bt.classList.toggle('on',f==='a:'+alin);
      });
    }
    mostrarTam();
  };
  // marcarSeleccion: SOLO las letras seleccionadas.
  //  - Si hay acordes sin marcar dentro de la selección, se marcan todos.
  //  - Si ya estaban todos marcados (o lo marcado ya no parece acorde), se desmarcan.
  function marcarSeleccion(){
    punto();
    const S=captura();if(!S)return;
    const ls=lineasDe(),{a,b}=S,trabajo=[];
    for(let i=a.l;i<=b.l&&i<ls.length;i++){
      const chars=aChars(ls[i]),texto=chars.map(c=>c.ch).join(''),m=mapaCp(texto);
      const ini=i===a.l?a.c:0,fi=i===b.l?b.c:chars.length,marcas=new Set();
      for(const t of tokensMarcado(texto))t.marcas.forEach(r=>{      // todas las letras del acorde: nota, bajo, números, símbolos
        const j=m[r];
        if(j>=ini&&j<fi)marcas.add(j);
      });
      trabajo.push({i,chars,ini,fi,marcas:[...marcas]});
    }
    const mc=trabajo.flatMap(w=>w.marcas.map(j=>w.chars[j]));
    const marcadas=trabajo.flatMap(w=>w.chars.slice(w.ini,w.fi)).filter(c=>c.k);
    if(mc.some(c=>!c.k))mc.forEach(c=>{c.k=1});             // falta alguno: se marcan
    else if(marcadas.length)marcadas.forEach(c=>{delete c.k;delete c.b;if(c.c&&colorOk(c.c)===ROJO)delete c.c});   // todos marcados: se desmarcan
    else return;                                            // no hay nada con forma de acorde
    trabajo.forEach(w=>{ls[w.i]=armar(ls[w.i],w.chars)});
    ponerLineas(ls);repintaHoja();ponSel(a,b);              // se vuelve a seleccionar exactamente lo mismo
  }
  // marcarTecleado: lo que escribes recibe el formato pendiente (B/I/U/color/tamaño sin selección) y,
  // en modo «escribir acordes», la letra A-G recién escrita queda como acorde; lo demás, como texto normal.
  function marcarTecleado(e){
    if(e.inputType!=='insertText'||!e.data)return;
    const sel=getSelection();if(!sel.rangeCount||!sel.isCollapsed)return;
    const nodo=sel.anchorNode,off=sel.anchorOffset;
    if(!nodo||nodo.nodeType!==3)return;
    const ln=lineaDe(nodo);if(!ln)return;
    const n=[...e.data].length,pos=desplazamiento(ln,nodo,off),modoK=modo==='acordes';
    if(pos<n||(!pend&&!modoK))return;
    const linea0=leerDom(ln)[0],chars=aChars(linea0);let cambio=false;
    for(let j=pos-n;j<pos;j++){
      const c=chars[j];if(!c)continue;
      const antes=JSON.stringify(c);
      if(pend){FMT.forEach(k=>delete c[k]);Object.assign(c,pend.f)}
      if(modoK){if(modoAcorde&&(/[A-G]/.test(c.ch)||(/[#b]/.test(c.ch)&&j>0&&chars[j-1].k&&/[A-G]/.test(chars[j-1].ch))))c.k=1;else delete c.k}
      if(JSON.stringify(c)!==antes)cambio=true;
    }
    if(pend)pend.c=pos;                                     // el cursor avanzó: el formato pendiente sigue vigente
    if(!cambio)return;
    ln.innerHTML=htmlLinea({r:comp(chars)});
    ponerCursor(ln,pos);
  }
  // transponer(d, sostenidos): sube o baja d semitonos los acordes marcados. Un # o b pegado a la letra cuenta como parte de la nota.
  // Si el nombre del acorde cambia de largo (E → Eb), ajusta los espacios para que los demás acordes no se muevan.
  const transponer=(d,sostenidos)=>{
    const S=captura();if(!S)leer();                         // sincroniza el modelo con lo escrito
    lineasDe().forEach((l,i,ls)=>{
      const {letras,cambio}=transponerChars(aChars(l),d,sostenidos);   // la transposición vive en musica.js (la usa también la ventana Compartir)
      if(cambio)ls[i]=armar(l,letras);
    });
    repintaHoja();refTono();                                // refTono ya ve el tono nuevo (se asignó antes de transponer)
    if(S)ponSel(S.a,S.b);
  };
  // convertirAcordes: si la canción es de la versión anterior, arma la hoja de Acordes con sus acordes, intro, interludios y final.
  function convertirAcordes(){
    const tiene=(ed.ac&&Object.values(ed.ac).some(x=>String(x).trim()))||(ed.intro&&ed.intro.trim())||(ed.interludios&&ed.interludios.some(x=>(x.texto||'').trim()))||(ed.final&&String(ed.final).trim());
    if(!tiene)return [{r:[]}];
    const cols=ed.cc||{};
    const filas=(texto,clave,etiqueta,extra)=>{
      let acum=0;                                           // acum cuenta en unidades UTF-16 (así se guardaron los colores antiguos)
      return String(texto||'').split('\n').map((t,n)=>{
        const marcas=new Set(),m=mapaCp(t);for(const k of tokensAcorde(t))k.raices.forEach(i=>marcas.add(m[i]));
        const chars=(n===0&&etiqueta?[...etiqueta+' '].map(ch=>({ch,b:1})):[]);
        let u=0;
        [...t].forEach((ch,i)=>{const o={ch};if(marcas.has(i))o.k=1;const col=(cols[clave]||[])[acum+u];if(col&&OKC.test(col))o.c=col;chars.push(o);u+=ch.length});
        acum+=t.length+1;
        return {...extra,r:comp(chars)};
      });
    };
    const out=[],n=ed.lineas.length;
    if(ed.intro&&ed.intro.trim())out.push(...filas(ed.intro,'intro','Intro:',{}));
    ed.lineas.forEach((l,i)=>{
      const extra={...(l.s?{s:l.s}:{}),...(l.n?{n:l.n}:{})};
      if(ed.ac&&ed.ac[i]&&String(ed.ac[i]).trim())out.push(...filas(ed.ac[i],'a'+i,'',extra));
      out.push(JSON.parse(JSON.stringify(l)));
      (ed.interludios||[]).filter(x=>x.despues===i&&(x.texto||'').trim()).forEach(x=>out.push(...filas(x.texto,'i:'+x.id,'Interludio:',{})));
    });
    (ed.interludios||[]).filter(x=>(x.despues<0||x.despues>=n)&&(x.texto||'').trim()).forEach(x=>out.push(...filas(x.texto,'i:'+x.id,'Interludio:',{})));
    if(ed.final&&String(ed.final).trim())out.push(...filas(ed.final,'final','Final:',{}));
    return out.length?out:[{r:[]}];
  }

  // ================= 9. DIBUJAR LA BARRA Y LA HOJA (pinta) =================
  // pinta() vuelve a dibujar todo el editor: fila de arriba, barra de formato, pestañas y hoja.
  // Si quieres cambiar un botón de la barra, búscalo aquí con Ctrl+F.
  const pinta=()=>{
    if(!ed)return;
    const pops=[];                                          // los desplegables se dibujan al final de .tb, fuera de .rib (que se desplaza en móvil)
    const pp=(n,body,cls='')=>{pops.push(`<div class="pp ${cls}" data-pp="${n}" ${popAb===n?'':'hidden'}>${body}</div>`);return ''};
    const fb=(f,h,t)=>`<button class="sec fb" data-f="${f}" title="${t}" aria-label="${t}">${h}</button>`;
    const dd=(n,btn,body)=>{pp(n,body);return `<span class="dd">${btn}</span>`};
    const pal=(f,cols)=>`<div class="pal">${cols.map(c=>`<button class="fb" data-f="${f}:${c}" style="background:${c}" title="${c}" aria-label="${c}"></button>`).join('')}</div>`;
    const act=ed.tonoAct||ed.tono,fam=modo==='letra'?ed.fuente:ed.fuenteA;
    ov.innerHTML=`<div class="tb"><div class="barra top"><input id="ti" placeholder="T\u00edtulo de la canci\u00f3n" aria-label="T\u00edtulo de la canci\u00f3n" value="${esc(ed.titulo)}" ${soloLectura?'readonly':''}><select id="al" ${soloLectura?'style="display:none"':''} aria-label="\u00c1lbum" title="\u00c1lbum">${A.map(a=>`<option value="${a.id}" ${a.id===ed.albumId?'selected':''}>${esc(a.nombre)}</option>`).join('')}</select>
        <div class="et" ${soloLectura?'style="display:none"':''}><div class="box"><input id="eq" value="${esc(eq)}" placeholder="${esc(resumen())}" autocomplete="off" aria-label="Buscar etiqueta"></div><button class="sec" id="eta" aria-label="Ver etiquetas">${svgI('<path d="M6 9l6 6 6-6"/>',14)}</button><div class="lista" ${verEt?'':'hidden'}>${listaEt()}</div></div>
        <span class="dd" ${soloLectura&&!ed.tono?'style="display:none"':''}><button class="sec" id="tonb" data-pop="ton" ${modo==='letra'?'disabled title="La tonalidad se cambia en la pesta\u00f1a Acordes"':''}>Tonalidad${act?' \u00b7 <b>'+esc(act)+'</b>':''}</button>${pp('ton','','tonbox')}</span>
        <span class="acc"><button class="sec" id="no">${soloLectura?'Cerrar':'Cancelar'}</button>${soloLectura?'':'<button id="ok">Guardar canci\u00f3n</button>'}</span></div>
      <div class="rib" ${plegada?'hidden':''} ${soloLectura?'style="display:none"':''}>
        <div class="gr" data-g="Texto"><select id="ff" title="Tipo de letra">${optsFuente()}</select><span class="dd szb"><input type="text" id="sz" inputmode="decimal" autocomplete="off" placeholder="16" title="Tama\u00f1o del texto donde est\u00e1 el cursor o la selecci\u00f3n"><button class="sec fb" data-pop="sz" title="Lista de tama\u00f1os" aria-label="Lista de tama\u00f1os">${svgI('<path d="M6 9l6 6 6-6"/>',12)}</button></span>${pp('sz',`<div class="menuAa">${TAMS.map(n=>`<button class="fb" data-f="s:${n}">${n}</button>`).join('')}</div>`,'tamb')}${fb('s-','A\u2212','Reducir tama\u00f1o (Ctrl+Mays+&lt;)')}${fb('s+','A+','Aumentar tama\u00f1o (Ctrl+Mays+&gt;)')}
          ${fb('b','<b>B</b>','Negrita (Ctrl+B)')}${fb('i','<i class="bi">I</i>','Cursiva (Ctrl+I)')}${fb('u','<u>U</u>','Subrayado (Ctrl+U)')}
          <button class="sec fb${modoAcorde?' on':''}" data-f="k" title="Acorde: marca los acordes de lo seleccionado. Sin selecci\u00f3n, act\u00edvalo para escribir acordes" aria-label="Acorde" ${modo==='letra'?'disabled':''}><b class="btnk">\u266A</b></button>
          ${dd('c',`<button class="sec fb" data-pop="c" title="Color de texto" aria-label="Color de texto"><span class="ia">A</span><span class="cb" style="background:${uc}"></span></button>`,pal('c',CT)+`<div class="pie"><button class="sec fb" data-f="c:auto">Autom\u00e1tico</button><label class="sec mas">M\u00e1s colores<input type="color" id="co" value="${uc}"></label></div>`)}
          ${dd('h',`<button class="sec fb" data-pop="h" title="Resaltar texto" aria-label="Resaltar texto">${svgI(MARK,15)}<span class="cb" style="background:${uh}"></span></button>`,pal('h',CH)+`<div class="pie"><button class="sec fb" data-f="h:none">Sin resaltado</button><label class="sec mas">M\u00e1s colores<input type="color" id="ch" value="${uh}"></label></div>`)}</div>
        <div class="gr" data-g="P\u00e1rrafo">${fb('a:left',svgI(AL_L,16),'Alinear a la izquierda')}${fb('a:center',svgI(AL_C,16),'Centrar')}${fb('a:right',svgI(AL_R,16),'Alinear a la derecha')}${fb('a:justify',svgI(AL_J,16),'Justificar')}
          ${fb('n:-1',svgI(OUTD,16),'Reducir sangr\u00eda')}${fb('n:1',svgI(IND,16),'Aumentar sangr\u00eda')}
          <select id="lh" title="Interlineado (de toda la hoja)">${[1,1.15,1.35,1.5,2].map(n=>`<option value="${n}" ${n===(ed.lh||1.35)?'selected':''}>${n}</option>`).join('')}</select>
          ${dd('aa',`<button class="sec fb" data-pop="aa" title="May\u00fasculas y min\u00fasculas">Aa</button>`,`<div class="menuAa"><button class="sec fb" data-f="case:up">MAY\u00daSCULAS</button><button class="sec fb" data-f="case:low">min\u00fasculas</button><button class="sec fb" data-f="case:cap">Cada Palabra</button></div>`)}</div>
        <div class="gr" data-g="Herramientas">${fb('undo',svgI(UNDO,16),'Deshacer (Ctrl+Z)')}${fb('redo',svgI(REDO,16),'Rehacer (Ctrl+Y)')}${fb('pincel',svgI(BRUSH,16),'Copiar formato (selecciona, pulsa, selecciona otro y vuelve a pulsar)')}${fb('clear','T<sub>x</sub>','Borrar formato')}<button class="sec" data-bus title="Buscar y reemplazar">${svgI(FIND,16)} Buscar</button></div></div>
      <div class="tabs" role="tablist" aria-label="Hoja"><button class="${modo==='letra'?'':'sec'}" id="ml" role="tab" aria-selected="${modo==='letra'}">Letra</button><button class="${modo==='acordes'?'':'sec'}" id="ma" role="tab" aria-selected="${modo==='acordes'}">Acordes</button>
        <span class="der"><select id="zm" title="Zoom de la hoja">${[50,75,100,125,150,200].map(n=>`<option value="${n}" ${n===zoom?'selected':''}>${n}%</option>`).join('')}</select><span id="cnt" class="cnt"></span><button class="sec" data-plegar ${soloLectura?'style="display:none"':''} title="${plegada?'Mostrar el t\u00edtulo, el \u00e1lbum y las herramientas':'Ocultar el t\u00edtulo, el \u00e1lbum y las herramientas para tener m\u00e1s espacio'}" aria-label="${plegada?'Mostrar herramientas':'Ocultar herramientas'}">${plegada?'\u25BC':'\u25B2'}</button></span></div>${pops.join('')}</div>
      <div class="pg" style="--lh:${ed.lh||1.35};zoom:${zoom/100};${cssFuente(fam)?'font-family:'+esc(cssFuente(fam))+';':''}"><div id="le" class="le" contenteditable="${soloLectura?'false':'true'}" spellcheck="false" role="textbox" ${soloLectura?'aria-readonly="true"':''} aria-multiline="true" aria-label="${modo==='letra'?'Letra':'Acordes'} de la canci\u00f3n">${hojaHtml()}</div></div>`;
    cnt();refTono();marcarBotones();
    if(popAb)colocaPop(popAb);
  };

  // ================= 10. EVENTOS (qué pasa cuando haces algo) =================
  const sc=()=>{                                            // recuerda dónde está el cursor o qué texto está seleccionado
    if(!ed)return;
    const x=getSelection();if(!x.rangeCount)return;const r=x.getRangeAt(0);
    if(!ov.querySelector('.pg')?.contains(r.commonAncestorContainer))return;
    rango=r.cloneRange();
    if(pend){const p=r.collapsed?posCaret():null;if(!p||p.ln!==pend.ln||p.pos!==pend.c)pend=null}   // el formato pendiente se pierde al mover el cursor
    marcarBotones();
  };
  document.addEventListener('selectionchange',sc);
  limpieza=()=>{document.removeEventListener('selectionchange',sc);clearTimeout(reloj)};
  const cerrar=()=>{limpieza();limpieza=null;ed=null;ov.remove();if(alCerrar)alCerrar()};

  // «Más colores»: el selector del sistema le quita la selección al texto. Se guarda al abrirlo y se devuelve antes de pintar.
  ov.addEventListener('pointerdown',e=>{if(!e.target.closest('.mas'))return;
    const x=getSelection(),r=x.rangeCount?x.getRangeAt(0):null,le=$('#le',ov);
    const v=r&&le.contains(r.commonAncestorContainer)&&!r.collapsed?r:rango;
    rangoCol=v&&!v.collapsed&&le.contains(v.commonAncestorContainer)?v.cloneRange():null},true);
  const restauraSel=()=>{if(!rangoCol)return;const x=getSelection();x.removeAllRanges();x.addRange(rangoCol);rango=rangoCol.cloneRange();rangoCol=null};
  ov.onmousedown=e=>{if(e.target.closest('.fb'))e.preventDefault()};   // los botones no le quitan la selección al texto
  ov.onfocusin=e=>{if(e.target.id==='eq'){verEt=true;const l=ov.querySelector('.lista');if(l)l.hidden=false}
    else if(e.target.id==='sz')e.target.select();
    else if(e.target.id==='le')marcarBotones()};
  ov.addEventListener('focusout',e=>{if(e.target.id==='sz')setTimeout(()=>{if(ed)mostrarTam(true)},0)});
  ov.addEventListener('keyup',e=>{if(e.target.id==='le')marcarBotones()});
  ov.addEventListener('scroll',e=>{if(e.target.classList&&e.target.classList.contains('rib'))cierraPop()},true);   // en móvil, al desplazar la barra se cierran los desplegables
  ov.oninput=e=>{const t=e.target;
    if(t.id==='le'){marcarTecleado(e);cnt();programaPunto();marcarBotones();return}
    if(t.id==='eq'){eq=t.value;verEt=true;const l=ov.querySelector('.lista');l.hidden=false;l.innerHTML=listaEt();return}
    if(t.id==='ti')ed.titulo=t.value;
  };
  // Clic en el margen izquierdo de la hoja: selecciona la línea (y arrastrando, varias)
  const lineaEn=y=>{const r=ov.querySelector('.pg').getBoundingClientRect(),el=document.elementFromPoint(r.left+r.width/2,y);return el?(el.closest('.ln')||null):null};
  const selLineas=(a,b)=>{
    const ls=[...ov.querySelectorAll('.pg .ln')];let i=ls.indexOf(a),j=ls.indexOf(b);if(i<0||j<0)return;if(i>j)[i,j]=[j,i];
    const r=document.createRange();r.setStart(ls[i],0);r.setEnd(ls[j],ls[j].childNodes.length);const x=getSelection();x.removeAllRanges();x.addRange(r)};
  ov.addEventListener('mousedown',e=>{
    const pg=e.target.closest('.pg');if(!pg||e.target.closest('textarea,input'))return;
    if(e.clientX-pg.getBoundingClientRect().left>34*zoom/100)return;
    const ln=lineaEn(e.clientY);if(!ln)return;e.preventDefault();ancla=ln;selLineas(ln,ln)});
  ov.addEventListener('mousemove',e=>{if(ancla&&e.buttons===1){const ln=lineaEn(e.clientY);if(ln)selLineas(ancla,ln)}});
  ov.addEventListener('mouseup',()=>{ancla=null;setTimeout(marcarBotones,0)});
  ov.onchange=e=>{const t=e.target;leer();
    if(t.id==='al')ed.albumId=t.value;
    else if(t.closest('.lista'))alterna(t.value,t.checked);
    else if(t.id==='co'){restauraSel();uc=t.value;fmt('c',t.value);cierraPop()}
    else if(t.id==='ch'){restauraSel();uh=t.value;fmt('h',t.value);cierraPop()}
    else if(t.id==='sz'){const n=parseFloat(t.value);if(n>=6&&n<=120)fmt('s',n);mostrarTam(true)}
    else if(t.id==='lh'){ed.lh=+t.value;ov.querySelector('.pg').style.setProperty('--lh',ed.lh||1.35)}
    else if(t.id==='zm'){zoom=+t.value;ov.querySelector('.pg').style.zoom=zoom/100}
    else if(t.id==='ff'){
      if(t.value==='__local')return cargarLocales();
      const v=t.value==='Est\u00e1ndar (Arial)'?'':t.value;
      if(modo==='letra')ed.fuente=v;else ed.fuenteA=v;
      ov.querySelector('.pg').style.fontFamily=cssFuente(v)}};
  ov.onkeydown=e=>{
    if(soloLectura)return;                                  // en solo lectura no hay atajos de edición (copiar con Ctrl+C sigue funcionando)
    const k=e.key.toLowerCase(),ctl=(e.ctrlKey||e.metaKey)&&!e.altKey,enHoja=!e.target.matches('input,select,textarea');
    if(ctl&&!e.shiftKey&&/^[biu]$/.test(k)){if(enHoja){e.preventDefault();fmt(k)}}   // dentro de un campo de texto se deja el atajo del navegador
    else if(ctl&&enHoja&&k==='z'&&!e.shiftKey){e.preventDefault();deshacer()}
    else if(ctl&&enHoja&&(k==='y'||(k==='z'&&e.shiftKey))){e.preventDefault();rehacer()}
    else if(ctl&&enHoja&&e.shiftKey&&(e.key==='>'||e.key==='.')){e.preventDefault();fmt('s+')}
    else if(ctl&&enHoja&&e.shiftKey&&(e.key==='<'||e.key===',')){e.preventDefault();fmt('s-')}
    else if(e.key==='Enter'&&e.shiftKey&&e.target.id==='le'){e.preventDefault();document.execCommand('insertParagraph')}   // Mays+Enter = Enter: una línea nueva de verdad
    else if(e.key==='Tab'&&e.target.id==='le'){e.preventDefault();document.execCommand('insertText',false,'    ')}
    else if(e.key==='Enter'&&e.target.id==='eq'){e.preventDefault();const f=filtra()[0];if(f){alterna(f.id,!ed.etiquetas.includes(f.id));eq='';e.target.value='';refEt()}}};
  ov.addEventListener('paste',e=>{
    if(soloLectura||!e.target.closest('#le'))return;e.preventDefault();
    const cd=e.clipboardData,h=cd.getData('text/html'),r=h?limpiaHtml(h):'';
    pend=null;
    document.execCommand('insertHTML',false,r||esc(cd.getData('text/plain')).replace(/\r?\n/g,'<br>'));
    recompone();                                            // deja una línea por div y devuelve el cursor
    programaPunto()});
  ov.onclick=e=>{
    const tg=e.target;
    if(tg.closest('.et')){
      if(tg.closest('#eta')){verEt=!verEt;ov.querySelector('.lista').hidden=!verEt}
      return}
    const pb=tg.closest('[data-pop]');
    if(pb){popAb=popAb===pb.dataset.pop?null:pb.dataset.pop;ov.querySelectorAll('.pp').forEach(x=>x.hidden=x.dataset.pp!==popAb);if(popAb==='ton')refTono();if(popAb==='sz')marcaTam();if(popAb)colocaPop(popAb);return}
    if(!tg.closest('.pp'))cierraPop();
    if(verEt){verEt=false;ov.querySelector('.lista').hidden=true;eq='';const i=$('#eq',ov);if(i)i.value='';refEt()}
    const t=tg.closest('[id],[data-f],[data-bus],[data-tt],[data-tv],[data-tf],[data-tr],[data-tk],[data-plegar]')||tg,d=t.dataset;leer();
    if(t.id==='ok'){
      if(soloLectura)return;
      if(!ed.titulo.trim())return alert('Escribe un t\u00edtulo.');
      ed.lineas=recorta(ed.lineas);ed.lineasA=recorta(ed.lineasA);
      ed.letra=ed.lineas.map(plano).join('\n');
      const {id,acordes,...x}=ed;id?guardar('canciones',id,x,false):crear('canciones',x);cerrar();return}
    if(t.id==='no'){if(!soloLectura&&snapFull()!==inicial&&!confirm('\u00bfDescartar los cambios?'))return;return cerrar()}
    if(d.tt!=null){cambiaTono(+d.tt);return}
    if(d.tv!=null){
      if(ed.tono){
        const dif=((ix(raiz(ed.tono))-ix(raiz(ed.tonoAct||ed.tono)))%12+12)%12;
        if(dif)cambiaTono(dif);
        if(ed.tonoAct!==ed.tono){ed.tonoAct=ed.tono;punto()}
        refTono();
      }
      return}
    if(d.tf!=null){if(soloLectura)return;ed.tono=ed.tonoAct||ed.tono;refTono();return}
    if(d.tr!=null){if(soloLectura)return;ed.tono='';ed.tonoAct='';refTono();return}
    if(d.tk!=null){if(soloLectura&&!ed.tono)return;if(!ed.tono){ed.tono=ed.tonoAct=d.tk;refTono()}else irATono(d.tk);return}
    if(d.plegar!=null){plegada=!plegada;ov.querySelector('.rib').hidden=plegada;ov.classList.toggle('plegada',plegada);t.textContent=plegada?'\u25BC':'\u25B2';t.setAttribute('aria-label',plegada?'Mostrar herramientas':'Ocultar herramientas');t.title=plegada?'Mostrar el t\u00edtulo, el \u00e1lbum y las herramientas':'Ocultar el t\u00edtulo, el \u00e1lbum y las herramientas para tener m\u00e1s espacio';return}
    if(d.f&&soloLectura)return;
    if(d.f){const [p,...r]=d.f.split(':'),v=r.join(':');
      if(p==='c'&&v!=='auto'){uc=v;ov.querySelectorAll('[data-pop="c"] .cb').forEach(x=>x.style.background=uc)}
      if(p==='h'&&v!=='none'){uh=v;ov.querySelectorAll('[data-pop="h"] .cb').forEach(x=>x.style.background=uh)}
      cierraPop();return fmt(p,v)}
    else if(d.bus!=null)return soloLectura?null:buscar();
    else if(t.id==='ml'||t.id==='ma'){modo=t.id==='ml'?'letra':'acordes';modoAcorde=false;pend=null;rango=null;popAb=null}
    else return;
    pinta();
  };
  if(!ed.lineasA)ed.lineasA=convertirAcordes();              // canciones de la versión anterior: se arma la hoja de Acordes
  // Las DOS hojas se pasan por el mismo lector antes de guardar la «foto inicial»; así «Cancelar» solo pregunta si de verdad cambiaste algo.
  const normaliza=ls=>{const d=document.createElement('div');d.innerHTML=hojaHtml(ls);return leerDom(d)};
  ed.lineas=normaliza(ed.lineas);ed.lineasA=normaliza(ed.lineasA);
  pinta();inicial=snapFull();base=snap();
}
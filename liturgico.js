// =====================================================================
//  LITURGICO.JS  ·  Tiempo litúrgico (calendario romano + fiestas de cada país)
//
//  Calcula, para cualquier fecha, el tiempo litúrgico (Adviento, Navidad,
//  Tiempo Ordinario, Cuaresma, Triduo Pascual, Pascua), la semana, el nombre
//  del día (p. ej. «1.er domingo de Adviento») y la celebración del día
//  (solemnidad, fiesta, memoria obligatoria o libre).
//
//  No guarda nada en Firebase: todo se calcula a partir de la fecha de Pascua.
//  Lo único que lee es el país de la misión activa (campo «codigo» de la misión,
//  ver misiones.js) para añadir las fiestas propias de ese país.
//
//  Lo usan:  calendario.js (cuadrícula y panel del día)  y  usuarios.js (Inicio).
//
//  MAPA DE ESTE ARCHIVO (usa Ctrl+F para encontrar cada parte):
//   1. DATOS ................ calendario romano general y fiestas por país
//   2. FECHAS ............... Pascua, Adviento y ayudas de fechas
//   3. TIEMPO LITÚRGICO ..... qué tiempo, semana y nombre tiene cada día
//   4. CELEBRACIÓN DEL DÍA .. precedencia: solemnidad > fiesta > memoria
//   5. USO EN LA APP ........ país activo, próximos días, tarjeta de Inicio
//   6. ESTILOS
//
//  Reglas de esta versión:
//   · Las solemnidades NO se trasladan (si caen en domingo de Adviento, Cuaresma
//     o Pascua, gana el domingo y la solemnidad queda anotada debajo).
//   · Epifanía el 6 de enero; Ascensión y Corpus Christi en jueves.
//   · En Cuaresma y del 17 al 24 de diciembre las memorias obligatorias pasan a libres.
//   · Los colores litúrgicos se añadirán más adelante.
// =====================================================================
import {esc,ambitoActual} from "./base.js";
import {misionPorId,alCambiarMisiones} from "./misiones.js";

// ---------------------------------------------------------------------
// 1. DATOS
//    Cada celebración: [día, rango, nombre]
//    Rangos:  S solemnidad · FS fiesta del Señor · F fiesta · M memoria obligatoria · L memoria libre
//             C conmemoración (Fieles Difuntos)
//    (Las celebraciones que dependen de la fecha de Pascua están en la parte 4.)
// ---------------------------------------------------------------------
const GEN={
  1:[[1,'S','Santa María, Madre de Dios'],[2,'M','Ss. Basilio Magno y Gregorio Nacianceno, obispos y doctores'],[3,'L','Santísimo Nombre de Jesús'],[6,'S','Epifanía del Señor'],[7,'L','San Raimundo de Peñafort, presbítero'],[13,'L','San Hilario, obispo y doctor'],[17,'M','San Antonio, abad'],[20,'L','San Fabián, papa y mártir'],[20,'L','San Sebastián, mártir'],[21,'M','Santa Inés, virgen y mártir'],[22,'L','San Vicente, diácono y mártir'],[24,'M','San Francisco de Sales, obispo y doctor'],[25,'F','Conversión de San Pablo, apóstol'],[26,'M','Ss. Timoteo y Tito, obispos'],[27,'L','Santa Ángela Merici, virgen'],[28,'M','Santo Tomás de Aquino, presbítero y doctor'],[31,'M','San Juan Bosco, presbítero']],
  2:[[2,'FS','Presentación del Señor'],[3,'L','San Blas, obispo y mártir'],[3,'L','San Óscar (Anscario), obispo'],[5,'M','Santa Águeda, virgen y mártir'],[6,'M','Ss. Pablo Miki y compañeros, mártires'],[8,'L','San Jerónimo Emiliani'],[8,'L','Santa Josefina Bakhita, virgen'],[10,'M','Santa Escolástica, virgen'],[11,'L','Nuestra Señora de Lourdes'],[14,'M','Ss. Cirilo, monje, y Metodio, obispo'],[17,'L','Siete santos fundadores de la Orden de los Siervos de María'],[21,'L','San Pedro Damián, obispo y doctor'],[22,'F','Cátedra de San Pedro, apóstol'],[23,'M','San Policarpo, obispo y mártir'],[27,'L','San Gregorio de Narek, abad y doctor']],
  3:[[4,'L','San Casimiro'],[7,'M','Ss. Perpetua y Felicidad, mártires'],[8,'L','San Juan de Dios, religioso'],[9,'L','Santa Francisca Romana, religiosa'],[17,'L','San Patricio, obispo'],[18,'L','San Cirilo de Jerusalén, obispo y doctor'],[19,'S','San José, esposo de la Virgen María'],[23,'L','Santo Toribio de Mogrovejo, obispo'],[25,'S','Anunciación del Señor']],
  4:[[2,'L','San Francisco de Paula, ermitaño'],[4,'L','San Isidoro, obispo y doctor'],[5,'L','San Vicente Ferrer, presbítero'],[7,'M','San Juan Bautista de La Salle, presbítero'],[11,'M','San Estanislao, obispo y mártir'],[13,'L','San Martín I, papa y mártir'],[21,'L','San Anselmo, obispo y doctor'],[23,'L','San Jorge, mártir'],[23,'L','San Adalberto, obispo y mártir'],[24,'L','San Fidel de Sigmaringa, presbítero y mártir'],[25,'F','San Marcos, evangelista'],[28,'L','San Pedro Chanel, presbítero y mártir'],[28,'L','San Luis María Grignion de Montfort, presbítero'],[29,'M','Santa Catalina de Siena, virgen y doctora de la Iglesia'],[30,'L','San Pío V, papa']],
  5:[[1,'L','San José Obrero'],[2,'M','San Atanasio, obispo y doctor'],[3,'F','Ss. Felipe y Santiago, apóstoles'],[12,'L','Ss. Nereo y Aquileo, mártires'],[12,'L','San Pancracio, mártir'],[13,'L','Nuestra Señora de Fátima'],[14,'F','San Matías, apóstol'],[18,'L','San Juan I, papa y mártir'],[10,'L','San Juan de Ávila, presbítero y doctor de la Iglesia'],[20,'L','San Bernardino de Siena, presbítero'],[21,'L','San Cristóbal Magallanes, presbítero, y compañeros, mártires'],[22,'L','Santa Rita de Casia, religiosa'],[25,'L','San Beda el Venerable, presbítero y doctor'],[25,'L','San Gregorio VII, papa'],[25,'L','Santa María Magdalena de Pazzi, virgen'],[26,'M','San Felipe Neri, presbítero'],[27,'L','San Agustín de Canterbury, obispo'],[29,'L','San Pablo VI, papa'],[31,'F','Visitación de la Virgen María']],
  6:[[1,'M','San Justino, mártir'],[2,'L','Ss. Marcelino y Pedro, mártires'],[3,'M','Ss. Carlos Lwanga y compañeros, mártires'],[5,'M','San Bonifacio, obispo y mártir'],[6,'L','San Norberto, obispo'],[9,'L','San Efrén, diácono y doctor'],[11,'M','San Bernabé, apóstol'],[13,'M','San Antonio de Padua, presbítero y doctor'],[19,'L','San Romualdo, abad'],[21,'M','San Luis Gonzaga, religioso'],[22,'L','San Paulino de Nola, obispo'],[22,'L','Ss. Juan Fisher, obispo, y Tomás Moro, mártires'],[24,'S','Natividad de San Juan Bautista'],[27,'L','San Cirilo de Alejandría, obispo y doctor'],[28,'M','San Ireneo, obispo y mártir'],[29,'S','Ss. Pedro y Pablo, apóstoles'],[30,'L','Santos Protomártires de la Iglesia de Roma']],
  7:[[3,'F','Santo Tomás, apóstol'],[4,'L','Santa Isabel de Portugal'],[5,'L','San Antonio María Zaccaria, presbítero'],[6,'L','Santa María Goretti, virgen y mártir'],[9,'L','San Agustín Zhao Rong, presbítero, y compañeros, mártires'],[11,'M','San Benito, abad'],[13,'L','San Enrique'],[14,'L','San Camilo de Lelis, presbítero'],[15,'M','San Buenaventura, obispo y doctor'],[16,'L','Nuestra Señora del Carmen'],[20,'L','San Apolinar, obispo y mártir'],[21,'L','San Lorenzo de Brindis, presbítero y doctor'],[22,'F','Santa María Magdalena'],[23,'L','Santa Brígida de Suecia, religiosa'],[24,'L','San Charbel Makhlūf, presbítero'],[25,'F','Santiago, apóstol'],[26,'M','Ss. Joaquín y Ana, padres de la Virgen María'],[29,'M','Ss. Marta, María y Lázaro'],[30,'L','San Pedro Crisólogo, obispo y doctor'],[31,'M','San Ignacio de Loyola, presbítero']],
  8:[[1,'M','San Alfonso María de Ligorio, obispo y doctor'],[2,'L','San Eusebio de Vercelli, obispo'],[2,'L','San Pedro Julián Eymard, presbítero'],[4,'M','San Juan María Vianney, presbítero'],[5,'L','Dedicación de la Basílica de Santa María'],[6,'FS','Transfiguración del Señor'],[7,'L','San Sixto II, papa, y compañeros, mártires'],[7,'L','San Cayetano, presbítero'],[8,'M','Santo Domingo, presbítero'],[9,'L','Santa Teresa Benedicta de la Cruz, virgen y mártir'],[10,'F','San Lorenzo, diácono y mártir'],[11,'M','Santa Clara, virgen'],[12,'L','Santa Juana Francisca de Chantal, religiosa'],[13,'L','Ss. Ponciano, papa, e Hipólito, presbítero, mártires'],[14,'M','San Maximiliano María Kolbe, presbítero y mártir'],[15,'S','Asunción de la Virgen María'],[16,'L','San Esteban de Hungría'],[19,'L','San Juan Eudes, presbítero'],[20,'M','San Bernardo, abad y doctor'],[21,'M','San Pío X, papa'],[22,'M','Santa María Virgen, Reina'],[23,'L','Santa Rosa de Lima, virgen'],[24,'F','San Bartolomé, apóstol'],[25,'L','San Luis de Francia'],[25,'L','San José de Calasanz, presbítero'],[27,'M','Santa Mónica'],[28,'M','San Agustín, obispo y doctor'],[29,'M','Martirio de San Juan Bautista']],
  9:[[3,'M','San Gregorio Magno, papa y doctor'],[5,'L','Santa Teresa de Calcuta, virgen'],[8,'F','Natividad de la Virgen María'],[9,'L','San Pedro Claver, presbítero'],[12,'L','Santísimo Nombre de María'],[13,'M','San Juan Crisóstomo, obispo y doctor'],[14,'FS','Exaltación de la Santa Cruz'],[15,'M','Nuestra Señora de los Dolores'],[16,'M','Ss. Cornelio, papa, y Cipriano, obispo, mártires'],[17,'L','San Roberto Belarmino, obispo y doctor'],[17,'L','Santa Hildegarda de Bingen, virgen y doctora'],[19,'L','San Jenaro, obispo y mártir'],[20,'M','Ss. Andrés Kim Taegon, presbítero, y Pablo Chong Hasang y compañeros, mártires'],[21,'F','San Mateo, apóstol y evangelista'],[23,'M','San Pío de Pietrelcina, presbítero'],[26,'L','Ss. Cosme y Damián, mártires'],[27,'M','San Vicente de Paúl, presbítero'],[28,'L','San Wenceslao, mártir'],[28,'L','Ss. Lorenzo Ruiz y compañeros, mártires'],[29,'F','Ss. Miguel, Gabriel y Rafael, arcángeles'],[30,'M','San Jerónimo, presbítero y doctor']],
  10:[[1,'M','Santa Teresa del Niño Jesús, virgen y doctora'],[2,'M','Santos Ángeles Custodios'],[4,'M','San Francisco de Asís'],[5,'L','Santa María Faustina Kowalska, virgen'],[6,'L','San Bruno, presbítero'],[7,'M','Nuestra Señora del Rosario'],[9,'L','San Dionisio, obispo, y compañeros, mártires'],[9,'L','San Juan Leonardi, presbítero'],[11,'L','San Juan XXIII, papa'],[14,'L','San Calixto I, papa y mártir'],[15,'M','Santa Teresa de Jesús, virgen y doctora'],[16,'L','Santa Eduvigis, religiosa'],[16,'L','Santa Margarita María Alacoque, virgen'],[17,'M','San Ignacio de Antioquía, obispo y mártir'],[18,'F','San Lucas, evangelista'],[19,'L','Ss. Juan de Brébeuf e Isaac Jogues, presbíteros, y compañeros, mártires'],[19,'L','San Pablo de la Cruz, presbítero'],[22,'L','San Juan Pablo II, papa'],[23,'L','San Juan de Capistrano, presbítero'],[24,'L','San Antonio María Claret, obispo'],[28,'F','Ss. Simón y Judas, apóstoles']],
  11:[[1,'S','Todos los Santos'],[2,'C','Conmemoración de todos los fieles difuntos'],[3,'L','San Martín de Porres, religioso'],[4,'M','San Carlos Borromeo, obispo'],[9,'FS','Dedicación de la Basílica de Letrán'],[10,'M','San León Magno, papa y doctor'],[11,'M','San Martín de Tours, obispo'],[12,'M','San Josafat, obispo y mártir'],[15,'L','San Alberto Magno, obispo y doctor'],[16,'L','Santa Margarita de Escocia'],[16,'L','Santa Gertrudis, virgen'],[17,'M','Santa Isabel de Hungría, religiosa'],[18,'L','Dedicación de las Basílicas de San Pedro y San Pablo'],[21,'M','Presentación de la Virgen María'],[22,'M','Santa Cecilia, virgen y mártir'],[23,'L','San Clemente I, papa y mártir'],[23,'L','San Columbano, abad'],[24,'M','Ss. Andrés Dung-Lac, presbítero, y compañeros, mártires'],[25,'L','Santa Catalina de Alejandría, virgen y mártir'],[30,'F','San Andrés, apóstol']],
  12:[[3,'M','San Francisco Javier, presbítero'],[4,'L','San Juan Damasceno, presbítero y doctor'],[6,'L','San Nicolás, obispo'],[7,'M','San Ambrosio, obispo y doctor'],[8,'S','Inmaculada Concepción de la Virgen María'],[9,'L','San Juan Diego Cuauhtlatoatzin'],[10,'L','Nuestra Señora de Loreto'],[11,'L','San Dámaso I, papa'],[12,'L','Nuestra Señora de Guadalupe'],[13,'M','Santa Lucía, virgen y mártir'],[14,'M','San Juan de la Cruz, presbítero y doctor'],[21,'L','San Pedro Canisio, presbítero y doctor'],[23,'L','San Juan Cancio, presbítero'],[25,'S','Natividad del Señor'],[26,'F','San Esteban, protomártir'],[27,'F','San Juan, apóstol y evangelista'],[28,'F','Santos Inocentes, mártires'],[29,'L','Santo Tomás Becket, obispo y mártir'],[31,'L','San Silvestre I, papa']]
};

// Fiestas propias de cada país. La clave es el código de 2 letras de la misión (el mismo de
// misiones.js). Misma forma que GEN: mes → [día, rango, nombre].
// Por ahora solo está Paraguay (de prueba). Para añadir otro país, copia el bloque de PY.
// ¡Revisa esta lista! Las celebraciones de un país pueden tener fechas o rangos propios.
const PAIS={
  PY:{
    nombre:'Paraguay',
    fiestas:{
      4:[[28,'F','Beata María Felicia de Jesús Sacramentado (Chiquitunga), virgen']],   // rango por confirmar con el calendario de la CEP
      11:[[16,'F','San Roque González de Santa Cruz y compañeros, mártires']],   // el 16 (no el 17); rango por confirmar con el calendario de la CEP
      12:[[8,'S','Nuestra Señora de los Milagros de Caacupé, Patrona del Paraguay']]
    }
  }
};

// ---------------------------------------------------------------------
// 2. FECHAS
// ---------------------------------------------------------------------
const DIAS=['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
const DCORTO=['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'],MCORTO=['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
const suma=(d,n)=>new Date(d.getFullYear(),d.getMonth(),d.getDate()+n);
const dif=(a,b)=>Math.round((Date.UTC(a.getFullYear(),a.getMonth(),a.getDate())-Date.UTC(b.getFullYear(),b.getMonth(),b.getDate()))/864e5);
const dos=n=>String(n).padStart(2,'0');
export const aYmd=d=>d.getFullYear()+'-'+dos(d.getMonth()+1)+'-'+dos(d.getDate());
const desdeYmd=s=>{const [y,m,d]=s.split('-').map(Number);return new Date(y,m-1,d)};
const ordM=n=>n===1?'1.er':n===3?'3.er':n+'.º';   // domingo: 1.er, 2.º, 3.er, 4.º…
const ordF=n=>n+'.ª';                                // semana: 1.ª, 2.ª…

// Domingo de Pascua (algoritmo de Meeus/Jones/Butcher)
function pascua(y){
  const a=y%19,b=Math.floor(y/100),c=y%100,d=Math.floor(b/4),e=b%4,f=Math.floor((b+8)/25),g=Math.floor((b-f+1)/3);
  const h=(19*a+b-d-g+15)%30,i=Math.floor(c/4),k=c%4,l=(32+2*e+2*i-h-k)%7,m=Math.floor((a+11*h+22*l)/451);
  const mes=Math.floor((h+l-7*m+114)/31),dia=((h+l-7*m+114)%31)+1;
  return new Date(y,mes-1,dia);
}
const cacheAnio={};
function datosAnio(Y){
  if(cacheAnio[Y])return cacheAnio[Y];
  const E=pascua(Y),nav=new Date(Y,11,25),adv4=suma(nav,-(nav.getDay()||7)),ep=new Date(Y,0,6);
  return cacheAnio[Y]={
    E,                                   // Domingo de Pascua
    adv1:suma(adv4,-21),                 // 1.er domingo de Adviento (de este año civil)
    bautismo:suma(ep,7-ep.getDay()),     // Bautismo del Señor: domingo siguiente al 6 de enero
    ceniza:suma(E,-46),ramos:suma(E,-7),pentecostes:suma(E,49)
  };
}

// ---------------------------------------------------------------------
// 3. TIEMPO LITÚRGICO
//    temporal(fecha) → {tiempo, semana, nombre, domingo, p, bajar}
//      p = prioridad (menor gana): 1 días mayores (Triduo, domingos de Adviento/Cuaresma/Pascua…)
//          3 fiesta del Señor · 3.5 domingo de Navidad/Ordinario · 4.5 feria de Cuaresma o del 17-24 dic
//          5.5 feria común
//      bajar = en este día las memorias obligatorias pasan a libres
// ---------------------------------------------------------------------
function temporal(d){
  const Y=d.getFullYear(),A=datosAnio(Y),dow=d.getDay(),dia=DIAS[dow],dom=dow===0,mes=d.getMonth()+1,dd=d.getDate();
  const T=(tiempo,semana,nombre,p,extra)=>({tiempo,semana,nombre,domingo:dom,p,...extra});

  // — Adviento (hasta el 24 de diciembre) y Navidad (25-31 de diciembre) —
  if(dif(d,A.adv1)>=0){
    if(mes===11||dd<=24){
      const k=Math.floor(dif(d,A.adv1)/7)+1,sem='Semana '+k;
      if(dom)return T('Adviento',sem,`${ordM(k)} domingo de Adviento`,1);
      if(mes===12&&dd>=17)return T('Adviento',sem,`${dia} ${dd} de diciembre, feria mayor de Adviento`,4.5,{bajar:true});
      return T('Adviento',sem,`${dia} de la ${ordF(k)} semana de Adviento`,5.5);
    }
    const sagrada=(dom&&dd>=26)||(dd===30&&new Date(Y,11,25).getDay()===0);
    if(sagrada)return T('Navidad','Octava de Navidad','Sagrada Familia de Jesús, María y José',3);
    return T('Navidad','Octava de Navidad',dd===25?'Octava de Navidad':`${dia} de la octava de Navidad`,5.5);
  }
  // — Navidad (1 de enero hasta el Bautismo del Señor) —
  if(dif(d,A.bautismo)<=0){
    if(dif(d,A.bautismo)===0)return T('Navidad',null,'Bautismo del Señor',3);
    if(dd===1)return T('Navidad','Octava de Navidad','Octava de Navidad',5.5);
    if(dom&&dd>=2&&dd<=5)return T('Navidad',null,'2.º domingo después de Navidad',3.5);
    if(dd<6)return T('Navidad',null,`${dia} antes de la Epifanía`,5.5);
    if(dd===6)return T('Navidad',null,`${dia} de Navidad`,5.5);
    return T('Navidad',null,`${dia} después de la Epifanía`,5.5);
  }
  // — Tiempo Ordinario, primera parte (hasta el martes antes del Miércoles de Ceniza) —
  if(dif(d,A.ceniza)<0){
    const k=dif(suma(d,-dow),A.bautismo)/7+1;
    return dom?T('Tiempo Ordinario','Semana '+k,`${ordM(k)} domingo del Tiempo Ordinario`,3.5)
              :T('Tiempo Ordinario','Semana '+k,`${dia} de la ${ordF(k)} semana del Tiempo Ordinario`,5.5);
  }
  // — Cuaresma (hasta el miércoles de la Semana Santa) —
  if(dif(d,suma(A.E,-3))<0){
    const n=dif(d,A.ceniza),prim=suma(A.E,-42);
    if(n===0)return T('Cuaresma',null,'Miércoles de Ceniza',1);
    if(n<4)return T('Cuaresma',null,`${dia} después de Ceniza`,4.5,{bajar:true});
    if(dom){
      if(dif(d,A.ramos)===0)return T('Cuaresma','Semana Santa','Domingo de Ramos de la Pasión del Señor',1);
      const k=dif(d,prim)/7+1;
      return T('Cuaresma','Semana '+k,`${ordM(k)} domingo de Cuaresma`,1);
    }
    if(dif(d,A.ramos)>0)return T('Cuaresma','Semana Santa',`${dia} Santo`,1);
    const k=dif(suma(d,-dow),prim)/7+1;
    return T('Cuaresma','Semana '+k,`${dia} de la ${ordF(k)} semana de Cuaresma`,4.5,{bajar:true});
  }
  // — Triduo Pascual —
  if(dif(d,A.E)<0){
    const n=dif(d,A.E);
    return T('Triduo Pascual',null,n===-3?'Jueves Santo, Cena del Señor':n===-2?'Viernes Santo de la Pasión del Señor':'Sábado Santo',1);
  }
  // — Pascua —
  if(dif(d,A.pentecostes)<=0){
    const n=dif(d,A.E);
    if(n===0)return T('Pascua','Octava de Pascua','Domingo de Pascua de la Resurrección del Señor',1);
    if(n<7)return T('Pascua','Octava de Pascua',`${dia} de la octava de Pascua`,1);
    if(n===7)return T('Pascua','Semana 2','2.º domingo de Pascua (de la Divina Misericordia)',1);
    if(n===49)return T('Pascua',null,'Domingo de Pentecostés',1);
    const k=dif(suma(d,-dow),A.E)/7+1;
    return dom?T('Pascua','Semana '+k,`${ordM(k)} domingo de Pascua`,1)
              :T('Pascua','Semana '+k,`${dia} de la ${ordF(k)} semana de Pascua`,5.5);
  }
  // — Tiempo Ordinario, segunda parte: se cuenta hacia atrás desde el Adviento (la última semana es la 34) —
  const k=35-dif(A.adv1,suma(d,-dow))/7;
  return dom?T('Tiempo Ordinario','Semana '+k,`${ordM(k)} domingo del Tiempo Ordinario`,3.5)
            :T('Tiempo Ordinario','Semana '+k,`${dia} de la ${ordF(k)} semana del Tiempo Ordinario`,5.5);
}

// ---------------------------------------------------------------------
// 4. CELEBRACIÓN DEL DÍA
// ---------------------------------------------------------------------
const PRIO={S:2,C:2.5,FS:3,F:4,M:5,L:6};
const ETIQUETA={S:'Solemnidad',C:'Conmemoración',FS:'Fiesta',F:'Fiesta',M:'Memoria obligatoria',L:'Memoria libre',T:''};

function delMes(tabla,mes,dia){return ((tabla&&tabla[mes])||[]).filter(x=>x[0]===dia)}
// Celebraciones que dependen de la fecha de Pascua o del Adviento.
function moviles(d){
  const A=datosAnio(d.getFullYear()),n=dif(d,A.E),r=[];
  if(n===39)r.push(['S','Ascensión del Señor']);
  if(n===50)r.push(['M','Santa María, Madre de la Iglesia']);
  if(n===56)r.push(['S','Santísima Trinidad']);
  if(n===60)r.push(['S','Santísimo Cuerpo y Sangre de Cristo']);
  if(n===68)r.push(['S','Sagrado Corazón de Jesús']);
  if(n===69)r.push(['M','Inmaculado Corazón de la Virgen María']);
  if(dif(A.adv1,d)===7)r.push(['S','Nuestro Señor Jesucristo, Rey del Universo']);
  return r;
}

// infoLiturgica(fecha, codigoPais): fecha = Date o 'AAAA-MM-DD'; codigoPais = 'PY'… (o '' = solo calendario romano)
export function infoLiturgica(fecha,codigo=''){
  const d=typeof fecha==='string'?desdeYmd(fecha):fecha,t=temporal(d),mes=d.getMonth()+1,dd=d.getDate();
  const pais=PAIS[String(codigo||'').toUpperCase()];
  let santos=[
    ...delMes(pais&&pais.fiestas,mes,dd).map(x=>[x[1],x[2]]),     // primero las del país (ganan los empates)
    ...delMes(GEN,mes,dd).map(x=>[x[1],x[2]]),
    ...moviles(d)
  ];
  if(t.p===1)santos=santos.filter(s=>s[0]==='S');                // días mayores: solo se anotan las solemnidades
  if(t.tiempo==='Tiempo Ordinario'&&d.getDay()===6&&!santos.some(s=>PRIO[s[0]]<=5))santos.push(['L','Santa María en sábado']);   // sábados del T. Ordinario sin memoria obligatoria
  const ents=[{nombre:t.nombre,rango:'T',p:t.p,temporal:true}];
  santos.forEach(([r,nombre])=>{
    const rango=(t.bajar&&r==='M')?'L':r;                          // en Cuaresma y 17-24 dic: memorias obligatorias → libres
    ents.push({nombre,rango:rango==='FS'?'F':rango,p:PRIO[rango]});
  });
  ents.forEach((e,i)=>{e.i=i});
  ents.sort((a,b)=>(a.p-b.p)||(a.i-b.i));                          // empate: se respeta el orden de arriba
  const principal=ents[0],otros=ents.slice(1).filter(e=>!e.temporal);
  const etiq=e=>e.rango==='T'?(d.getDay()===0?'Domingo':''):ETIQUETA[e.rango];
  principal.etiqueta=etiq(principal);otros.forEach(o=>{o.etiqueta=etiq(o)});
  return {
    fecha:d,ymd:aYmd(d),
    tiempo:t.tiempo,semana:t.semana,nombreDia:t.nombre,        // nombreDia = el nombre del día según el tiempo (p. ej. «Lunes de la 1.ª semana de Adviento»)
    domingo:d.getDay()===0,
    principal,otros,                                              // principal = la celebración que manda hoy · otros = memorias libres u otras anotaciones
    destacado:principal.p<=4||d.getDay()===0                      // solemnidad, fiesta, día mayor o domingo
  };
}

// ---------------------------------------------------------------------
// 5. USO EN LA APP
// ---------------------------------------------------------------------
// País (código de 2 letras) de la misión activa; '' en el espacio General o si la misión no tiene país.
export const codigoPais=()=>{const m=misionPorId(ambitoActual());return m?String(m.codigo||'').toUpperCase():''};
// Avisa cuando hay que volver a pintar (cargaron las misiones o cambió el espacio).
export const alCambiarLiturgia=fn=>{alCambiarMisiones(fn);addEventListener('ambitocambio',fn)};

// proximosDias: los días destacados (domingos, solemnidades, fiestas) de los n días siguientes a «desde».
export function proximosDias(desde=new Date(),n=10,codigo=codigoPais()){
  const base=new Date(desde.getFullYear(),desde.getMonth(),desde.getDate()),r=[];
  for(let i=1;i<=n;i++){const x=infoLiturgica(suma(base,i),codigo);if(x.destacado)r.push(x)}
  return r;
}

// El tiempo y la semana en una línea: «Adviento · Semana 1»
export const lineaTiempo=i=>i.tiempo+(i.semana?' · '+i.semana:'');

// tarjetaLiturgica: el cuadro pequeño de Inicio (hoy + próximos 10 días).
export function tarjetaLiturgica(){
  const hoy=new Date(),cod=codigoPais(),h=infoLiturgica(hoy,cod),prox=proximosDias(hoy,10,cod);
  const otroNombre=h.principal.nombre!==h.nombreDia;
  const fila=x=>`<li class="${x.domingo?'dom':''}"><span class="lt-f">${DCORTO[x.fecha.getDay()]} ${x.fecha.getDate()} ${MCORTO[x.fecha.getMonth()]}</span><span class="lt-n">${esc(x.principal.nombre)}</span></li>`;
  return `<section class="c2 liturgico" aria-label="Tiempo litúrgico">
    <div class="lt-cab"><span>${esc(h.tiempo)}</span>${h.semana?`<small>${esc(h.semana)}</small>`:''}</div>
    <b class="lt-nombre">${esc(h.principal.nombre)}</b>
    ${h.principal.etiqueta&&!h.domingo?`<span class="lt-rango">${esc(h.principal.etiqueta)}</span>`:''}
    ${otroNombre?`<small class="lt-sub">${esc(h.nombreDia)}</small>`:''}
    <h3 class="lt-tit">Próximos días</h3>
    ${prox.length?`<ul class="lt-prox">${prox.map(fila).join('')}</ul>`:'<p class="vacio" style="margin:0">No hay días especiales en los próximos 10 días.</p>'}
  </section>`;
}

// ---------------------------------------------------------------------
// 6. ESTILOS  (los colores litúrgicos se diseñarán más adelante)
// ---------------------------------------------------------------------
const st=document.createElement('style');
st.textContent=`.liturgico{display:flex;flex-direction:column;gap:6px}
.liturgico .lt-cab{display:flex;align-items:baseline;justify-content:space-between;gap:8px;color:var(--oro-texto);font-weight:800;font-size:13px;text-transform:uppercase;letter-spacing:.04em}
.liturgico .lt-cab small{color:var(--gris);font-weight:700;text-transform:none;letter-spacing:0;font-size:12.5px}
.liturgico .lt-nombre{font-size:17px;line-height:1.3}
.liturgico .lt-sub{color:var(--gris);font-weight:600;font-size:13px}
.liturgico .lt-rango{align-self:flex-start;background:var(--oro-claro);color:var(--oro-texto);font-weight:800;font-size:12px;padding:2px 10px;border-radius:999px}
.liturgico .lt-tit{margin:14px 0 2px;font-size:14px;font-family:var(--fuente);font-weight:700;color:var(--gris)}
.liturgico .lt-prox{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:4px}
.liturgico .lt-prox li{display:flex;gap:10px;align-items:baseline;padding:6px 8px;border-radius:8px;font-size:13.5px;font-weight:600}
.liturgico .lt-prox li.dom{background:var(--oro-claro);color:var(--oro-texto);font-weight:800}
.liturgico .lt-f{flex:none;min-width:70px;color:var(--gris);font-weight:700}
.liturgico .lt-prox li.dom .lt-f{color:inherit}
.liturgico .lt-n{min-width:0;overflow-wrap:anywhere}
@media(max-width:860px){.col2 .barra-lateral{order:-1;flex-basis:100%}}`;
document.head.append(st);

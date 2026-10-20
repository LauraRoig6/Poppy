// Carteleras locales a demanda, sin suponer que TMDB conoce las salas.
// Las fuentes pueden cambiar su HTML: ante un fallo se devuelven enlaces, no datos inventados.
const SOURCES=[
 {id:'ocine',name:'OCINE Premium Estepark · Castellón',url:'https://estepark.es/cines/',official:'https://ocinepremiumestepark.es/',type:'estepark'},
 {id:'sucre',name:'Sucre Vila-real',url:'https://www.sucrecines.com/es/vila-real',official:'https://www.sucrecines.com/es/vila-real/cartellera',type:'sucre'},
 {id:'cinesa',name:'Cinesa La Salera · Castellón',url:'https://www.sensacine.com/cines/cine/E0654/',official:'https://www.sensacine.com/cines/cine/E0654/',type:'sensacine'}
];
const cache=new Map();
const decode=s=>String(s||'').replace(/&(?:amp|quot|apos|lt|gt|nbsp|#(\d+)|#x([0-9a-f]+));/gi,(full,d,h)=>d?String.fromCodePoint(Number(d)):h?String.fromCodePoint(parseInt(h,16)):{'&amp;':'&','&quot;':'"','&apos;':"'",'&lt;':'<','&gt;':'>','&nbsp;':' '}[full.toLowerCase()]||full);
const strip=s=>decode(String(s).replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,' ').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,' ').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim());
const uniq=rows=>[...new Map(rows.filter(x=>x.title.length>2&&x.title.length<110&&!/^(cartelera|comprar|entradas|precios|contacto|informaci[oó]n|pr[oó]ximamente)$/i.test(x.title)).map(x=>[x.title.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase(),x])).values()].slice(0,40);
const iso=d=>{const m=String(d||'').match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);return m?`${m[3]}-${m[2].padStart(2,'0')}-${m[1].padStart(2,'0')}`:''};
export function parseCinemaHTML(html,type,now=new Date()){
 const today=new Date(now.toISOString().slice(0,10)+'T00:00:00Z');
 if(type==='estepark'){
  const block=html.match(/CARTELERA[\s\S]{0,30000}/i)?.[0]||html;
  const linked=[...block.matchAll(/<h[234][^>]*>([\s\S]*?)<\/h[234]>\s*<h[234][^>]*>[\s\S]*?comprar entradas[\s\S]*?<\/h[234]>/gi)].map(m=>strip(m[1]));
  const headings=[...block.matchAll(/<h[234][^>]*>([\s\S]*?)<\/h[234]>/gi)].map(m=>strip(m[1]));
  const titles=headings.filter(t=>!/(^|\b)(cartelera|men[uú]|contacto|profesionales|avisos?|legal|estrenos actualizados)(\b|$)/i.test(t)&&!/^\*|^comprar entradas$/i.test(t));
  // Se publica cartelera actual; los estrenos futuros de estas salas no están confirmados.
  return {now:uniq(titles.map(title=>({title}))),upcoming:[]};
 }
 if(type==='sucre'){
  // The cinema homepage publishes a film selector followed by a distinct 'Próximamente' section.
  // Current and future films are NOT inferred from their release date alone.
  const headerAt=html.search(/Pr[oó]ximamente/i);
  const present=headerAt>=0?html.slice(0,headerAt):html;
  const future=headerAt>=0?html.slice(headerAt):'';
  function extract(block){
   const text=block.replace(/<\/(?:nav|a|option|li|h[1-6]|p|div|section)>/gi,'\n$&').split('\n').map(strip).filter(Boolean);
   return text.map(line=>line.match(/(?:^|\| )([A-ZÁÉÍÓÚÀÈÏÒÜÑÇ0-9][A-ZÁÉÍÓÚÀÈÏÒÜÑÇ0-9 '.:()\-–!¿?]{2,88}?)\s+Estreno:\s*(\d{1,2}\/\d{1,2}\/\d{4})/)).filter(Boolean).map(m=>({title:m[1].trim(),date:iso(m[2])}));
  }
  const allCurrent=extract(present),allFuture=extract(future);
  if(headerAt<0){const current=allCurrent.filter(x=>!x.date||new Date(x.date+'T00:00:00Z')<=today);const upcoming=allCurrent.filter(x=>x.date&&new Date(x.date+'T00:00:00Z')>today);return {now:uniq(current),upcoming:uniq(upcoming)};}
  // Upcoming cinema schedules may include titles showing this week that haven't premiered yet.
  const nearest=allCurrent.filter(x=>x.date&&new Date(x.date+'T00:00:00Z')>today);
  return {now:uniq(allCurrent.filter(x=>!x.date||new Date(x.date+'T00:00:00Z')<=today)),upcoming:uniq([...allFuture,...nearest])};
 }
 if(type==='sensacine'){
  const headings=[...html.matchAll(/<h2\b[^>]*>([\s\S]*?)<\/h2>/gi)];
  const rows=headings.map((match,i)=>{
    const title=strip(match[1]);const next=html.slice(match.index+match[0].length,(headings[i+1]?.index||html.length));
    const released=next.match(/(\d{1,2}) de (enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre) de (20\d{2})/i);
    const names=['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
    const date=released?`${released[3]}-${String(names.indexOf(released[2].toLowerCase())+1).padStart(2,'0')}-${released[1].padStart(2,'0')}`:'';
    return {title,date};
  });
  return {now:uniq(rows),upcoming:uniq(rows.filter(x=>x.date&&new Date(x.date+'T00:00:00Z')>today))};
 }
 return {now:[],upcoming:[]};
}
async function readSource(source){
 const hit=cache.get(source.id);if(hit&&Date.now()-hit.saved<60*60*1000)return hit.value;
 let value={...source,now:[],upcoming:[],error:'No se ha podido consultar la programación de esta sala.',checkedAt:new Date().toISOString()};
 try{
  const r=await fetch(source.url,{headers:{'User-Agent':'PoppyMovieGuide/1.0 (+movie discovery; public listings)','Accept':'text/html'},signal:AbortSignal.timeout(7000)});
  if(!r.ok)throw Error('HTTP '+r.status);
  const html=(await r.text()).slice(0,1500000);const parsed=parseCinemaHTML(html,source.type);
  if(!parsed.now.length&&!parsed.upcoming.length)throw Error('El listado no está disponible en formato legible');
  value={...source,...parsed,error:'',checkedAt:new Date().toISOString()};
 }catch(e){value.error='No se pudo leer la cartelera automáticamente. Consulta la web de la sala.';}
 cache.set(source.id,{saved:Date.now(),value});return value;
}
export default async function handler(req,res){
 res.setHeader('Content-Type','application/json');if(req.method!=='GET')return res.status(405).json({error:'Método no permitido'});
 const cinemas=await Promise.all(SOURCES.map(readSource));res.setHeader('Cache-Control','public, max-age=0, s-maxage=1800');res.status(200).json({cinemas,updatedAt:new Date().toISOString(),disclaimer:'Listado informativo; comprueba fechas y sesiones en la web de cada cine.'});
}

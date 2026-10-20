// Enrich confirmed local cinema listings with TMDB posters; TMDB is not the showtimes source.
const cache=new Map();
const normalize=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/gi,' ').toLowerCase().trim();
const poster=p=>p&&/^\/[\w.-]+$/.test(p)?`https://image.tmdb.org/t/p/w500${p}`:'';
export function bestCinemaMatch(title,movies){
 const original=normalize(title).replace(/^(vose|catalan|doblada|diferido|directo)\s+/,'').replace(/\s+(20 aniversario|vo|vose)$/,'').trim();
 if(!original)return null;
 const exact=(movies||[]).find(m=>normalize(m.title)===original||normalize(m.original_title)===original);
 const result=exact||((movies||[]).find(m=>{
  const t=normalize(m.title);return original.length>5&&(t.startsWith(original+' ')||original.startsWith(t+' '))&&Math.min(t.length,original.length)>5;
 }));
 return result&&result.id&&poster(result.poster_path)?{id:result.id,title:result.title,year:(result.release_date||'').slice(0,4),poster:poster(result.poster_path),backdrop:'',genres:[],runtime:null,overview:result.overview||'',ratings:[],people:[],cast:[]}:null;
}
export default async function handler(req,res){
 res.setHeader('Content-Type','application/json');
 if(req.method!=='GET')return res.status(405).json({error:'Método no permitido'});
 let titles=[];try{titles=JSON.parse(String(req.query?.titles||'[]'));}catch{}
 if(!Array.isArray(titles)||titles.length>10||titles.some(t=>typeof t!=='string'||t.length>110))return res.status(400).json({error:'Títulos no válidos'});
 const token=process.env.TMDB_READ_TOKEN?.trim();if(!token)return res.status(503).json({error:'Falta la conexión TMDB'});
 const entries=await Promise.all([...new Set(titles)].map(async title=>{
  const key=normalize(title),hit=cache.get(key);
  if(hit&&Date.now()-hit.at<6*3600000)return [title,hit.movie];
  let movie=null;
  try{const url=new URL('https://api.themoviedb.org/3/search/movie');url.searchParams.set('query',title.replace(/^(VOSE|CATALÁN|DIRECTO|DIFERIDO)\s*-?\s*/i,''));url.searchParams.set('language','es-ES');url.searchParams.set('region','ES');
   const r=await fetch(url,{headers:{Authorization:'Bearer '+token},signal:AbortSignal.timeout(6500)});
   if(r.ok)movie=bestCinemaMatch(title,(await r.json()).results);
  }catch{}
  cache.set(key,{movie,at:Date.now()});return [title,movie];
 }));
 res.setHeader('Cache-Control','public, max-age=0, s-maxage=3600');return res.status(200).json({movies:Object.fromEntries(entries)});
}

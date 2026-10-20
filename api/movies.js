import {normalizeRatings} from '../ratings.js';
import {watchServices} from '../v14.js';
const genres={28:'Acción',12:'Aventura',16:'Animación',35:'Comedia',80:'Crimen',99:'Documental',18:'Drama',10751:'Familia',14:'Fantasía',36:'Historia',27:'Terror',10402:'Música',9648:'Misterio',10749:'Romance',878:'Ciencia ficción',53:'Thriller',10752:'Bélica',37:'Western'};
const photo=(p,size='w500')=>p&&/^\/[\w.-]+$/.test(p)?`https://image.tmdb.org/t/p/${size}${p}`:'';
const detailCache=new Map();
const personCache=new Map();
const watchCache=new Map();
export default async function handler(req,res){
 res.setHeader('Content-Type','application/json');
 if(req.method!=='GET')return res.status(405).json({error:'Método no permitido'});
 const token=process.env.TMDB_READ_TOKEN?.trim();
 if(!token)return res.status(503).json({error:'Falta TMDB_READ_TOKEN en Vercel. Añádelo y pulsa Redeploy. En Ajustes tienes los pasos.',demo:true});
 try{
 const {q,id,page='1',similar,genre,max,feed,collection,withperson,service}=req.query||{};
 // Disponibilidad por suscripción (España), datos JustWatch servidos por TMDB.
 // Consultas limitadas y cacheadas para evitar ralentizar la interfaz.
 if(req.query?.watch){
  const ids=String(req.query.watch).split(',').filter(v=>/^\d{1,10}$/.test(v)).slice(0,40);
  if(!ids.length)return res.status(400).json({error:'Indica identificadores válidos.'});
  const result={};const headers={Authorization:'Bearer '+token};
  for(let i=0;i<ids.length;i+=5){await Promise.all(ids.slice(i,i+5).map(async id=>{
   const cached=watchCache.get(id);
   if(cached&&Date.now()-cached.time<6*3600000){result[id]=cached.data;return;}
   try{
    const r=await fetch('https://api.themoviedb.org/3/movie/'+id+'/watch/providers',{headers,signal:AbortSignal.timeout(6000)});
    if(!r.ok)throw Error('HTTP '+r.status);
    const d=await r.json();const es=d.results?.ES||{};
    const data={services:watchServices(es.flatrate),known:true,link:typeof es.link==='string'&&/^https:\/\//.test(es.link)?es.link:''};
    watchCache.set(id,{time:Date.now(),data});result[id]=data;
   }catch{result[id]={services:[],known:false,link:''};}
  }));}
  res.setHeader('Cache-Control','private, max-age=300');return res.status(200).json({availability:result,attribution:'Datos de disponibilidad: JustWatch a través de TMDB.'});
 }

 if((id&&!/^\d{1,10}$/.test(id))||(similar&&!/^\d{1,10}$/.test(similar))||(collection&&!/^\d{1,10}$/.test(collection)))return res.status(400).json({error:'Identificador inválido'});
 if(withperson&&!/^\d{1,10}$/.test(String(withperson)))return res.status(400).json({error:'Persona inválida'});
 if(req.query?.person&&!/^\d{1,10}$/.test(String(req.query.person)))return res.status(400).json({error:'Persona inválida'});
 if(q&&String(q).length>150)return res.status(400).json({error:'Búsqueda demasiado larga'});
 const cacheKey=`${id}:${req.query?.fast?'fast':'full'}:${!!process.env.MDBLIST_API_KEY}:${!!process.env.OMDB_API_KEY}`;
 const cached=id&&detailCache.get(cacheKey);
 if(cached&&Date.now()-cached.time<3600000){res.setHeader('Cache-Control','public, max-age=0, s-maxage=3600');return res.status(200).json(cached.data);}
 if(req.query?.person){
 const suppliedId=String(req.query.person),name=String(req.query.name||'').trim().slice(0,120),role=String(req.query.role||'');
 const cacheId=suppliedId+':'+name+':'+role,hit=personCache.get(cacheId);
 if(hit&&Date.now()-hit.time<3600000)return res.status(200).json(hit.data);
 const headers={Authorization:'Bearer '+token};
 const request=async url=>{
  try{const r=await fetch(url,{headers,signal:AbortSignal.timeout(12000)});
   if(!r.ok)return {status:r.status,data:null};
   return {status:200,data:await r.json()};
  }catch(e){return {status:0,data:null};}
 };
 // Los créditos son el dato necesario. Una biografía vacía, error temporal o 404
 // no deben impedir mostrar una filmografía que sí existe.
 let personId=suppliedId;
 let credits=await request('https://api.themoviedb.org/3/person/'+personId+'/movie_credits?language=es-ES');
 let profile=null;
 if((!credits.data||(!credits.data.cast?.length&&!credits.data.crew?.length))&&name){
  const u=new URL('https://api.themoviedb.org/3/search/person');
  u.searchParams.set('query',name);u.searchParams.set('language','es-ES');
  const found=await request(u);
  const normalize=v=>String(v||'').toLocaleLowerCase('es').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim();
  const choices=found.data?.results||[];
  const match=choices.find(x=>normalize(x.name)===normalize(name))||choices.find(x=>role==='Dirección'?x.known_for_department==='Directing':x.known_for_department==='Acting')||choices[0];
  if(match){personId=String(match.id);profile=match;credits=await request('https://api.themoviedb.org/3/person/'+personId+'/movie_credits?language=es-ES');}
 }
 if(!credits.data)return res.status(502).json({error:'No se pudieron consultar los créditos en TMDB (HTTP '+(credits.status||'red')+'). Prueba de nuevo.'});
 // Perfil informativo opcional: se obtiene solo tras disponer de la filmografía.
 if(!profile){const details=await request('https://api.themoviedb.org/3/person/'+personId+'?language=es-ES');profile=details.data;}
 const wanted=role==='Dirección';
 const entries=wanted?(credits.data.crew||[]).filter(x=>x.job==='Director'):[...(credits.data.cast||[]),...(credits.data.crew||[]).filter(x=>x.job==='Director')];
 const movies=entries.filter(x=>!x.adult&&x.id).map(x=>({id:x.id,title:x.title||x.original_title||'',year:(x.release_date||'').slice(0,4),poster:photo(x.poster_path),overview:x.overview||'',genres:(x.genre_ids||[]).map(g=>genres[g]).filter(Boolean),cast:[],ratings:[],people:[],runtime:null}));
 const data={person:{id:Number(personId),name:profile?.name||name||'Filmografía',biography:profile?.biography||''},movies:[...new Map(movies.map(x=>[x.id,x])).values()].sort((a,b)=>(Number(b.year)||0)-(Number(a.year)||0))};
 personCache.set(cacheId,{time:Date.now(),data});res.setHeader('Cache-Control','public, max-age=0, s-maxage=3600');return res.status(200).json(data);
 }

 const feedType=['popular','now','upcoming','top','streaming','streaming-new','radar','digital','session'].includes(feed)?feed:'popular';
 const path=collection?`collection/${collection}`:id?`movie/${id}`:similar?`movie/${similar}/recommendations`:q?'search/movie':'discover/movie';
 const url=new URL('https://api.themoviedb.org/3/'+path);url.searchParams.set('language','es-ES');url.searchParams.set('region','ES');url.searchParams.set('include_adult','false');
 if(id){url.searchParams.set('append_to_response','credits,images');url.searchParams.set('include_image_language','es,en,null');}
 else {url.searchParams.set('page',String(Math.min(50,Math.max(1,Number(page)||1))));if(q)url.searchParams.set('query',q);if(!q&&!similar&&['popular','top','streaming','streaming-new','radar','now','upcoming','digital','session'].includes(feedType)){url.searchParams.set('sort_by','popularity.desc');url.searchParams.set('vote_count.gte','50');url.searchParams.set('primary_release_date.lte',new Date().toISOString().slice(0,10));if(feedType==='top'){url.searchParams.set('sort_by','vote_average.desc');url.searchParams.set('vote_count.gte','250');url.searchParams.set('primary_release_date.gte','1990-01-01');}if(feedType==='radar'){if(withperson)url.searchParams.set('with_people',String(withperson));const t=new Date(),end=new Date(t);end.setMonth(end.getMonth()+6);url.searchParams.set('sort_by','popularity.desc');url.searchParams.set('primary_release_date.gte',t.toISOString().slice(0,10));url.searchParams.set('primary_release_date.lte',end.toISOString().slice(0,10));url.searchParams.delete('vote_count.gte');url.searchParams.delete('primary_release_date.lte');url.searchParams.set('primary_release_date.lte',end.toISOString().slice(0,10));}
 if(['now','upcoming','digital'].includes(feedType)){
  const start=new Date(),end=new Date(start);end.setDate(end.getDate()+(feedType==='now'?2:120));
  const today=start.toISOString().slice(0,10);
  url.searchParams.delete('vote_count.gte');url.searchParams.delete('primary_release_date.lte');
  url.searchParams.set('with_release_type',feedType==='digital'?'4':'2|3');
  url.searchParams.set('release_date.gte',feedType==='now'?new Date(start.getTime()-14*86400000).toISOString().slice(0,10):today);
  url.searchParams.set('release_date.lte',end.toISOString().slice(0,10));
  url.searchParams.set('sort_by','popularity.desc');
 }
 if(feedType==='session'&&service&&service!=='any'){
  const providers={'Netflix':'8','Prime Video':'9|119','Disney+':'337','Crunchyroll':'283|122'};
  if(providers[service]){
   url.searchParams.set('watch_region','ES');
   url.searchParams.set('with_watch_monetization_types','flatrate');
   url.searchParams.set('with_watch_providers',providers[service]);
  }
 }
 if(['streaming','streaming-new'].includes(feedType)){url.searchParams.set('watch_region','ES');url.searchParams.set('with_watch_monetization_types','flatrate');url.searchParams.set('with_watch_providers','8|9|119|337|122|283');url.searchParams.set('sort_by','popularity.desc');if(feedType==='streaming-new'){const cutoff=new Date();cutoff.setMonth(cutoff.getMonth()-8);url.searchParams.set('primary_release_date.gte',cutoff.toISOString().slice(0,10));}}if(Object.keys(genres).includes(String(genre)))url.searchParams.set('with_genres',genre);if(Number(max)>0&&Number(max)<999){url.searchParams.set('with_runtime.lte',String(Number(max)));url.searchParams.set('with_runtime.gte','1');}}}
 const response=await fetch(url,{headers:{Authorization:`Bearer ${token}`},signal:AbortSignal.timeout(10000)});
 if(!response.ok)throw Error(response.status===401?'TMDB no reconoce el token. Copia el Token de acceso de lectura completo, guarda y haz Redeploy.':response.status===429?'TMDB ha limitado las consultas. Espera un momento y vuelve a probar.':'El catálogo no responde. Inténtalo de nuevo.');
 const data=await response.json();
 const normalize=m=>({id:m.id,title:m.title,year:m.release_date?.slice(0,4)||'',poster:photo(m.poster_path),backdrop:photo(m.backdrop_path,'w780'),posterAlternatives:(m.images?.posters||[]).filter(p=>p.file_path!==m.poster_path).slice(0,4).map(p=>photo(p.file_path)),overview:m.overview||'Sin sinopsis disponible.',genres:m.genres?.map(g=>g.name)||m.genre_ids?.map(g=>genres[g]).filter(Boolean)||[],runtime:m.runtime||null,director:m.credits?.crew?.filter(c=>c.job==='Director').map(c=>c.name).join(', ')||'',cast:m.credits?.cast?.slice(0,12).map(c=>c.name)||[],people:[...(m.credits?.crew||[]).filter(c=>c.job==='Director').map(c=>({id:c.id,name:c.name,photo:photo(c.profile_path,'w185'),role:'Dirección',character:''})),...(m.credits?.cast||[]).slice(0,12).map(c=>({id:c.id,name:c.name,photo:photo(c.profile_path,'w185'),role:'Reparto',character:c.character||''}))],tmdb:m.vote_count?m.vote_average:null,imdbId:m.imdb_id||'',collectionId:m.belongs_to_collection?.id||null,collectionName:m.belongs_to_collection?.name||'',ratings:[],full:!!id,fetchedAt:id?new Date().toISOString():null});
 const result=collection?{collectionId:Number(collection),name:data.name||'',movies:(data.parts||[]).filter(m=>!m.adult).map(normalize)}:id?normalize(data):{movies:(data.results||[]).filter(m=>!m.adult).map(normalize),page:data.page,totalPages:Math.min(50,data.total_pages||1),genres};
 if(id){
 result.ratings=normalizeRatings({});result.ratingsState=req.query?.fast?'loading':process.env.MDBLIST_API_KEY?'loading':'unconfigured';
 if(process.env.MDBLIST_API_KEY&&!req.query?.fast){try{
 const u=new URL(`https://api.mdblist.com/tmdb/movie/${id}`);u.searchParams.set('apikey',process.env.MDBLIST_API_KEY);
 const r=await fetch(u,{signal:AbortSignal.timeout(8000)});if(!r.ok)throw Error('MDBList no disponible ('+r.status+')');
 const d=await r.json();if(!Array.isArray(d.ratings))throw Error('Sin puntuaciones en el proveedor');result.ratings=normalizeRatings(d);result.ratingsState='ok';result.ratingsFetchedAt=new Date().toISOString();
 }catch{result.ratingsState='error';}}
 if(!req.query?.fast&&process.env.OMDB_API_KEY&&data.imdb_id&&(!result.ratings.find(r=>r.key==='imdb')?.Value||!result.ratings.find(r=>r.key==='tomatoes')?.Value)){
 try{const u=new URL('https://www.omdbapi.com/');u.searchParams.set('apikey',process.env.OMDB_API_KEY);u.searchParams.set('i',data.imdb_id);const r=await fetch(u,{signal:AbortSignal.timeout(6000)});const o=await r.json();if(!r.ok||o.Response==='False')throw Error();
 for(const rating of o.Ratings||[]){const key=rating.Source==='Internet Movie Database'?'imdb':rating.Source==='Rotten Tomatoes'?'tomatoes':null;const slot=result.ratings.find(x=>x.key===key);if(slot&&!slot.Value)slot.Value=String(rating.Value);}
 if(result.ratingsState==='unconfigured')result.ratingsState='partial';result.ratingsFetchedAt=new Date().toISOString();
 }catch{if(result.ratingsState==='unconfigured')result.ratingsState='error';}}
 
 result.ratings.push({key:'filmaffinity',Source:'FilmAffinity',Value:'',unavailable:true});
 if(result.ratingsState!=='error'){if(detailCache.size>200)detailCache.delete(detailCache.keys().next().value);detailCache.set(cacheKey,{time:Date.now(),data:result});}
 }
 res.setHeader('Cache-Control',id&&result.ratingsState==='error'?'no-store':'public, max-age=0, s-maxage=3600');return res.status(200).json(result);
 }catch(e){return res.status(502).json({error:e.message||'No se ha podido consultar el catálogo.'});}
}

import {normalizeRatings} from '../ratings.js';
const genres={28:'Acción',12:'Aventura',16:'Animación',35:'Comedia',80:'Crimen',99:'Documental',18:'Drama',10751:'Familia',14:'Fantasía',36:'Historia',27:'Terror',10402:'Música',9648:'Misterio',10749:'Romance',878:'Ciencia ficción',53:'Thriller',10752:'Bélica',37:'Western'};
const photo=(p,size='w500')=>p&&/^\/[\w.-]+$/.test(p)?`https://image.tmdb.org/t/p/${size}${p}`:'';
const detailCache=new Map();
export default async function handler(req,res){
 res.setHeader('Content-Type','application/json');
 if(req.method!=='GET')return res.status(405).json({error:'Método no permitido'});
 const token=process.env.TMDB_READ_TOKEN?.trim();
 if(!token)return res.status(503).json({error:'Falta TMDB_READ_TOKEN en Vercel. Añádelo y pulsa Redeploy. En Ajustes tienes los pasos.',demo:true});
 try{
 const {q,id,page='1',similar,genre,max,feed}=req.query||{};
 if((id&&!/^\d{1,10}$/.test(id))||(similar&&!/^\d{1,10}$/.test(similar)))return res.status(400).json({error:'Identificador inválido'});
 if(q&&String(q).length>150)return res.status(400).json({error:'Búsqueda demasiado larga'});
 const cacheKey=`${id}:${!!process.env.MDBLIST_API_KEY}:${!!process.env.OMDB_API_KEY}`;
 const cached=id&&detailCache.get(cacheKey);
 if(cached&&Date.now()-cached.time<3600000){res.setHeader('Cache-Control','public, max-age=0, s-maxage=3600');return res.status(200).json(cached.data);}
 const feedType=['popular','now','upcoming','top'].includes(feed)?feed:'popular';
 const path=id?`movie/${id}`:similar?`movie/${similar}/recommendations`:q?'search/movie':feedType==='now'?'movie/now_playing':feedType==='upcoming'?'movie/upcoming':feedType==='top'?'movie/top_rated':'discover/movie';
 const url=new URL('https://api.themoviedb.org/3/'+path);url.searchParams.set('language','es-ES');url.searchParams.set('include_adult','false');
 if(id){url.searchParams.set('append_to_response','credits,images');url.searchParams.set('include_image_language','es,en,null');}
 else {url.searchParams.set('page',String(Math.min(50,Math.max(1,Number(page)||1))));if(q)url.searchParams.set('query',q);if(!q&&!similar&&feedType==='popular'){url.searchParams.set('sort_by','popularity.desc');url.searchParams.set('vote_count.gte','50');url.searchParams.set('primary_release_date.lte',new Date().toISOString().slice(0,10));if(Object.keys(genres).includes(String(genre)))url.searchParams.set('with_genres',genre);if(Number(max)>0&&Number(max)<999){url.searchParams.set('with_runtime.lte',String(Number(max)));url.searchParams.set('with_runtime.gte','1');}}}
 const response=await fetch(url,{headers:{Authorization:`Bearer ${token}`},signal:AbortSignal.timeout(10000)});
 if(!response.ok)throw Error(response.status===401?'TMDB no reconoce el token. Copia el Token de acceso de lectura completo, guarda y haz Redeploy.':response.status===429?'TMDB ha limitado las consultas. Espera un momento y vuelve a probar.':'El catálogo no responde. Inténtalo de nuevo.');
 const data=await response.json();
 const normalize=m=>({id:m.id,title:m.title,year:m.release_date?.slice(0,4)||'',poster:photo(m.poster_path),posterAlternatives:(m.images?.posters||[]).filter(p=>p.file_path!==m.poster_path).slice(0,4).map(p=>photo(p.file_path)),overview:m.overview||'Sin sinopsis disponible.',genres:m.genres?.map(g=>g.name)||m.genre_ids?.map(g=>genres[g]).filter(Boolean)||[],runtime:m.runtime||null,director:m.credits?.crew?.filter(c=>c.job==='Director').map(c=>c.name).join(', ')||'',cast:m.credits?.cast?.slice(0,12).map(c=>c.name)||[],people:[...(m.credits?.crew||[]).filter(c=>c.job==='Director').map(c=>({id:c.id,name:c.name,photo:photo(c.profile_path,'w185'),role:'Dirección',character:''})),...(m.credits?.cast||[]).slice(0,12).map(c=>({id:c.id,name:c.name,photo:photo(c.profile_path,'w185'),role:'Reparto',character:c.character||''}))],tmdb:m.vote_count?m.vote_average:null,imdbId:m.imdb_id||'',collectionId:m.belongs_to_collection?.id||null,collectionName:m.belongs_to_collection?.name||'',ratings:[],full:!!id,fetchedAt:id?new Date().toISOString():null});
 const result=id?normalize(data):{movies:data.results.filter(m=>!m.adult).map(normalize),page:data.page,totalPages:Math.min(50,data.total_pages||1),genres};
 if(id){
 result.ratings=normalizeRatings({});result.ratingsState='unconfigured';
 if(process.env.MDBLIST_API_KEY){try{
 const u=new URL(`https://api.mdblist.com/tmdb/movie/${id}`);u.searchParams.set('apikey',process.env.MDBLIST_API_KEY);
 const r=await fetch(u,{signal:AbortSignal.timeout(8000)});if(!r.ok)throw Error('MDBList no disponible ('+r.status+')');
 const d=await r.json();if(!Array.isArray(d.ratings))throw Error('Sin puntuaciones en el proveedor');result.ratings=normalizeRatings(d);result.ratingsState='ok';result.ratingsFetchedAt=new Date().toISOString();
 }catch{result.ratingsState='error';}}
 if(process.env.OMDB_API_KEY&&data.imdb_id&&(!result.ratings.find(r=>r.key==='imdb')?.Value||!result.ratings.find(r=>r.key==='tomatoes')?.Value)){
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

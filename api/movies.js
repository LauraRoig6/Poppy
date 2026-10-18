const genres={28:'Acción',12:'Aventura',16:'Animación',35:'Comedia',80:'Crimen',99:'Documental',18:'Drama',10751:'Familia',14:'Fantasía',36:'Historia',27:'Terror',10402:'Música',9648:'Misterio',10749:'Romance',878:'Ciencia ficción',53:'Thriller',10752:'Bélica',37:'Western'};
export default async function handler(req,res){
 res.setHeader('Content-Type','application/json');
 if(req.method!=='GET')return res.status(405).json({error:'Método no permitido'});
 const token=process.env.TMDB_READ_TOKEN;
 if(!token)return res.status(503).json({error:'Configura TMDB_READ_TOKEN para activar el catálogo completo.',demo:true});
 try{
 const {q,id,page='1'}=req.query||{};
 if(id&&!/^\d{1,10}$/.test(id))return res.status(400).json({error:'Identificador inválido'});
 if(q&&String(q).length>150)return res.status(400).json({error:'Búsqueda demasiado larga'});
 const path=id?`movie/${id}`:q?'search/movie':'movie/popular';
 const url=new URL('https://api.themoviedb.org/3/'+path);url.searchParams.set('language','es-ES');url.searchParams.set('include_adult','false');
 if(id)url.searchParams.set('append_to_response','credits');
 else {url.searchParams.set('page',String(Math.min(20,Math.max(1,Number(page)||1))));if(q)url.searchParams.set('query',q);}
 const response=await fetch(url,{headers:{Authorization:`Bearer ${token}`},signal:AbortSignal.timeout(10000)});
 if(!response.ok)throw Error('El catálogo no está disponible. Revisa la configuración e inténtalo de nuevo.');
 const data=await response.json();
 const normalize=m=>({id:m.id,title:m.title,year:m.release_date?.slice(0,4)||'',poster:m.poster_path?`https://image.tmdb.org/t/p/w500${m.poster_path}`:'',overview:m.overview||'Sin sinopsis disponible.',genres:m.genres?.map(g=>g.name)||m.genre_ids?.map(g=>genres[g]).filter(Boolean)||[],runtime:m.runtime||null,director:m.credits?.crew?.filter(c=>c.job==='Director').map(c=>c.name).join(', ')||'',cast:m.credits?.cast?.slice(0,5).map(c=>c.name)||[],tmdb:m.vote_count?m.vote_average:null,imdbId:m.imdb_id||'',ratings:[],full:!!id});
 const result=id?normalize(data):{movies:data.results.filter(m=>!m.adult).map(normalize)};
 if(id&&data.imdb_id&&process.env.OMDB_API_KEY){try{const u=new URL('https://www.omdbapi.com/');u.searchParams.set('apikey',process.env.OMDB_API_KEY);u.searchParams.set('i',data.imdb_id);const o=await fetch(u,{signal:AbortSignal.timeout(6000)}).then(r=>r.json());result.ratings=(o.Ratings||[]).filter(r=>['Internet Movie Database','Rotten Tomatoes'].includes(r.Source));}catch{result.ratingsUnavailable=true;}}
 res.setHeader('Cache-Control','public, s-maxage=3600');return res.status(200).json(result);
 }catch(e){return res.status(502).json({error:e.message||'No se ha podido consultar el catálogo.'});}
}

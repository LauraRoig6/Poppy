export const DAY=86400000;
export function candidates(movies,records,genre='',max=999,pending=false,now=Date.now()){
 return movies.filter(m=>{const r=records[m.id]?.deleted?null:records[m.id];return r?.status!=='seen'&&r?.status!=='dismissed'&&!(r?.skipUntil>now)&&(!genre||m.genres.includes(genre))&&(!pending||r?.status==='pending')&&(max===999||(m.runtime&&m.runtime<=max));});
}
export function taste(records){const weights={};for(const r of Object.values(records)){if(r.deleted||r.status!=='seen'||r.score==null)continue;for(const g of r.movie.genres)weights[g]=(weights[g]||0)+(r.score-5.5)/Math.sqrt(r.movie.genres.length||1);}return weights;}
export function rankMovies(movies,records){const weights=taste(records);return [...movies].sort((a,b)=>affinity(b,weights)-affinity(a,weights));}
export function affinity(movie,weights){return movie.genres.reduce((s,g)=>s+(weights[g]||0),0)/Math.sqrt(movie.genres.length||1);}
export function mergeRecords(a,b){const result={...a};for(const [id,r] of Object.entries(b)){if(!result[id]||(r.updatedAt||0)>(result[id].updatedAt||0))result[id]=r;}return result;}
export function validateBackup(v){
 const bad=()=>{throw Error('La copia contiene datos no válidos.');};
 if(![1,2].includes(v?.version)||!v.records||typeof v.records!=='object'||Array.isArray(v.records)||Object.keys(v.records).length>20000)bad();
 const str=x=>x==null||typeof x==='string';const number=(x,max)=>x==null||(Number.isFinite(x)&&x>=0&&x<=max);
 for(const [id,r] of Object.entries(v.records)){
 if(!/^\d{1,10}$/.test(id)||!r||!number(r.updatedAt,1e15)||!number(r.skipUntil,1e15)||!number(r.chosenAt,1e15))bad();
 if(r.deleted===true)continue;
 const m=r.movie;
 if(!['pending','seen','dismissed','none'].includes(r.status)||!m||m.id!==Number(id)||typeof m.title!=='string'||!Array.isArray(m.genres)||!m.genres.every(x=>typeof x==='string')||typeof m.overview!=='string'||!Array.isArray(m.cast)||!m.cast.every(x=>typeof x==='string')||!Array.isArray(m.ratings)||!m.ratings.every(x=>x&&typeof x.Source==='string'&&typeof x.Value==='string')||!number(r.score,10)||!number(m.runtime,10000)||!number(m.tmdb,10)||![r.date,r.note,m.poster,m.director,m.year].every(str))bad();
 if(m.posterAlternatives&&(!Array.isArray(m.posterAlternatives)||!m.posterAlternatives.every(x=>typeof x==='string')))bad();
 if(m.people&&!Array.isArray(m.people))bad();
 if(m.people&&!m.people.every(p=>p&&Number.isSafeInteger(p.id)&&typeof p.name==='string'&&str(p.photo)&&str(p.role)&&str(p.character)))bad();
 }return v.records;
}
export function parseScore(input){if(String(input).trim()==='')return null;const n=Number(String(input).replace(',','.'));if(!Number.isFinite(n)||n<0||n>10)throw Error('Escribe una nota entre 0 y 10; por ejemplo, 8,75.');return n;}
export function isStale(movie,now=Date.now()){return !movie?.full||movie.demo||!movie.fetchedAt||now-Date.parse(movie.fetchedAt)>DAY;}

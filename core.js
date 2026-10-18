export function candidates(movies,records,genre='',max=999,pending=false){return movies.filter(m=>records[m.id]?.status!=='seen'&&records[m.id]?.status!=='dismissed'&&(!genre||m.genres.includes(genre))&&(!pending||records[m.id]?.status==='pending')&&(max===999||(m.runtime&&m.runtime<=max)));}
export function validateBackup(v){
 const bad=()=>{throw Error('La copia contiene datos no válidos');};
 if(v?.version!==1||!v.records||typeof v.records!=='object'||Array.isArray(v.records))bad();
 const str=x=>x==null||typeof x==='string';const number=(x,max)=>x==null||(Number.isFinite(x)&&x>=0&&x<=max);
 for(const [id,r] of Object.entries(v.records)){
 const m=r?.movie;
 if(!/^\d{1,10}$/.test(id)||!r||!['pending','seen','dismissed','none'].includes(r.status)||!m||m.id!==Number(id)||typeof m.title!=='string'||!Array.isArray(m.genres)||!m.genres.every(x=>typeof x==='string')||typeof m.overview!=='string'||!Array.isArray(m.cast)||!m.cast.every(x=>typeof x==='string')||!Array.isArray(m.ratings)||!m.ratings.every(x=>x&&typeof x.Source==='string'&&typeof x.Value==='string')||!number(r.score,10)||!number(r.letterboxd,5)||!number(r.filmaffinity,10)||!number(m.runtime,10000)||!number(m.tmdb,10)||![r.date,r.note,m.poster,m.director,m.year].every(str))bad();
 }return v.records;
}

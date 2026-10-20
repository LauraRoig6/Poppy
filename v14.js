// Funciones puras v14. Todas las colecciones automáticas son vistas, no datos duplicados.
export const SERVICES=['Netflix','Prime Video','Disney+','Crunchyroll'];
const normalizeText=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('es');
export function classifyProvider(name){const s=normalizeText(name);if(s.includes('netflix'))return 'Netflix';if(s.includes('amazon prime')||s.includes('prime video'))return 'Prime Video';if(s.includes('disney'))return 'Disney+';if(s.includes('crunchyroll'))return 'Crunchyroll';return null;}
export function watchServices(providers){return [...new Set((Array.isArray(providers)?providers:[]).map(p=>classifyProvider(p.provider_name)).filter(Boolean))];}
export function autoCollections(records){
 const valid=Object.values(records).filter(r=>!r?.deleted&&r?.movie);
 const group=(name,icon,predicate)=>({id:name,name,icon,movies:valid.filter(predicate).map(r=>r.movie)});
 const groups=[
  group('Mis dieces','⭐',r=>r.status==='seen'&&Number(r.score)===10),
  group('Terror pendiente','🎃',r=>r.status==='pending'&&r.movie.genres?.includes('Terror')),
  group('Cine de los 90','📼',r=>Number(r.movie.year)>=1990&&Number(r.movie.year)<=1999&&['pending','seen'].includes(r.status)),
  group('Pendientes prioritarias','🔥',r=>r.status==='pending'&&!!r.priority)
 ];
 const directors={};for(const r of valid.filter(r=>r.status==='seen'&&Number(r.score)>=8)){for(const name of String(r.movie.director||'').split(',').map(x=>x.trim()).filter(Boolean))directors[name]=(directors[name]||0)+1;}
 const favorite=Object.entries(directors).sort((a,b)=>b[1]-a[1])[0]?.[0];
 if(favorite)groups.push(group('Favoritas de '+favorite,'🎥',r=>r.status==='seen'&&Number(r.score)>=8&&String(r.movie.director||'').split(',').map(x=>x.trim()).includes(favorite)));
 return groups;
}
export function chooseSession(pending,records,{genre='',max=999,platform='any',availability={}}={}){
 const films=pending.filter(m=>(!genre||m.genres?.includes(genre))&&(max===999||m.runtime&&m.runtime<=max)&&(platform==='any'||(availability[m.id]?.services||[]).includes(platform)));
 return [...films].sort((a,b)=>Number(!!records[b.id]?.priority)-Number(!!records[a.id]?.priority))[0]||null;
}
export function sagaProgress(movies,records){const seen=movies.filter(m=>records[m.id]?.status==='seen'&&!records[m.id]?.deleted).length;const total=movies.length;const next=[...movies].sort((a,b)=>(Number(a.year)||9999)-(Number(b.year)||9999)).find(m=>records[m.id]?.deleted||records[m.id]?.status!=='seen')||null;return {seen,total,percent:total?Math.round(100*seen/total):0,next};}
export function movieLinks(focus,candidates){
 const director=normalizeText(focus.director).split(',').map(x=>x.trim()).filter(Boolean);
 const cast=(focus.cast||[]).map(normalizeText);
 const linked=[];
 for(const m of candidates){if(m.id===focus.id)continue;const reasons=[];
  if(focus.collectionId&&focus.collectionId===m.collectionId)reasons.push('Misma saga');
  if(director.length&&normalizeText(m.director).split(',').some(x=>director.includes(x.trim())&&x.trim()))reasons.push('Misma dirección');
  if(cast.length){const name=(m.cast||[]).find(n=>cast.includes(normalizeText(n)));if(name)reasons.push('Reparto compartido: '+name);}
  if(!reasons.length){const g=(m.genres||[]).filter(g=>(focus.genres||[]).includes(g));if(g.length>=2)reasons.push('Géneros compartidos: '+g.slice(0,2).join(' y '));}
  if(reasons.length)linked.push({movie:m,reasons});
 }
 return linked.sort((a,b)=>((b.reasons[0]?.startsWith('Misma saga')?3:b.reasons[0]?.startsWith('Misma dirección')?2:1)-(a.reasons[0]?.startsWith('Misma saga')?3:a.reasons[0]?.startsWith('Misma dirección')?2:1))).slice(0,6);
}

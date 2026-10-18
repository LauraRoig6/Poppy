import {validateBackup} from './core.js';
let config=null,session=null,refreshing=null;
try{session=JSON.parse(localStorage.getItem('poppy-session')||'null');}catch{}
export function configureCloud(c){config=c;}
export function cloudUser(){return session?.user||null;}
export function cloudEnabled(){return !!config;}
async function auth(path,body){if(!config)throw Error('Primero configura Supabase en Vercel.');const r=await fetch(config.url+'/auth/v1/'+path,{method:'POST',headers:{apikey:config.key,'Content-Type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(12000)});const d=await r.json();if(!r.ok)throw Error(d.msg||d.error_description||d.message||'No se pudo iniciar sesión.');return d;}
function setSession(d){session={access_token:d.access_token,refresh_token:d.refresh_token,expires_at:d.expires_at||Math.floor(Date.now()/1000)+d.expires_in,user:d.user};localStorage.setItem('poppy-session',JSON.stringify(session));}
export async function login(email,password){setSession(await auth('token?grant_type=password',{email,password}));return cloudUser();}
export async function signup(email,password){const d=await auth('signup',{email,password});if(d.access_token)setSession(d);return !!d.access_token;}
export async function logout(){if(session&&config){try{await fetch(config.url+'/auth/v1/logout',{method:'POST',headers:{apikey:config.key,Authorization:'Bearer '+session.access_token},signal:AbortSignal.timeout(5000)});}catch{}}session=null;localStorage.removeItem('poppy-session');}
async function token(){if(!session)throw Error('Inicia sesión para sincronizar.');if(session.expires_at*1000<Date.now()+60000){if(!refreshing)refreshing=auth('token?grant_type=refresh_token',{refresh_token:session.refresh_token}).then(setSession).finally(()=>refreshing=null);await refreshing;}return session.access_token;}
export async function syncRecords(changes){if(!config)throw Error('Configura Supabase para sincronizar.');const t=await token();const r=await fetch(config.url+'/rest/v1/rpc/poppy_sync',{method:'POST',headers:{apikey:config.key,Authorization:'Bearer '+t,'Content-Type':'application/json'},body:JSON.stringify({changes}),signal:AbortSignal.timeout(15000)});const d=await r.json();if(!r.ok)throw Error(r.status===401?'Tu sesión ha caducado. Vuelve a entrar.':'No se pudo sincronizar. Revisa Supabase y que hayas ejecutado supabase.sql. Tus cambios siguen guardados aquí.');return validateBackup({version:2,records:d});}

// Poppy v9: las carpetas pueden guardar también un icono y un banner.
export async function syncFolders(localFolders){
 if(!config||!session)return localFolders;
 const t=await token();
 const headers={apikey:config.key,Authorization:'Bearer '+t,'Content-Type':'application/json'};
 const base=config.url+'/rest/v1/poppy_folders';
 let richSchema=true;
 let response=await fetch(base+'?select=id,name,movies,updated_at,deleted,icon,banner',{headers,signal:AbortSignal.timeout(15000)});
 if(!response.ok){
  richSchema=false;
  response=await fetch(base+'?select=id,name,movies,updated_at,deleted',{headers,signal:AbortSignal.timeout(15000)});
 }
 if(!response.ok)throw Error('Activa las colecciones sincronizadas ejecutando poppy-folders.sql en Supabase.');
 const remote=await response.json();
 const merged=new Map(remote.map(r=>[r.id,{id:r.id,name:r.name,movies:r.movies,updatedAt:Number(r.updated_at),deleted:r.deleted,icon:r.icon||'🎬',banner:r.banner||''}]));
 const modified=[];
 for(const f of localFolders){const other=merged.get(f.id);if(!other||f.updatedAt>other.updatedAt){merged.set(f.id,f);modified.push(f);}}
 if(modified.length){
  const payload=modified.map(f=>({user_id:session.user.id,id:f.id,name:f.name,movies:f.movies,updated_at:f.updatedAt,deleted:!!f.deleted,icon:f.icon||'🎬',banner:f.banner||''}));
  let r=await fetch(base+'?on_conflict=user_id,id',{method:'POST',headers:{...headers,Prefer:'resolution=merge-duplicates,return=minimal'},body:JSON.stringify(richSchema?payload:payload.map(({icon,banner,...rest})=>rest)),signal:AbortSignal.timeout(15000)});
  if(!r.ok&&richSchema){
   richSchema=false;
   r=await fetch(base+'?on_conflict=user_id,id',{method:'POST',headers:{...headers,Prefer:'resolution=merge-duplicates,return=minimal'},body:JSON.stringify(payload.map(({icon,banner,...rest})=>rest)),signal:AbortSignal.timeout(15000)});
  }
  if(!r.ok)throw Error('No se han podido sincronizar las carpetas.');
 }
 return [...merged.values()];
}

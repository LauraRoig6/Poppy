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

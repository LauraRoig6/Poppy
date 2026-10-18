export default function handler(req,res){
 res.setHeader('Cache-Control','no-store');
 if(req.method!=='GET')return res.status(405).json({error:'Método no permitido'});
 const url=process.env.SUPABASE_URL||'',key=process.env.SUPABASE_ANON_KEY||'';
 // Only public/publishable keys can ever leave this endpoint.
 let safe=key.startsWith('sb_publishable_');
 if(!safe&&key.split('.').length===3){try{safe=JSON.parse(Buffer.from(key.split('.')[1],'base64url')).role==='anon';}catch{}}
 res.json({tmdb:!!process.env.TMDB_READ_TOKEN,mdb:!!process.env.MDBLIST_API_KEY,omdb:!!process.env.OMDB_API_KEY,supabase:/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(url)&&safe?{url,key}:null});
}

import test from 'node:test';
import assert from 'node:assert/strict';
import handler from '../api/movies.js';
const originalFetch=globalThis.fetch;
const originalToken=process.env.TMDB_READ_TOKEN;
function res(){return {code:200,headers:{},setHeader(k,v){this.headers[k]=v;},status(n){this.code=n;return this;},json(data){this.data=data;return this;}};}
test('Christopher Nolan 525 loads director movie credits even if biography fails',async()=>{
 process.env.TMDB_READ_TOKEN='test-token';const paths=[];
 globalThis.fetch=async u=>{const path=new URL(String(u)).pathname;paths.push(path);
  if(path.endsWith('/movie_credits'))return {ok:true,status:200,json:async()=>({cast:[],crew:[{id:27205,title:'Origen',release_date:'2010-07-16',job:'Director',poster_path:'/test.jpg'}]})};
  return {ok:false,status:404};
 };
 try{const r=res();await handler({method:'GET',query:{person:'525',name:'Christopher Nolan',role:'Dirección'}},r);
 assert.equal(r.code,200);assert.equal(r.data.person.name,'Christopher Nolan');assert.equal(r.data.movies[0].title,'Origen');assert(paths[0].endsWith('/525/movie_credits'));}finally{globalThis.fetch=originalFetch;if(originalToken===undefined)delete process.env.TMDB_READ_TOKEN;else process.env.TMDB_READ_TOKEN=originalToken;}
});

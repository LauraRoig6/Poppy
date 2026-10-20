import test from 'node:test';
import assert from 'node:assert/strict';
import handler from '../api/movies.js';
const reply=()=>({statusCode:200,setHeader(){},status(n){this.statusCode=n;return this;},json(x){this.body=x;return this;}});
for(const [feed,expectedType] of [['upcoming','2|3'],['now','2|3'],['digital','4']])test(`TMDB descubre ${feed} por tipo de estreno en España`,async()=>{
 const old=process.env.TMDB_READ_TOKEN,prev=global.fetch;let url;
 process.env.TMDB_READ_TOKEN='fake';global.fetch=async u=>{url=new URL(u);return {ok:true,json:async()=>({results:[],page:1,total_pages:1})};};
 try{const r=reply();await handler({method:'GET',query:{feed}},r);assert.equal(r.statusCode,200);assert.equal(url.pathname,'/3/discover/movie');assert.equal(url.searchParams.get('region'),'ES');assert.equal(url.searchParams.get('with_release_type'),expectedType);assert.ok(url.searchParams.has('release_date.gte'));}
 finally{global.fetch=prev;if(old===undefined)delete process.env.TMDB_READ_TOKEN;else process.env.TMDB_READ_TOKEN=old;}
});
test('Mejor valoradas permite filtrar género desde 1990',async()=>{const old=process.env.TMDB_READ_TOKEN,prev=global.fetch;let url;process.env.TMDB_READ_TOKEN='fake';global.fetch=async u=>{url=new URL(u);return {ok:true,json:async()=>({results:[],page:1,total_pages:1})};};try{const r=reply();await handler({method:'GET',query:{feed:'top',genre:'27'}},r);assert.equal(url.searchParams.get('primary_release_date.gte'),'1990-01-01');assert.equal(url.searchParams.get('with_genres'),'27');}finally{global.fetch=prev;if(old===undefined)delete process.env.TMDB_READ_TOKEN;else process.env.TMDB_READ_TOKEN=old;}});

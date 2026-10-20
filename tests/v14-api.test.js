import test from 'node:test';
import assert from 'node:assert/strict';
import handler from '../api/movies.js';
function response(){return {statusCode:200,headers:{},setHeader(k,v){this.headers[k]=v;},status(n){this.statusCode=n;return this;},json(data){this.data=data;return this;}};}
test('consultar servicios de streaming filtra SOLO las suscripciones en España',async()=>{
 const oldToken=process.env.TMDB_READ_TOKEN,oldFetch=global.fetch;
 process.env.TMDB_READ_TOKEN='test-api-token';let urls=[];
 global.fetch=async url=>{urls.push(String(url));return {ok:true,json:async()=>({results:{ES:{flatrate:[{provider_name:'Netflix'},{provider_name:'Crunchyroll'}],rent:[{provider_name:'Disney Plus'}]}}})};};
 try{const res=response();await handler({method:'GET',query:{watch:'14,15'}},res);assert.equal(res.statusCode,200);assert.deepEqual(res.data.availability['14'].services,['Netflix','Crunchyroll']);assert.equal(res.data.availability['14'].known,true);assert.equal(urls.length,2);assert.ok(urls.every(u=>u.includes('/watch/providers')));}finally{global.fetch=oldFetch;if(oldToken===undefined)delete process.env.TMDB_READ_TOKEN;else process.env.TMDB_READ_TOKEN=oldToken;}
});
test('radar usa estreno futuro y filtros por persona sin poner secrets en cliente',async()=>{
 const oldToken=process.env.TMDB_READ_TOKEN,oldFetch=global.fetch;
 process.env.TMDB_READ_TOKEN='test-api-token';let requested;
 global.fetch=async url=>{requested=new URL(url);return {ok:true,json:async()=>({page:1,total_pages:1,results:[]})};};
 try{const res=response();await handler({method:'GET',query:{feed:'radar',withperson:'525',genre:'878'}},res);assert.equal(res.statusCode,200);assert.equal(requested.pathname,'/3/discover/movie');assert.equal(requested.searchParams.get('with_people'),'525');assert.equal(requested.searchParams.get('with_genres'),'878');assert.ok(requested.searchParams.has('primary_release_date.gte'));assert.ok(requested.searchParams.has('primary_release_date.lte'));}finally{global.fetch=oldFetch;if(oldToken===undefined)delete process.env.TMDB_READ_TOKEN;else process.env.TMDB_READ_TOKEN=oldToken;}
});

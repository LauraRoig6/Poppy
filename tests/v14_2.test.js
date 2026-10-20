import test from 'node:test';
import assert from 'node:assert/strict';
import movieHandler from '../api/movies.js';
import posterHandler,{bestCinemaMatch} from '../api/cinema-posters.js';
import {parseCinemaHTML} from '../api/cinemas.js';
const mockRes=()=>({statusCode:200,headers:{},setHeader(k,v){this.headers[k]=v;},status(n){this.statusCode=n;return this;},json(body){this.body=body;return this;}});
test('Mi sesión perfecta consulta primero género, duración y Netflix en TMDB',async()=>{
 const prev=process.env.TMDB_READ_TOKEN,original=global.fetch;process.env.TMDB_READ_TOKEN='test';let called;
 global.fetch=async u=>{called=new URL(u);return {ok:true,json:async()=>({results:[],page:1,total_pages:1})};};
 try{const res=mockRes();await movieHandler({method:'GET',query:{feed:'session',service:'Netflix',genre:'10749',max:'120',page:'3'}},res);
  assert.equal(res.statusCode,200);assert.equal(called.pathname,'/3/discover/movie');
  assert.equal(called.searchParams.get('watch_region'),'ES');assert.equal(called.searchParams.get('with_watch_providers'),'8');
  assert.equal(called.searchParams.get('with_watch_monetization_types'),'flatrate');
  assert.equal(called.searchParams.get('with_genres'),'10749');assert.equal(called.searchParams.get('with_runtime.lte'),'120');assert.equal(called.searchParams.get('page'),'3');
 }finally{global.fetch=original;if(prev===undefined)delete process.env.TMDB_READ_TOKEN;else process.env.TMDB_READ_TOKEN=prev;}
});
test('Más de una plataforma permite buscar sin comprobar sólo 35 candidatos',async()=>{
 const prev=process.env.TMDB_READ_TOKEN,original=global.fetch;process.env.TMDB_READ_TOKEN='test';let called;
 global.fetch=async u=>{called=new URL(u);return {ok:true,json:async()=>({results:[],page:1,total_pages:1})};};
 try{await movieHandler({method:'GET',query:{feed:'session',service:'Prime Video',genre:'18',max:'90'}},mockRes());assert.equal(called.searchParams.get('with_watch_providers'),'9|119');}
 finally{global.fetch=original;if(prev===undefined)delete process.env.TMDB_READ_TOKEN;else process.env.TMDB_READ_TOKEN=prev;}
});
test('Próximamente en Sucre se mantiene independiente de cartelera',()=>{
 const html='<option>LA BOLA NEGRA Estreno: 25/9/2026 Calificación: 16</option><option>CLAYFACE Estreno: 22/10/2026 Calificación: 12</option><h2>Próximamente</h2><a>DUNE: PARTE TRES Estreno: 18/12/2026 Calificación: N/D</a>';
 const d=parseCinemaHTML(html,'sucre',new Date('2026-10-20T00:00:00Z'));
 assert.deepEqual(d.now.map(x=>x.title),['LA BOLA NEGRA']);assert.deepEqual(d.upcoming.map(x=>x.title),['DUNE: PARTE TRES','CLAYFACE']);
});
test('OCINE muestra las películas y no los encabezados o el menú',()=>{
 const d=parseCinemaHTML('<h3>CARTELERA de 16 a 23 octubre</h3><h3>LA BOLA NEGRA</h3><h4>Comprar entradas</h4><h3>MENÚ</h3>','estepark');
 assert.deepEqual(d.now.map(x=>x.title),['LA BOLA NEGRA']);
});
test('Póster local únicamente si el título coincide: evita homónimos',()=>{
 assert.equal(bestCinemaMatch('La bola negra',[{id:61,title:'La bola negra',poster_path:'/x.jpg',release_date:'2026-09-25'}]).id,61);
 assert.equal(bestCinemaMatch('La bola negra',[{id:62,title:'La bola blanca',poster_path:'/x.jpg'}]),null);
});
test('Carteles locales se consultan en lote y sin atribuir cine por TMDB',async()=>{
 const prev=process.env.TMDB_READ_TOKEN,original=global.fetch;process.env.TMDB_READ_TOKEN='test';let requested=0;
 global.fetch=async u=>{requested++;return {ok:true,json:async()=>({results:[{id:100,title:'La bola negra',poster_path:'/some.jpg',release_date:'2026-09-25'}]})};};
 try{const res=mockRes();await posterHandler({method:'GET',query:{titles:JSON.stringify(['La bola negra'])}},res);assert.equal(res.statusCode,200);assert.equal(res.body.movies['La bola negra'].id,100);assert.equal(requested,1);}
 finally{global.fetch=original;if(prev===undefined)delete process.env.TMDB_READ_TOKEN;else process.env.TMDB_READ_TOKEN=prev;}
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {parseCinemaHTML} from '../api/cinemas.js';
test('Sucre Vila-real: separa películas actuales y estrenos futuros publicados',()=>{
 const html='<nav>VIC</nav><a>LA BOLA NEGRA Estreno: 25/9/2026 Calificación: 16 | 159 min</a><a>DUNE: PARTE TRES Estreno: 18/12/2026 Calificación: N/D</a>';
 const result=parseCinemaHTML(html,'sucre',new Date('2026-10-20T00:00:00Z'));
 assert.deepEqual(result.now,[{title:'LA BOLA NEGRA',date:'2026-09-25'}]);
 assert.deepEqual(result.upcoming,[{title:'DUNE: PARTE TRES',date:'2026-12-18'}]);
});
test('OCINE Estepark: conserva títulos de la cartelera local sin botón comprar',()=>{
 const result=parseCinemaHTML('<h3>LA BOLA NEGRA</h3><h4>Comprar entradas</h4><h3>LA ODISEA</h3>','estepark');
 assert.deepEqual(result.now.map(x=>x.title),['LA BOLA NEGRA','LA ODISEA']);
});
test('Cinesa La Salera: recupera títulos del listado de la sala y evita duplicados',()=>{
 const result=parseCinemaHTML('<h2><a href="/cine">La bola negra</a></h2><h2>La bola negra</h2>','sensacine');
 assert.deepEqual(result.now.map(x=>x.title),['La bola negra']);
});

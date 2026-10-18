import test from 'node:test';
import assert from 'node:assert/strict';
import {discoveryCandidates,titleKey} from '../core.js';
const movies=[
 {id:1,title:'La invitación',genres:['Drama'],runtime:90},
 {id:2,title:'La invitacion',genres:['Terror'],runtime:100},
 {id:3,title:'LA INVITACIÓN!',genres:['Comedia'],runtime:120},
 {id:4,title:'Otra historia',genres:['Drama'],runtime:100},
 {id:5,title:'Otra historia',genres:['Drama'],runtime:100},
 {id:6,title:'La aventura',genres:['Drama'],runtime:100}];
test('normaliza tildes mayúsculas y puntuación',()=>assert.equal(titleKey(' LA Invitación! '),'la invitacion'));
test('excluye pendientes, vistas y variantes homónimas guardadas',()=>{
 const saved={1:{status:'pending',movie:movies[0]},6:{status:'seen',movie:movies[5]}};
 assert.deepEqual(discoveryCandidates(movies,saved).map(m=>m.id),[4]);
});
test('no muestra dos propuestas con idéntico título',()=>assert.deepEqual(discoveryCandidates(movies,{}).map(m=>m.id),[1,4,6]));
test('conserva los filtros de género y duración',()=>assert.deepEqual(discoveryCandidates(movies,{},'Drama',90).map(m=>m.id),[1]));

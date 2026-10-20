import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const source=readFileSync(new URL('../app.js',import.meta.url),'utf8');
const start=source.indexOf('function people(m,role){');
const end=source.indexOf('\nfunction ratings(',start);
assert.ok(start>=0&&end>start,'Se encuentra la función real de renderizado');
const context={imageURL:v=>v,esc:v=>String(v).replace(/&/g,'&amp;').replace(/"/g,'&quot;')};
const render=vm.runInNewContext(source.slice(start,end)+'\npeople',context);
for(const item of [{id:525,name:'Christopher Nolan',role:'Dirección'}, {id:1397778,name:'Anya Taylor-Joy',role:'Reparto'}]){
 test(`Foto de ${item.name}: el ID solo lo lleva el botón`,()=>{
   const html=render({people:[{...item,photo:'https://image.tmdb.org/t/p/w185/test.jpg',character:''}],director:item.name,cast:[]},item.role);
   assert.match(html,new RegExp(`<button[^>]+data-person="${item.id}"`));
   assert.match(html,/<img data-person-photo /);
   assert.doesNotMatch(html,/<img[^>]*\bdata-person=/);
 });
}
test('El evento busca el botón y descarta IDs inválidos',()=>{
 assert.ok(source.includes("e.target.closest('button[data-person]')"));
 assert.ok(source.includes("img.matches?.('[data-person-photo]')"));
 assert.ok(source.includes("if(!Number.isSafeInteger(id)||id<=0)"));
});

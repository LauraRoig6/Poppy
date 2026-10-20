import test from 'node:test';
import assert from 'node:assert/strict';
import {SERVICES,classifyProvider,watchServices,autoCollections,sagaProgress,chooseSession,movieLinks} from '../v14.js';
const movie=(id,title,genres=[],extra={})=>({id,title,genres,year:'2020',runtime:110,cast:[],director:'',...extra});
test('Las colecciones automáticas no modifican registros y respetan estados',()=>{
 const records={'1':{movie:movie(1,'Diez'),status:'seen',score:10},'2':{movie:movie(2,'Horror',['Terror']),status:'pending'},'3':{movie:movie(3,'Importante'),status:'pending',priority:1},'4':{movie:movie(4,'Vieja',[],{year:'1994'}),status:'seen',score:7}};
 const before=JSON.stringify(records),folders=autoCollections(records);
 assert.deepEqual(folders.map(x=>x.movies.length),[1,1,1,1]);assert.equal(before,JSON.stringify(records));
});
test('La sesión respeta prioridad, género, duración y plataforma',()=>{
 const films=[movie(1,'A',['Terror'],{runtime:80}),movie(2,'B',['Terror'],{runtime:100}),movie(3,'C',['Drama'],{runtime:80})];
 const records={'2':{priority:1}};
 assert.equal(chooseSession(films,records,{genre:'Terror',max:120}).id,2);
 assert.equal(chooseSession(films,records,{genre:'Terror',max:90}).id,1);
 assert.equal(chooseSession(films,records,{platform:'Netflix',availability:{2:{services:['Netflix']}}}).id,2);
 assert.equal(chooseSession(films,records,{platform:'Disney+',availability:{}}),null);
});
test('La disponibilidad de Prime y Crunchyroll se identifica por nombre',()=>{
 assert.deepEqual(SERVICES,['Netflix','Prime Video','Disney+','Crunchyroll']);
 assert.deepEqual(watchServices([{provider_name:'Amazon Prime Video'},{provider_name:'Crunchyroll'},{provider_name:'Netflix'},{provider_name:'Crunchyroll'}]),['Prime Video','Crunchyroll','Netflix']);
 assert.equal(classifyProvider('Alquiler Rakuten TV'),null);
});
test('La barra de saga cuenta vistas y encuentra el siguiente capítulo',()=>{
 const films=[movie(2,'Parte 2',[],{year:'2021'}),movie(1,'Parte 1',[],{year:'2020'}),movie(3,'Parte 3',[],{year:'2023'})];
 assert.deepEqual(sagaProgress(films,{1:{status:'seen'},2:{status:'pending'}}),{seen:1,total:3,percent:33,next:films[0]});
});
test('Conexiones reales por saga, director o reparto y sin coincidencias de nombre',()=>{
 const focus=movie(1,'Origen',['Thriller'],{director:'Christopher Nolan',cast:['Leonardo DiCaprio'],collectionId:9});
 const films=[movie(2,'Película A',['Comedia'],{collectionId:9}),movie(3,'Película B',[],{director:'Christopher Nolan'}),movie(4,'Película C',[],{cast:['Leonardo DiCaprio']}),movie(5,'Película D',['Comedia'])];
 const matches=movieLinks(focus,films);assert.equal(matches.length,3);assert.ok(matches.some(x=>x.reasons[0]==='Misma saga'));assert.ok(matches.some(x=>x.reasons[0]==='Misma dirección'));
});

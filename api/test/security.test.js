import test from 'node:test';
import assert from 'node:assert/strict';

process.env.RUN_SERVER='false';
const {csrfOk,validListing}=await import('../server.js');

test('CSRF: accept same-origin HTTPS and reject cross-site',()=>{
 assert.equal(csrfOk({headers:{host:'trokiva-api.onrender.com',origin:'https://trokiva-api.onrender.com','sec-fetch-site':'same-origin'}}),true);
 assert.equal(csrfOk({headers:{host:'trokiva-api.onrender.com',origin:'https://evil.example','sec-fetch-site':'cross-site'}}),false);
 assert.equal(csrfOk({headers:{host:'trokiva-api.onrender.com',origin:'http://trokiva-api.onrender.com','sec-fetch-site':'cross-site'}}),false);
 assert.equal(csrfOk({headers:{host:'trokiva-api.onrender.com','sec-fetch-site':'none'}}),false);
 assert.equal(csrfOk({headers:{host:'trokiva-api.onrender.com','sec-fetch-site':'same-origin'}}),true);
 assert.equal(csrfOk({headers:{host:'trokiva-api.onrender.com',origin:'https://trokiva-preview.onrender.com','sec-fetch-site':'same-site'}}),false);
});
test('Validation annonces: reject empty, incomplete and overlong data',()=>{
 assert.equal(validListing({title:'',category:'Livres'}),false);
 assert.equal(validListing({title:'Livre de cours',category:'Livres',description:'Bon état',wanted:'Autre livre',city:'Paris'}),true);
 assert.equal(validListing({title:'Livre de cours',category:'Livres',description:'a'.repeat(1201)}),false);
 assert.equal(validListing({title:'Livre',category:'Livres',wanted:42}),false);
});

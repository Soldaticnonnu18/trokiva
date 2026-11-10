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

test('Moderation lock: owner cannot restore or republish an admin-removed listing',async()=>{
 const {readFileSync}=await import('node:fs');
 const server=readFileSync(new URL('../server.js',import.meta.url),'utf8');
 const schema=readFileSync(new URL('../schema.sql',import.meta.url),'utf8');
 assert.match(schema,/ALTER TABLE listings ADD COLUMN IF NOT EXISTS moderation_hidden_at timestamptz/);
 assert.match(server,/moderation_hidden_at=COALESCE\(moderation_hidden_at,now\(\)\)/);
 assert.match(server,/state='hidden' AND moderation_hidden_at IS NULL RETURNING id,state/);
 assert.match(server,/state='draft' AND moderation_hidden_at IS NULL RETURNING id,state/);
 assert.match(server,/state='draft' AND length\(trim\(title\)\)>=3 AND length\(trim\(category\)\)>0 AND moderation_hidden_at IS NULL AND length\(trim\(description\)\)>=20/);
});

test('Launch gate checks moderation column and prevents incomplete schema activation',async()=>{
 const {readFileSync}=await import('node:fs');
 const server=readFileSync(new URL('../server.js',import.meta.url),'utf8');
 assert.match(server,/const requiredTables=\[/);
 assert.match(server,/\['listings','moderation_hidden_at'\]/);
 assert.match(server,/async function checkSchemaReady\(\)/);
 assert.match(server,/if\(!\(await requireReady\(res\)\)\)return;/);
 assert.match(server,/requiredColumns\.every/);
});
test('Moderation authorization requires specific existing user ID, not an email address',async()=>{
 const {readFileSync}=await import('node:fs');
 const server=readFileSync(new URL('../server.js',import.meta.url),'utf8');
 assert.match(server,/TROKIVA_ADMIN_USER_ID/);
 assert.match(server,/u\.id!==adminId/);
 assert.doesNotMatch(server,/TROKIVA_ADMIN_EMAIL/);
});

test('Offer creation locks the actual published listing to avoid a reservation race',async()=>{
 const {readFileSync}=await import('node:fs');
 const server=readFileSync(new URL('../server.js',import.meta.url),'utf8');
 assert.match(server,/INSERT INTO exchange_offers[\s\S]*?l\.state='published'[\s\S]*?FOR UPDATE OF l RETURNING id,listing_id,status,created_at/);
 assert.match(server,/FOR UPDATE OF l,e/);
});

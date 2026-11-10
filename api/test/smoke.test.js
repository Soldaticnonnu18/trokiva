import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';

const port=41000+Math.floor(Math.random()*1000);
let child;
async function waitFor(url){
 for(let n=0;n<30;n++){
  try{const r=await fetch(url);if(r.ok)return}catch{}
  await new Promise(resolve=>setTimeout(resolve,200));
 }
 throw new Error('Serveur de test indisponible');
}
test('API sans secrets : aucun compte ni catalogue exposé',async()=>{
 child=spawn(process.execPath,['server.js'],{cwd:new URL('../',import.meta.url),env:{...process.env,PORT:String(port),DATABASE_URL:'',ENABLE_REGISTRATION:'false',RESEND_API_KEY:'',RESEND_FROM_EMAIL:''},stdio:'ignore'});
 const base='http://127.0.0.1:'+port;
 try{
  await waitFor(base+'/api/health');
  const health=await(await fetch(base+'/api/health')).json();
  assert.equal(health.databaseConfigured,false);
  assert.equal(health.registration,'disabled');
  const readiness=await fetch(base+'/api/ready');
  assert.equal(readiness.status,503);
  const readinessBody=await readiness.json();
  assert.equal(readinessBody.ready,false);
  assert.equal(readinessBody.database,'unconfigured');
  const listings=await fetch(base+'/api/listings');
  assert.equal(listings.status,503);
  const register=await fetch(base+'/api/auth/register',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:'demo@example.org',password:'sufficientlyLongPassword'})});
  assert.equal(register.status,503);
  const verify=await fetch(base+'/verify.html');
  assert.equal(verify.status,200);
  const html=await verify.text();
  assert.match(html,/Vérification TROKIVA/);
 }finally{child.kill('SIGTERM')}
});

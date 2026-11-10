import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn,spawnSync} from 'node:child_process';

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
 child=spawn(process.execPath,['server.js'],{cwd:new URL('../',import.meta.url),env:{...process.env,PORT:String(port),DATABASE_URL:'',RUN_MIGRATIONS_ON_BOOT:'false',ENABLE_REGISTRATION:'false',ENABLE_EXCHANGES:'false',RESEND_API_KEY:'',RESEND_FROM_EMAIL:''},stdio:'ignore'});
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
  const resend=await fetch(base+'/api/auth/resend-verification',{method:'POST',headers:{'Content-Type':'application/json',Origin:base},body:JSON.stringify({email:'demo@example.org'})});
  assert.equal(resend.status,503);
  const me=await fetch(base+'/api/me');
  assert.equal(me.status,200);
  assert.equal((await me.json()).user,null);
  const missing=await fetch(base+'/api/my/listings');
  assert.equal(missing.status,503);
  const reset=await fetch(base+'/api/auth/request-password-reset',{method:'POST',headers:{'Content-Type':'application/json',Origin:base},body:JSON.stringify({email:'demo@example.org'})});
  assert.equal(reset.status,503);
  const resetPage=await fetch(base+'/reset-password.html');
  assert.equal(resetPage.status,200);
  assert.match(await resetPage.text(),/Nouveau mot de passe/);
  const appleIcon=await fetch(base+'/apple-touch-icon.png');
  assert.equal(appleIcon.status,200);
  assert.match(appleIcon.headers.get('content-type')||'',/image\/png/);
  const appleBytes=new Uint8Array(await appleIcon.arrayBuffer());
  assert.deepEqual([...appleBytes.slice(0,8)],[137,80,78,71,13,10,26,10]);
  const dv=new DataView(appleBytes.buffer,appleBytes.byteOffset,appleBytes.byteLength);
  assert.equal(dv.getUint32(16),180);
  assert.equal(dv.getUint32(20),180);
  const home=await(await fetch(base+'/index.html')).text();
  assert.match(home,/apple-touch-icon\.png\?v=2/);
  const brandAsset=await fetch(base+'/assets/trokiva-symbol.svg');
  assert.equal(brandAsset.status,200);
  assert.match(brandAsset.headers.get('content-type')||'',/svg/);
  const memberPage=await fetch(base+'/compte.html');
  assert.equal(memberPage.status,200);
  const htmlMember=await memberPage.text();
  assert.match(htmlMember,/Mon espace TROKIVA/);
  assert.match(htmlMember,/trokiva-member-app-shell-v1/);
  assert.match(htmlMember,/#exchange-conversation/);
  assert.match(home,/trokiva-app-shell-v1/);
  assert.match(home,/trokiva-mobile-corrections-v2/);
  assert.match(home,/main>\.view\.page\{min-height:0/);
  assert.match(home,/#explorer>\.toolbar\{display:grid/);
  assert.match(home,/#publier \.panel textarea\.field\{height:78px/);
  assert.match(home,/\.bottom\{position:fixed;left:0;right:0;bottom:0/);
  assert.equal((home.match(/<style\b/g)||[]).length,(home.match(/<\/style>/g)||[]).length);
  assert.match(home,/\.bottom\{left:8px;right:8px;/);
  assert.match(home,/\.panel\{max-width:100%;margin-top:12px;/);
  assert.match(htmlMember,/Les comptes ne sont pas encore disponibles/);
  const publishWithoutDb=await fetch(base+'/api/my/listings/00000000-0000-4000-8000-000000000000/publish',{method:'POST',headers:{Origin:base,'Content-Type':'application/json'},body:'{}'});
  assert.equal(publishWithoutDb.status,503);
  const hideWithoutDb=await fetch(base+'/api/my/listings/00000000-0000-4000-8000-000000000000/hide',{method:'POST',headers:{Origin:base,'Content-Type':'application/json'},body:'{}'});
  assert.equal(hideWithoutDb.status,503);
  const offers=await fetch(base+'/api/my/offers');
  assert.equal(offers.status,503);
  const submitOffer=await fetch(base+'/api/my/offers',{method:'POST',headers:{Origin:base,'Content-Type':'application/json'},body:JSON.stringify({listingId:'00000000-0000-4000-8000-000000000000',message:'Un objet personnel disponible'})});
  assert.equal(submitOffer.status,503);
  const decide=await fetch(base+'/api/my/offers/00000000-0000-4000-8000-000000000000/accept',{method:'POST',headers:{Origin:base,'Content-Type':'application/json'},body:'{}'});
  assert.equal(decide.status,503);
  const health2=await(await fetch(base+'/api/health')).json();
  assert.equal(health2.exchanges,'disabled');
  const report=await fetch(base+'/api/reports',{method:'POST',headers:{Origin:base,'Content-Type':'application/json'},body:JSON.stringify({listingId:'00000000-0000-4000-8000-000000000000',reason:'fraud',details:'Annonce trompeuse'})});
  assert.equal(report.status,503);
  const queue=await fetch(base+'/api/admin/reports');
  assert.equal(queue.status,503);
  const noDbMessages=await fetch(base+'/api/my/offers/00000000-0000-4000-8000-000000000000/messages');
  assert.equal(noDbMessages.status,503);
  const noDbWrite=await fetch(base+'/api/my/offers/00000000-0000-4000-8000-000000000000/messages',{method:'POST',headers:{Origin:base,'Content-Type':'application/json'},body:JSON.stringify({content:'Bonjour'})});
  assert.equal(noDbWrite.status,503);
  const confirmWithoutDb=await fetch(base+'/api/my/offers/00000000-0000-4000-8000-000000000000/confirm',{method:'POST',headers:{Origin:base,'Content-Type':'application/json'},body:'{}'});
  assert.equal(confirmWithoutDb.status,503);
  const verify=await fetch(base+'/verify.html');
  assert.equal(verify.status,200);
  const html=await verify.text();
  assert.match(html,/Vérification TROKIVA/);
 }finally{child.kill('SIGTERM')}
});

test('migration strictement opt-in et inaccessible sans configuration',()=>{
 const run=spawnSync(process.execPath,['migrate.js'],{
  cwd:new URL('../',import.meta.url),
  env:{...process.env,DATABASE_URL:''},
  encoding:'utf8',
  timeout:6000
 });
 assert.notEqual(run.status,0);
 assert.match(run.stderr,/DATABASE_URL absente/);
 const boot=spawnSync(process.execPath,['server.js'],{
  cwd:new URL('../',import.meta.url),
  env:{...process.env,DATABASE_URL:'',RUN_MIGRATIONS_ON_BOOT:'true'},
  encoding:'utf8',
  timeout:6000
 });
 assert.notEqual(boot.status,0);
 assert.match(boot.stderr,/Migration demandée mais DATABASE_URL absente/);
 for(const flag of ['ENABLE_REGISTRATION','ENABLE_EXCHANGES']){
  const guarded=spawnSync(process.execPath,['server.js'],{
   cwd:new URL('../',import.meta.url),
   env:{...process.env,DATABASE_URL:'',RUN_MIGRATIONS_ON_BOOT:'true',ENABLE_REGISTRATION:'false',ENABLE_EXCHANGES:'false',[flag]:'true'},
   encoding:'utf8',
   timeout:6000
  });
  assert.notEqual(guarded.status,0);
  assert.match(guarded.stderr,/Migration refusée : fermer les inscriptions et les échanges/);
 }

});

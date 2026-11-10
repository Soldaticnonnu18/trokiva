import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID,randomBytes,scrypt as scryptCb,createHash} from 'node:crypto';
import {promisify} from 'node:util';
import {spawn} from 'node:child_process';
import pg from 'pg';
import {migrateDatabase} from '../migrate.js';

// This suite ONLY executes on a disposable CI PostgreSQL instance.
// It is intentionally inert in Render builds and never targets production.
const url=process.env.TROKIVA_TEST_DATABASE_URL;
const scrypt=promisify(scryptCb);

test('PostgreSQL réel isolé : inscription vérifiée, annonce, offre, messages et remise bilatérale', {skip:!url},async()=>{
 const target=new URL(url);
 if(!['localhost','127.0.0.1'].includes(target.hostname) || target.pathname!=='/trokiva_test')throw new Error('Refus : PostgreSQL de test doit être local et dédié');
 const pool=new pg.Pool({connectionString:url});
 const origin='http://127.0.0.1:45671';
 let child;
 const users=[{id:randomUUID(),email:'participant-a@example.invalid'},{id:randomUUID(),email:'participant-b@example.invalid'},{id:randomUUID(),email:'outsider@example.invalid'}];
 const password=randomBytes(24).toString('hex');
 async function call(path,method='GET',body,cookie){
  const opts={method,headers:{Origin:origin,'Content-Type':'application/json',...(cookie?{Cookie:cookie}:{})}};
  if(body!==undefined)opts.body=JSON.stringify(body);
  const response=await fetch(origin+path,opts);
  const result=await response.json();
  return {response,result,cookie:response.headers.get('set-cookie')?.split(';')[0]};
 }
 try{
  await migrateDatabase(url);
  const tableCheck=await pool.query("SELECT count(*)::integer n FROM information_schema.tables WHERE table_schema='public' AND table_name IN ('users','sessions','email_verifications','password_resets','listings','exchange_offers','listing_reports','exchange_messages','exchange_confirmations')");
  assert.equal(tableCheck.rows[0].n,9);
  for(const u of users){
   const salt=randomBytes(16).toString('hex');
   const digest=(await scrypt(password,salt,64)).toString('hex');
   await pool.query('INSERT INTO users(id,email,password_hash,password_salt,email_verified_at) VALUES ($1,$2,$3,$4,now())',[u.id,u.email,digest,salt]);
  }
  child=spawn(process.execPath,['server.js'],{cwd:new URL('../',import.meta.url),env:{...process.env,PORT:'45671',DATABASE_URL:url,ENABLE_REGISTRATION:'false',ENABLE_EXCHANGES:'true',TROKIVA_ADMIN_USER_ID:users[0].id,RUN_MIGRATIONS_ON_BOOT:'false'},stdio:'ignore'});
  let ready=false;
  for(let i=0;i<60;i++){
   try{const r=await fetch(origin+'/api/ready');if(r.ok){ready=true;break}}catch{}
   await new Promise(r=>setTimeout(r,200));
  }
  assert.ok(ready,'API indisponible avec PostgreSQL de test');
  const pendingId=randomUUID();
  const oldToken=randomBytes(32).toString('hex');
  const newToken=randomBytes(32).toString('hex');
  const salt=randomBytes(16).toString('hex');
  const digest=(await scrypt(password,salt,64)).toString('hex');
  await pool.query('INSERT INTO users(id,email,password_hash,password_salt) VALUES ($1,$2,$3,$4)',[pendingId,'pending@example.invalid',digest,salt]);
  for(const token of [oldToken,newToken]){
   await pool.query("INSERT INTO email_verifications(id,user_id,token_hash,expires_at) VALUES ($1,$2,$3,now()+interval '24 hours')",[randomUUID(),pendingId,createHash('sha256').update(token).digest('hex')]);
  }
  const verify=await call('/api/auth/verify','POST',{token:newToken});
  assert.equal(verify.response.status,200,JSON.stringify(verify.result));
  const replay=await call('/api/auth/verify','POST',{token:newToken});
  assert.equal(replay.response.status,400);
  const oldVerification=await call('/api/auth/verify','POST',{token:oldToken});
  assert.equal(oldVerification.response.status,400);
  const verifiedAccount=await pool.query('SELECT email_verified_at FROM users WHERE id=$1',[pendingId]);
  assert.ok(verifiedAccount.rows[0].email_verified_at);
  const pendingTokens=await pool.query('SELECT count(*)::integer AS n FROM email_verifications WHERE user_id=$1 AND consumed_at IS NULL',[pendingId]);
  assert.equal(pendingTokens.rows[0].n,0);
  const cookies=[];
  for(const u of users){
   const login=await call('/api/auth/login','POST',{email:u.email,password});
   assert.equal(login.response.status,200);
   assert.ok(login.cookie);
   cookies.push(login.cookie);
  }
  const create=await call('/api/my/listings','POST',{title:'Objet en bon état',category:'Divers',description:'Objet proposé pour un échange réel dans le banc de test isolé.',wanted:'Un autre objet',city:'Paris'},cookies[0]);
  assert.equal(create.response.status,201,JSON.stringify(create.result));
  const id=create.result.listing.id;
  assert.equal((await call('/api/my/listings/'+id+'/publish','POST',{},cookies[0])).response.status,200);
  const send=await call('/api/my/offers','POST',{listingId:id,message:'Je propose un autre objet en échange.'},cookies[1]);
  assert.equal(send.response.status,201,JSON.stringify(send.result));
  const offerId=send.result.offer.id;
  assert.equal((await call('/api/my/offers','POST',{listingId:id,message:'Proposition répétée'},cookies[1])).response.status,409);
  assert.equal((await call('/api/my/offers/'+offerId+'/accept','POST',{},cookies[1])).response.status,403);
  const accepted=await call('/api/my/offers/'+offerId+'/accept','POST',{},cookies[0]);
  assert.equal(accepted.response.status,200,JSON.stringify(accepted.result));
  const outsiderInbox=await call('/api/my/offers/'+offerId+'/messages','GET',undefined,cookies[2]);
  assert.equal(outsiderInbox.response.status,404);
  const emptyParticipantInbox=await call('/api/my/offers/'+offerId+'/messages','GET',undefined,cookies[0]);
  assert.equal(emptyParticipantInbox.response.status,200);
  assert.deepEqual(emptyParticipantInbox.result.items,[]);
  const message=await call('/api/my/offers/'+offerId+'/messages','POST',{content:'Lieu public convenu.'},cookies[1]);
  assert.equal(message.response.status,201,JSON.stringify(message.result));
  const inbox=await call('/api/my/offers/'+offerId+'/messages','GET',undefined,cookies[0]);
  assert.equal(inbox.result.items.length,1);
  assert.equal((await call('/api/my/offers/'+offerId+'/confirm','POST',{},cookies[2])).response.status,409);
  const first=await call('/api/my/offers/'+offerId+'/confirm','POST',{},cookies[0]);
  assert.equal(first.response.status,200,JSON.stringify(first.result));
  assert.equal(first.result.completed,false);
  const state1=await pool.query('SELECT state FROM listings WHERE id=$1',[id]);
  assert.equal(state1.rows[0].state,'reserved');
  const second=await call('/api/my/offers/'+offerId+'/confirm','POST',{},cookies[1]);
  assert.equal(second.response.status,200,JSON.stringify(second.result));
  assert.equal(second.result.completed,true);
  const state2=await pool.query('SELECT state FROM listings WHERE id=$1',[id]);
  assert.equal(state2.rows[0].state,'exchanged');
  // A separate published listing validates moderation without changing the completed exchange.
  const secondListing=await call('/api/my/listings','POST',{title:'Deuxième objet de test',category:'Divers',description:'Deuxième objet exclusivement réservé aux tests isolés.',wanted:'Un objet différent',city:'Lyon'},cookies[0]);
  assert.equal(secondListing.response.status,201);
  const secondId=secondListing.result.listing.id;
  assert.equal((await call('/api/my/listings/'+secondId+'/publish','POST',{},cookies[0])).response.status,200);
  const report=await call('/api/reports','POST',{listingId:secondId,reason:'fraud',details:'Signalement contrôlé dans la base jetable.'},cookies[1]);
  assert.equal(report.response.status,201,JSON.stringify(report.result));
  assert.equal((await call('/api/reports','POST',{listingId:secondId,reason:'fraud'},cookies[1])).response.status,409);
  const queue=await call('/api/admin/reports','GET',undefined,cookies[0]);
  assert.equal(queue.response.status,200);
  assert.ok(queue.result.items.some(item=>item.id===report.result.report.id));
  assert.equal((await call('/api/admin/reports/'+report.result.report.id+'/hide','POST',{},cookies[1])).response.status,404);
  assert.equal((await call('/api/admin/reports/'+report.result.report.id+'/hide','POST',{},cookies[0])).response.status,200);
  assert.equal((await call('/api/my/listings/'+secondId+'/restore','POST',{},cookies[0])).response.status,404);
  const moderated=await pool.query('SELECT state,moderation_hidden_at FROM listings WHERE id=$1',[secondId]);
  assert.equal(moderated.rows[0].state,'hidden');
  assert.ok(moderated.rows[0].moderation_hidden_at);

 }finally{
  child?.kill('SIGTERM');
  await pool.end();
 }
});

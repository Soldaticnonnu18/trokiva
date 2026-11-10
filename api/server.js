import http from 'node:http';
import {randomUUID,randomBytes,scrypt as scryptCb,timingSafeEqual,createHash} from 'node:crypto';
import {promisify} from 'node:util';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import pg from 'pg';

const scrypt=promisify(scryptCb);
const base=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const port=Number(process.env.PORT||3001);
const origin=process.env.APP_ORIGIN || '';
const dbUrl=process.env.DATABASE_URL || '';
const publicUrl=process.env.PUBLIC_API_BASE_URL || '';
const emailReady=!!process.env.RESEND_API_KEY && !!process.env.RESEND_FROM_EMAIL && /^https:\/\//.test(publicUrl);
const registrationsEnabled=process.env.ENABLE_REGISTRATION==='true' && emailReady && !!dbUrl;
const exchangesEnabled=process.env.ENABLE_EXCHANGES==='true' && !!dbUrl;
const pool=dbUrl?new pg.Pool({connectionString:dbUrl,max:6,connectionTimeoutMillis:5000,ssl:process.env.DB_SSL==='true'?{rejectUnauthorized:true}:undefined}):null;
const buckets=new Map();
const hash=v=>createHash('sha256').update(v).digest('hex');
const validEmail=v=>typeof v==='string' && v.length<=254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) && !v.includes('..');
const createSecret=()=>randomBytes(32).toString('hex');
async function sendVerification(email,token) {
 const link=(publicUrl.endsWith('/')?publicUrl.slice(0,-1):publicUrl)+'/verify.html#token='+token;
 const response=await fetch('https://api.resend.com/emails',{
  method:'POST',
  headers:{Authorization:'Bearer '+process.env.RESEND_API_KEY,'Content-Type':'application/json'},
  body:JSON.stringify({from:process.env.RESEND_FROM_EMAIL,to:[email],subject:'Confirmez votre adresse e-mail TROKIVA',html:'<p>Pour activer votre compte TROKIVA, confirmez votre adresse e-mail :</p><p><a href="'+link+'">Confirmer mon adresse</a></p><p>Ce lien expire dans 24 heures. Si vous n’avez pas demandé ce compte, ignorez ce message.</p>'}),
  signal:AbortSignal.timeout(10000)
 });
 if(!response.ok)throw new Error('Envoi e-mail impossible');
}

async function sendPasswordReset(email,token) {
 const link=(publicUrl.endsWith('/')?publicUrl.slice(0,-1):publicUrl)+'/reset-password.html#token='+token;
 const response=await fetch('https://api.resend.com/emails',{
  method:'POST',
  headers:{Authorization:'Bearer '+process.env.RESEND_API_KEY,'Content-Type':'application/json'},
  body:JSON.stringify({
    from:process.env.RESEND_FROM_EMAIL,to:[email],subject:'Réinitialiser votre mot de passe TROKIVA',
    html:'<p>Une demande de réinitialisation du mot de passe TROKIVA a été effectuée.</p><p><a href="'+link+'">Choisir un nouveau mot de passe</a></p><p>Le lien est à usage unique et expire dans une heure. Si vous n’êtes pas à l’origine de cette demande, ignorez ce message.</p>'
  }),signal:AbortSignal.timeout(10000)
 });
 if(!response.ok)throw new Error('Envoi e-mail impossible');
}

const json=(res,status,body,extra={})=>{res.writeHead(status,{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff',...extra});res.end(JSON.stringify(body))};
const replyError=(res,status,message)=>json(res,status,{error:message});
const allowedMethods='GET, POST, PATCH, DELETE, OPTIONS';
function rateLimit(req,type,max,windowMs){
 const addr=(req.socket.remoteAddress||'unknown').slice(0,100);
 const key=type+':'+addr;const now=Date.now();
 if(buckets.size>15000){for(const [k,v] of buckets)if(v.until<now)buckets.delete(k)}
 const old=buckets.get(key);const val=old?.until>now?old:{count:0,until:now+windowMs};
 val.count++;buckets.set(key,val);return val.count<=max;
}
function secureHeaders(res){
 res.setHeader('x-content-type-options','nosniff');
 res.setHeader('referrer-policy','strict-origin-when-cross-origin');
 res.setHeader('x-frame-options','DENY');
 res.setHeader('permissions-policy','camera=(), microphone=(), geolocation=()');
 res.setHeader('content-security-policy',"default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'");
}
async function body(req){
 const chunks=[];let n=0;
 for await(const chunk of req){n+=chunk.length;if(n>16384){const err=new Error('Requête trop volumineuse');err.status=413;throw err}chunks.push(chunk)}
 try{return JSON.parse(Buffer.concat(chunks).toString('utf8')||'{}')}catch{const err=new Error('JSON invalide');err.status=400;throw err}
}
const cookie=req=>Object.fromEntries((req.headers.cookie||'').split(';').map(s=>s.trim().split('=')).filter(a=>a.length===2));
const setCookie=(res,token,maxAge)=>res.setHeader('set-cookie','trokiva_session='+token+'; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age='+maxAge);
async function userFromRequest(req){
 if(!pool)return null;
 const token=cookie(req).trokiva_session;
 if(!token || !/^[a-f0-9]{64}$/.test(token))return null;
 const result=await pool.query('SELECT u.id,u.email FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=$1 AND s.expires_at>now() AND s.revoked_at IS NULL AND u.disabled_at IS NULL AND u.email_verified_at IS NOT NULL',[hash(token)]);
 return result.rows[0]||null;
}
function csrfOk(req){const host=req.headers.host;const reqOrigin=req.headers.origin;if(reqOrigin){try{return new URL(reqOrigin).host===host}catch{return false}}const site=req.headers['sec-fetch-site'];return site==='same-origin'||site==='none'}
async function serve(res,name){
 const types={'compte.html':'text/html; charset=utf-8','index.html':'text/html; charset=utf-8','manifest.webmanifest':'application/manifest+json','icon.svg':'image/svg+xml','sw.js':'text/javascript; charset=utf-8','verify.html':'text/html; charset=utf-8','reset-password.html':'text/html; charset=utf-8','assets/trokiva-symbol.svg':'image/svg+xml'};
 const type=types[name];if(!type)return replyError(res,404,'Introuvable');
 try{const content=await fs.readFile(path.join(base,name));res.writeHead(200,{'content-type':type,'cache-control':name==='sw.js'?'no-cache':'public, max-age=120'});res.end(content)}catch{replyError(res,404,'Introuvable')}
}
function validListing(p){
 if(!p||typeof p!=='object')return false;
 return typeof p.title==='string'&&p.title.trim().length>=3&&p.title.length<=100&&typeof p.category==='string'&&p.category.trim().length>0&&p.category.length<=80&&typeof (p.description??'')==='string'&&(p.description??'').length<=1200&&typeof (p.wanted??'')==='string'&&(p.wanted??'').length<=100&&typeof (p.city??'')==='string'&&(p.city??'').length<=100
}
const routed=async(req,res)=>{
 secureHeaders(res);
 const url=new URL(req.url||'/', 'http://localhost');
 const p=url.pathname;
 if(req.method==='GET'&&p==='/api/health')return json(res,200,{ok:true,service:'trokiva-api',databaseConfigured:!!pool,registration:registrationsEnabled?'enabled':'disabled',exchanges:exchangesEnabled?'enabled':'disabled'});
 if(req.method==='GET'&&p==='/api/ready'){
  if(!pool)return json(res,503,{ready:false,database:'unconfigured',schema:'not_checked'});
  try{
   const q=await pool.query("SELECT count(*)::integer AS total FROM information_schema.tables WHERE table_schema='public' AND table_name=ANY($1::text[])",[['users','sessions','email_verifications','password_resets','listings','exchange_offers']]);
   const schemaReady=q.rows[0]?.total===6;
   return json(res,schemaReady?200:503,{ready:schemaReady,database:'connected',schema:schemaReady?'ready':'incomplete'});
  }catch(e){console.error('Readiness check failed',e.code||e.name);return json(res,503,{ready:false,database:'unavailable',schema:'not_checked'})}
 }
 if(req.method==='GET'&&p==='/api/listings'){
  if(!pool)return json(res,503,{error:'Catalogue pas encore raccordé à la base de données'});
  const data=await pool.query("SELECT id,title,category,description,wanted,city,created_at FROM listings WHERE state='published' ORDER BY created_at DESC LIMIT 30");
  return json(res,200,{items:data.rows});
 }
 if(req.method==='GET'&&p==='/api/me'){
  const u=await userFromRequest(req);return json(res,200,{user:u});
 }
 if(p.startsWith('/api/')){
  if(!pool)return replyError(res,503,'Base de données non configurée');
  if(!['GET','HEAD','OPTIONS'].includes(req.method||'')){
   if(!csrfOk(req))return replyError(res,403,'Origine non autorisée');
   if(!rateLimit(req,'mutation',40,60_000))return replyError(res,429,'Trop de requêtes');
  }
  if(req.method==='POST'&&p==='/api/auth/register'){
   if(!registrationsEnabled)return replyError(res,503,'Inscriptions non activées : vérification e-mail manquante');
   if(!rateLimit(req,'signup',3,60*60*1000))return replyError(res,429,'Trop de demandes');
   const input=await body(req);
   const email=typeof input.email==='string'?input.email.trim().toLowerCase():'';
   const password=typeof input.password==='string'?input.password:'';
   if(!validEmail(email)||password.length<12||password.length>128)return replyError(res,400,'Adresse e-mail invalide ou mot de passe trop court (12 caractères minimum)');
   const existing=await pool.query('SELECT id,email_verified_at FROM users WHERE email=$1',[email]);
   if(existing.rowCount)return json(res,202,{message:'Si cette adresse est éligible, un e-mail sera envoyé.'});
   const salt=randomBytes(16).toString('hex');
   const digest=(await scrypt(password,salt,64)).toString('hex');
   const userId=randomUUID(),token=createSecret();
   const client=await pool.connect();
   try{
    await client.query('BEGIN');
    await client.query('INSERT INTO users(id,email,password_hash,password_salt) VALUES($1,$2,$3,$4)',[userId,email,digest,salt]);
    await client.query("INSERT INTO email_verifications(id,user_id,token_hash,expires_at) VALUES($1,$2,$3,now()+interval '24 hours')",[randomUUID(),userId,hash(token)]);
    await client.query('COMMIT');
   }catch(e){
    await client.query('ROLLBACK').catch(()=>{});
    if(e.code==='23505')return json(res,202,{message:'Si cette adresse est éligible, un e-mail sera envoyé.'});
    console.error('Inscription rejetée',e.code||e.name);
    return replyError(res,503,'Inscription indisponible. Réessayez ultérieurement.');
   }finally{client.release()}
   try {
    await sendVerification(email,token);
   } catch(e) {
    console.error('Email validation failed',e.name||'SendError');
    return replyError(res,503,'Compte en attente de confirmation. Vous pouvez demander un nouveau lien ultérieurement.');
   }
   return json(res,202,{message:'Si cette adresse est éligible, un e-mail sera envoyé.'});
  }
  if(req.method==='POST'&&p==='/api/auth/resend-verification'){
   if(!registrationsEnabled)return replyError(res,503,'Confirmation par e-mail indisponible');
   if(!rateLimit(req,'resend',3,60*60*1000))return replyError(res,429,'Trop de demandes');
   const input=await body(req);
   const email=typeof input.email==='string'?input.email.trim().toLowerCase():'';
   if(!validEmail(email))return replyError(res,400,'Adresse e-mail invalide');
   const generic={message:'Si ce compte existe et doit être confirmé, un e-mail sera envoyé.'};
   const q=await pool.query('SELECT id FROM users WHERE email=$1 AND email_verified_at IS NULL AND disabled_at IS NULL',[email]);
   if(!q.rowCount)return json(res,202,generic);
   const token=createSecret();
   await pool.query("INSERT INTO email_verifications(id,user_id,token_hash,expires_at) VALUES($1,$2,$3,now()+interval '24 hours')",[randomUUID(),q.rows[0].id,hash(token)]);
   try {await sendVerification(email,token)}catch(e){console.error('Email resend failed',e.name||'SendError');return replyError(res,503,'Service de messagerie temporairement indisponible')}
   return json(res,202,generic);
  }
  if(req.method==='POST'&&p==='/api/auth/verify'){
   if(!rateLimit(req,'verify',15,60*60*1000))return replyError(res,429,'Trop de demandes');
   const input=await body(req);
   if(typeof input.token!=='string'||!/^[a-f0-9]{64}$/.test(input.token))return replyError(res,400,'Lien invalide');
   const client=await pool.connect();
   try{
    await client.query('BEGIN');
    const q=await client.query('UPDATE email_verifications SET consumed_at=now() WHERE token_hash=$1 AND consumed_at IS NULL AND expires_at>now() RETURNING user_id',[hash(input.token)]);
    if(!q.rowCount){await client.query('ROLLBACK');return replyError(res,400,'Lien expiré ou déjà utilisé')}
    await client.query('UPDATE users SET email_verified_at=COALESCE(email_verified_at,now()) WHERE id=$1',[q.rows[0].user_id]);
    await client.query('COMMIT');
    return json(res,200,{ok:true});
   }catch(e){await client.query('ROLLBACK').catch(()=>{});throw e}finally{client.release()}
  }
  if(req.method==='POST'&&p==='/api/auth/request-password-reset'){
   if(!emailReady || !pool)return replyError(res,503,'Réinitialisation indisponible');
   if(!rateLimit(req,'reset-request',3,60*60*1000))return replyError(res,429,'Trop de demandes');
   const input=await body(req);
   const email=typeof input.email==='string'?input.email.trim().toLowerCase():'';
   if(!validEmail(email))return replyError(res,400,'Adresse e-mail invalide');
   const generic={message:'Si ce compte existe et est actif, un e-mail sera envoyé.'};
   const q=await pool.query('SELECT id FROM users WHERE email=$1 AND email_verified_at IS NOT NULL AND disabled_at IS NULL',[email]);
   if(!q.rowCount)return json(res,202,generic);
   const token=createSecret();
   await pool.query("INSERT INTO password_resets(id,user_id,token_hash,expires_at) VALUES($1,$2,$3,now()+interval '1 hour')",[randomUUID(),q.rows[0].id,hash(token)]);
   try{await sendPasswordReset(email,token)}catch(e){
    console.error('Password reset email failure',e.name||'SendError');
    return replyError(res,503,'Service de messagerie temporairement indisponible');
   }
   return json(res,202,generic);
  }
  if(req.method==='POST'&&p==='/api/auth/reset-password'){
   if(!pool)return replyError(res,503,'Réinitialisation indisponible');
   if(!rateLimit(req,'reset-confirm',10,60*60*1000))return replyError(res,429,'Trop de demandes');
   const input=await body(req);
   const token=typeof input.token==='string'?input.token:'';
   const password=typeof input.password==='string'?input.password:'';
   if(!/^[a-f0-9]{64}$/.test(token)||password.length<12||password.length>128)
    return replyError(res,400,'Lien invalide ou mot de passe trop court (12 caractères minimum)');
   const salt=randomBytes(16).toString('hex');
   const digest=(await scrypt(password,salt,64)).toString('hex');
   const client=await pool.connect();
   try{
    await client.query('BEGIN');
    const q=await client.query('UPDATE password_resets SET consumed_at=now() WHERE token_hash=$1 AND consumed_at IS NULL AND expires_at>now() RETURNING user_id',[hash(token)]);
    if(!q.rowCount){await client.query('ROLLBACK');return replyError(res,400,'Lien expiré ou déjà utilisé')}
    const updated=await client.query('UPDATE users SET password_hash=$2,password_salt=$3 WHERE id=$1 AND disabled_at IS NULL AND email_verified_at IS NOT NULL RETURNING id',[q.rows[0].user_id,digest,salt]);
    if(!updated.rowCount){await client.query('ROLLBACK');return replyError(res,400,'Ce compte ne peut pas être réinitialisé')}
    await client.query('UPDATE sessions SET revoked_at=now() WHERE user_id=$1 AND revoked_at IS NULL',[q.rows[0].user_id]);
    await client.query('UPDATE password_resets SET consumed_at=now() WHERE user_id=$1 AND consumed_at IS NULL',[q.rows[0].user_id]);
    await client.query('COMMIT');
    return json(res,200,{ok:true,message:'Mot de passe modifié. Reconnectez-vous.'});
   }catch(e){await client.query('ROLLBACK').catch(()=>{});throw e}finally{client.release()}
  }
  if(req.method==='POST'&&p==='/api/auth/login'){
   if(!rateLimit(req,'login',5,15*60_000))return replyError(res,429,'Trop de tentatives de connexion');
   const input=await body(req);
   const email=typeof input.email==='string'?input.email.trim().toLowerCase():'';
   const pass=typeof input.password==='string'?input.password:'';
   if(!email||pass.length>256||!pass)return replyError(res,400,'Identifiants invalides');
   const result=await pool.query('SELECT id,email,password_hash,password_salt FROM users WHERE email=$1 AND email_verified_at IS NOT NULL AND disabled_at IS NULL',[email]);
   const u=result.rows[0];
   const calc=await scrypt(pass,u?.password_salt||'dummy-salt',64);
   const expected=u?.password_hash&&/^[a-f0-9]{128}$/.test(u.password_hash)?Buffer.from(u.password_hash,'hex'):Buffer.alloc(64);
   if(!u||!timingSafeEqual(calc,expected))return replyError(res,401,'Identifiants invalides');
   const token=randomBytes(32).toString('hex');
   await pool.query("INSERT INTO sessions(id,user_id,token_hash,expires_at) VALUES($1,$2,$3,now()+interval '7 days')",[randomUUID(),u.id,hash(token)]);
   setCookie(res,token,604800);
   return json(res,200,{user:{id:u.id,email:u.email}});
  }
  if(req.method==='POST'&&p==='/api/auth/logout'){
   const token=cookie(req).trokiva_session;
   if(token)await pool.query('UPDATE sessions SET revoked_at=now() WHERE token_hash=$1',[hash(token)]);
   setCookie(res,'',0);return json(res,200,{ok:true});
  }
  if(p==='/api/my/offers' || /^\/api\/my\/offers\/[a-f0-9-]{36}\/(accept|decline|cancel)$/.test(p)){
   if(!exchangesEnabled)return replyError(res,503,'Échanges non encore activés : contrôles de sécurité en cours');
  }
  if(req.method==='GET'&&p==='/api/my/offers'){
   const u=await userFromRequest(req);
   if(!u)return replyError(res,401,'Connexion nécessaire');
   const data=await pool.query(
    "SELECT e.id,e.listing_id,e.sender_id,e.recipient_id,e.message,e.status,e.created_at,e.updated_at,l.title AS listing_title,l.state AS listing_state FROM exchange_offers e JOIN listings l ON l.id=e.listing_id WHERE e.sender_id=$1 OR e.recipient_id=$1 ORDER BY e.created_at DESC LIMIT 100",
    [u.id]
   );
   return json(res,200,{items:data.rows});
  }
  if(req.method==='POST'&&p==='/api/my/offers'){
   const u=await userFromRequest(req);
   if(!u)return replyError(res,401,'Connexion nécessaire');
   if(!rateLimit(req,'offer-create',10,60*60*1000))return replyError(res,429,'Trop de propositions');
   const input=await body(req);
   const listingId=typeof input.listingId==='string'?input.listingId:'';
   const message=typeof input.message==='string'?input.message.trim():'';
   if(!/^[a-f0-9-]{36}$/.test(listingId)||message.length<10||message.length>600)return replyError(res,400,'Annonce ou proposition invalide (10 à 600 caractères)');
   try{
    const q=await pool.query(
     "INSERT INTO exchange_offers (id,listing_id,sender_id,recipient_id,message) SELECT $1,l.id,$2,l.owner_id,$3 FROM listings l JOIN users owner ON owner.id=l.owner_id WHERE l.id=$4 AND l.state='published' AND l.owner_id<>$2 AND owner.disabled_at IS NULL AND owner.email_verified_at IS NOT NULL RETURNING id,listing_id,status,created_at",
     [randomUUID(),u.id,message,listingId]
    );
    return q.rowCount?json(res,201,{offer:q.rows[0]}):replyError(res,404,'Annonce indisponible ou non accessible');
   }catch(e){
    if(e.code==='23505')return replyError(res,409,'Une proposition en attente existe déjà pour cette annonce');
    throw e;
   }
  }
  const offerDecision=p.match(/^\/api\/my\/offers\/([a-f0-9-]{36})\/(accept|decline|cancel)$/);
  if(offerDecision&&req.method==='POST'){
   const u=await userFromRequest(req);
   if(!u)return replyError(res,401,'Connexion nécessaire');
   if(!rateLimit(req,'offer-decision',20,60*60*1000))return replyError(res,429,'Trop de décisions');
   const [,offerId,decision]=offerDecision;
   const client=await pool.connect();
   try{
    await client.query('BEGIN');
    const lock=await client.query(
     "SELECT e.id,e.listing_id,e.sender_id,e.recipient_id,e.status,l.state AS listing_state,l.owner_id FROM exchange_offers e JOIN listings l ON l.id=e.listing_id JOIN users sender ON sender.id=e.sender_id WHERE e.id=$1 AND (e.sender_id=$2 OR e.recipient_id=$2) AND sender.disabled_at IS NULL AND sender.email_verified_at IS NOT NULL FOR UPDATE OF l,e",
     [offerId,u.id]
    );
    const offer=lock.rows[0];
    if(!offer || offer.status!=='pending'){
     await client.query('ROLLBACK');return replyError(res,404,'Proposition introuvable ou déjà traitée');
    }
    const recipientAction=decision==='accept'||decision==='decline';
    if(recipientAction && offer.recipient_id!==u.id || decision==='cancel'&&offer.sender_id!==u.id){
     await client.query('ROLLBACK');return replyError(res,403,'Action non autorisée');
    }
    if(decision==='accept'){
     if(offer.listing_state!=='published'||offer.owner_id!==u.id){
      await client.query('ROLLBACK');return replyError(res,409,'Cette annonce n’est plus disponible');
     }
     await client.query("UPDATE listings SET state='reserved',updated_at=now() WHERE id=$1 AND state='published'",[offer.listing_id]);
     await client.query("UPDATE exchange_offers SET status='accepted',updated_at=now() WHERE id=$1",[offerId]);
     await client.query("UPDATE exchange_offers SET status='declined',updated_at=now() WHERE listing_id=$1 AND id<>$2 AND status='pending'",[offer.listing_id,offerId]);
    }else{
     await client.query('UPDATE exchange_offers SET status=$2,updated_at=now() WHERE id=$1',[offerId,decision==='cancel'?'cancelled':'declined']);
    }
    await client.query('COMMIT');
    return json(res,200,{offer:{id:offerId,status:decision==='accept'?'accepted':decision==='cancel'?'cancelled':'declined'}});
   }catch(e){await client.query('ROLLBACK').catch(()=>{});throw e}finally{client.release()}
  }
  if(p==='/api/my/listings'){
   const u=await userFromRequest(req);
   if(!u)return replyError(res,401,'Connexion nécessaire');
   if(req.method==='GET'){
    const data=await pool.query('SELECT id,title,category,description,wanted,city,state,created_at,updated_at FROM listings WHERE owner_id=$1 ORDER BY created_at DESC LIMIT 100',[u.id]);
    return json(res,200,{items:data.rows});
   }
   if(req.method==='POST'){
    const input=await body(req);
    if(!validListing(input))return replyError(res,400,'Annonce invalide');
    const id=randomUUID();
    const data=await pool.query("INSERT INTO listings (id,owner_id,title,category,description,wanted,city,state) VALUES ($1,$2,$3,$4,$5,$6,$7,'draft') RETURNING id,state",[id,u.id,input.title.trim(),input.category.trim(),(input.description||'').trim(),(input.wanted||'').trim(),(input.city||'').trim()]);
    return json(res,201,{listing:data.rows[0]});
   }
  }
  const publish=p.match(/^\/api\/my\/listings\/([a-f0-9-]{36})\/publish$/);
  if(publish && req.method==='POST'){
   const u=await userFromRequest(req);
   if(!u)return replyError(res,401,'Connexion nécessaire');
   if(!rateLimit(req,'publish',12,60*60*1000))return replyError(res,429,'Trop de publications');
   const result=await pool.query(
    "UPDATE listings SET state='published',updated_at=now() WHERE id=$1 AND owner_id=$2 AND state='draft' AND length(trim(title))>=3 AND length(trim(category))>0 AND length(trim(description))>=20 AND length(trim(city))>=2 RETURNING id,state,title,created_at",
    [publish[1],u.id]
   );
   if(!result.rowCount)return replyError(res,422,'Annonce introuvable ou incomplète : description de 20 caractères et ville requises');
   return json(res,200,{listing:result.rows[0]});
  }
  const hide=p.match(/^\/api\/my\/listings\/([a-f0-9-]{36})\/hide$/);
  if(hide && req.method==='POST'){
   const u=await userFromRequest(req);
   if(!u)return replyError(res,401,'Connexion nécessaire');
   const result=await pool.query("UPDATE listings SET state='hidden',updated_at=now() WHERE id=$1 AND owner_id=$2 AND state='published' RETURNING id,state",[hide[1],u.id]);
   if(!result.rowCount)return replyError(res,404,'Annonce introuvable ou non publiée');
   return json(res,200,{listing:result.rows[0]});
  }
  const restore=p.match(/^\/api\/my\/listings\/([a-f0-9-]{36})\/restore$/);
  if(restore && req.method==='POST'){
   const u=await userFromRequest(req);
   if(!u)return replyError(res,401,'Connexion nécessaire');
   const result=await pool.query("UPDATE listings SET state='draft',updated_at=now() WHERE id=$1 AND owner_id=$2 AND state='hidden' RETURNING id,state",[restore[1],u.id]);
   if(!result.rowCount)return replyError(res,404,'Annonce introuvable ou non masquée');
   return json(res,200,{listing:result.rows[0]});
  }
  const m=p.match(/^\/api\/my\/listings\/([a-f0-9-]{36})$/);
  if(m){
   const u=await userFromRequest(req);if(!u)return replyError(res,401,'Connexion nécessaire');
   const id=m[1];
   if(req.method==='DELETE'){
    const q=await pool.query("DELETE FROM listings WHERE id=$1 AND owner_id=$2 AND state='draft' RETURNING id",[id,u.id]);
    return q.rowCount?json(res,200,{deleted:true}):replyError(res,404,'Brouillon introuvable');
   }
   if(req.method==='PATCH'){
    const input=await body(req);
    if(!validListing(input))return replyError(res,400,'Annonce invalide');
    const q=await pool.query("UPDATE listings SET title=$3,category=$4,description=$5,wanted=$6,city=$7,updated_at=now() WHERE id=$1 AND owner_id=$2 AND state='draft' RETURNING id,state",[id,u.id,input.title.trim(),input.category.trim(),(input.description||'').trim(),(input.wanted||'').trim(),(input.city||'').trim()]);
    return q.rowCount?json(res,200,{listing:q.rows[0]}):replyError(res,404,'Brouillon introuvable');
   }
  }
  return replyError(res,404,'Route API introuvable');
 }
 if(req.method!=='GET'&&req.method!=='HEAD')return replyError(res,405,'Méthode non autorisée');
 const pages={'/compte.html':'compte.html','/':'index.html','/index.html':'index.html','/manifest.webmanifest':'manifest.webmanifest','/icon.svg':'icon.svg','/sw.js':'sw.js','/verify.html':'verify.html','/reset-password.html':'reset-password.html','/assets/trokiva-symbol.svg':'assets/trokiva-symbol.svg'};
 const file=pages[p];return file?serve(res,file):replyError(res,404,'Introuvable');
};
const server=http.createServer((req,res)=>{routed(req,res).catch(err=>{console.error('Request error',err.code||err.name||'unknown');if(!res.headersSent)replyError(res,err.status||500,err.status?err.message:'Erreur serveur');else res.end()})});
if(process.env.RUN_SERVER!=='false') {
 if(process.env.RUN_MIGRATIONS_ON_BOOT==='true') {
  if(!dbUrl)throw new Error('Migration demandée mais DATABASE_URL absente');
  const {migrateDatabase}=await import('./migrate.js');
  const tables=await migrateDatabase(dbUrl);
  console.log('TROKIVA schema migration verified:',tables.length,'tables');
 }
 server.listen(port,()=>console.log('TROKIVA API listening on port',port));
}
export {server,validListing};

import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import pg from 'pg';

export async function migrateDatabase(databaseUrl = process.env.DATABASE_URL) {
 if(!databaseUrl)throw new Error('DATABASE_URL absente : aucune migration exécutée.');
 const sql=await fs.readFile(path.join(path.dirname(fileURLToPath(import.meta.url)),'schema.sql'),'utf8');
 const client=new pg.Client({connectionString:databaseUrl,connectionTimeoutMillis:8000});
 try {
  await client.connect();
  await client.query('SELECT pg_advisory_lock(490017,1)');
  try {
   await client.query(sql);
   const result=await client.query("SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename IN ('users','email_verifications','password_resets','sessions','listings','exchange_offers','listing_reports','exchange_messages') ORDER BY tablename");
   if(result.rowCount!==8)throw new Error('Migration incomplète : huit tables attendues');
   return result.rows.map(x=>x.tablename);
  } finally {
   await client.query('SELECT pg_advisory_unlock(490017,1)');
  }
 } finally {await client.end().catch(()=>{})}
}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
 try{
  const tables=await migrateDatabase();
  console.log('Schéma TROKIVA prêt :',tables.join(', '));
 }catch(e){console.error('Migration non validée :',e.message);process.exitCode=1}
}

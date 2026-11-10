import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import pg from 'pg';

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL absente : aucune migration exécutée.');
  process.exitCode = 1;
} else {
  const sql = await fs.readFile(path.join(path.dirname(fileURLToPath(import.meta.url)),'schema.sql'),'utf8');
  const client = new pg.Client({connectionString:process.env.DATABASE_URL});
  try {
    await client.connect();
    await client.query('SELECT pg_advisory_lock(490017, 1)');
    try {
      await client.query(sql);
      const result=await client.query("SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename IN ('users','email_verifications','sessions','listings') ORDER BY tablename");
      if(result.rowCount!==4)throw new Error('Migration incomplète');
      console.log('Schéma TROKIVA vérifié :',result.rows.map(x=>x.tablename).join(', '));
    } finally {
      await client.query('SELECT pg_advisory_unlock(490017, 1)');
    }
  } catch(e) {
    console.error('Migration non validée :',e.message);
    process.exitCode=1;
  } finally {
    await client.end().catch(()=>{});
  }
}

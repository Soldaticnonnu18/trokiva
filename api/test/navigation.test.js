import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const html=fs.readFileSync(new URL('../../index.html',import.meta.url),'utf8');
const inlineScripts=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].map(x=>x[1]).filter(x=>x.trim());

test('PWA: JavaScript inline is syntactically valid',()=>{
 assert.ok(inlineScripts.length>=1,'Aucun script inline');
 for(const source of inlineScripts)assert.doesNotThrow(()=>new vm.Script(source));
});
test('PWA mobile: previous/next history buttons are accessible',()=>{
 for(const id of ['nav-back','nav-forward']){
  assert.match(html,new RegExp('id="'+id+'"'));
  assert.match(html,new RegExp('\\$\\(\x27'+id+'\x27\\)'));
 }
 assert.match(html,/history\.pushState\(/);
 assert.match(html,/history\.back\(/);
 assert.match(html,/history\.forward\(/);
 assert.match(html,/addEventListener\('popstate'/);
 assert.match(html,/\.mobile-history\{display:none\}/);
 assert.match(html,/@media\(max-width:760px\)/);
});
test('PWA: local drafts are not removed by navigation',()=>{
 assert.match(html,/const storageKey='trokiva-drafts-v2'/);
 assert.match(html,/if\(page==='profil'\)renderDrafts\(\)/);
 assert.match(html,/id="export-drafts"/);
 assert.match(html,/id="import-drafts"/);
});

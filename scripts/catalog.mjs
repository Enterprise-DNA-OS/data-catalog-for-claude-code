#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {getDb,REPO_ROOT} from './lib/db.mjs';
import {table} from './lib/format.mjs';
import {parseCsv,pick} from './lib/csv.mjs';

export const reads={
 assets:"select * from catalog_register where not archived order by source,namespace,name",
 fields:"select a.source,a.name as asset,f.name,f.data_type,f.description,f.classification from fields f join assets a on a.id=f.asset_id where not a.archived order by a.name,f.name",
 glossary:"select t.name,t.definition,t.owner,count(l.id)::int as linked_assets from terms t left join term_links l on l.term_id=t.id group by t.id order by t.name",
 'review-queue':'select * from review_queue order by review_due nulls first,name',
 'owner-workload':'select * from owner_workload order by reviews_due desc,owner',
 'definition-gaps':"select a.source,a.name as asset,f.name as field from fields f join assets a on a.id=f.asset_id where not a.archived and trim(f.description)='' order by a.name,f.name",
 'sensitive-register':"select a.source,a.name,a.owner,a.classification,a.purpose,a.retention_rule,a.review_due from assets a where not archived and (classification in ('personal','sensitive') or exists(select 1 from fields f where f.asset_id=a.id and f.classification in ('personal','sensitive'))) order by a.name",
 lineage:'select u.name as upstream,d.name as downstream,l.evidence from lineage l join assets u on u.id=l.upstream_id join assets d on d.id=l.downstream_id order by u.name,d.name',
 issues:"select i.id,a.name as asset,i.title,i.owner,i.severity,i.due,i.status from issues i join assets a on a.id=i.asset_id order by i.status,i.due,i.title",
 quality:'select name,rule,checked_on,examined,failed,failed_percent,evidence from quality_latest order by failed_percent desc,name',
 attention:"select 'review' as kind,name as asset,next_action as action,review_due as due from review_queue union all select 'issue',a.name,i.title,i.due from issues i join assets a on a.id=i.asset_id where i.status='open' and i.due<current_date order by due nulls first,asset",
 compliance:'select name,rule,finding from compliance_checks order by name,rule',
 history:'select entity,entity_id,action,actor,created_at from audit order by created_at,id',
 'unlinked-terms':'select t.name,t.definition,t.owner from terms t where not exists(select 1 from term_links l where l.term_id=t.id) order by name'
};
export const usage={...Object.fromEntries(Object.keys(reads).map(k=>[k,''])),
 asset:'<name-or-id>',impact:'<name-or-id>','weekly-review':'',
 add:'--source= --namespace= --name= --kind= --description= --owner= --actor=',
 'describe-field':'<asset> --field= --description= [--classification=] --actor=',
 'add-field':'<asset> --name= --type= --description= --classification= --actor=',
 'set-metadata':'<asset> [--owner= --classification= --purpose= --retention= --security= --description=] --actor=',
 'define-term':'--name= --definition= --owner= --actor=',
 'link-term':'<asset> --term= --actor=',
 'link-lineage':'<upstream> --downstream= --evidence= --actor=',
 review:'<asset> --next-due=YYYY-MM-DD --evidence= --actor=',
 'raise-issue':'<asset> --title= --owner= --severity=high|medium|low --due=YYYY-MM-DD --actor=',
 'resolve-issue':'<issue-id-or-title> --resolution= --actor=',
 'log-quality':'<asset> --rule= --on=YYYY-MM-DD --examined= --failed= --evidence= --actor=',
 import:'dataedo --file=export.xlsx|tables.csv [--sheet=Tables --columns-sheet=Columns --columns-file=columns.csv --header-row=1 --map=map.json --dry-run] --actor=',
 export:'--file=exports/catalog.json',
 'draft-review':'--actor=',help:''};
const opts={
 add:['source','namespace','name','kind','description','owner'],
 'describe-field':['field','description','classification'],
 'add-field':['name','type','description','classification'],
 'set-metadata':['owner','classification','purpose','retention','security','description'],
 'define-term':['name','definition','owner'],'link-term':['term'],'link-lineage':['downstream','evidence'],
 review:['next-due','evidence'],'raise-issue':['title','owner','severity','due'],
 'resolve-issue':['resolution'],'log-quality':['rule','on','examined','failed','evidence'],
 import:['file','sheet','columns-sheet','columns-file','header-row','map','dry-run'],export:['file']
};
const writeCommands=new Set(['add','add-field','describe-field','set-metadata','define-term','link-term','link-lineage','review','raise-issue','resolve-issue','log-quality','import']);
const positional=new Set(['asset','impact','add-field','describe-field','set-metadata','link-term','link-lineage','review','raise-issue','resolve-issue','log-quality','import']);
function parse(args){
 const [command='help',...rest]=args;if(!Object.hasOwn(usage,command))throw Error('Unknown command: '+command);
 const o={},p=[];
 for(const arg of rest){if(!arg.startsWith('--')){p.push(arg);continue;}const ix=arg.indexOf('=');const k=arg.slice(2,ix<0?undefined:ix),v=ix<0?true:arg.slice(ix+1);
 if(![...(opts[command]||[]),'json',...((writeCommands.has(command)||command==='draft-review')?['actor']:[])].includes(k))throw Error('Unknown option: '+k);
 if(Object.hasOwn(o,k))throw Error('Duplicate option: '+k);
 if(['json','dry-run'].includes(k)&&v!==true)throw Error(k+' is a boolean flag');
 if(!['json','dry-run'].includes(k)&&typeof v!=='string')throw Error(k+' needs --'+k+'=value');o[k]=v;}
 if(p.length!==(positional.has(command)?1:0))throw Error('Usage: '+command+' '+usage[command]);
 return {command,o,p};
}
const required=(o,k)=>{if(typeof o[k]!=='string'||!o[k].trim())throw Error('Required --'+k+'=value');return o[k].trim();};
export function validDate(s){if(!/^\d{4}-\d{2}-\d{2}$/.test(s)||Number.isNaN(Date.parse(s+'T00:00:00Z'))||new Date(s+'T00:00:00Z').toISOString().slice(0,10)!==s)throw Error('Use a valid YYYY-MM-DD date');return s;}
function integer(s){if(!/^(0|[1-9]\d*)$/.test(s)||!Number.isSafeInteger(Number(s)))throw Error('Expected a nonnegative integer');return Number(s);}
async function resolve(db,entity,value,name='name'){
 const rows=await db.query(`select * from ${entity} order by ${name},id`);
 let hits=rows.filter(r=>r.id===value||r[name].toLowerCase()===value.toLowerCase());
 if(!hits.length)hits=rows.filter(r=>r.id.startsWith(value)||r[name].toLowerCase().includes(value.toLowerCase()));
 if(hits.length!==1){const e=Error(hits.length?'Ambiguous match: '+hits.map(r=>r[name]+' ('+r.id+')').join(', '):'No matching '+entity);e.candidates=hits.map(r=>({id:r.id,name:r[name],source:r.source}));throw e;}
 return hits[0];
}
async function audit(db,entity,id,action,actor,before,after){await db.query('insert into audit(entity,entity_id,action,actor,before_row,after_row) values($1,$2,$3,$4,$5,$6)',[entity,id,action,actor,before?JSON.stringify(before):null,after?JSON.stringify(after):null]);}
async function insert(db,entity,row,actor,action='add'){
 const keys=Object.keys(row),rows=await db.query(`insert into ${entity}(${keys.join(',')}) values(${keys.map((_,i)=>'$'+(i+1)).join(',')}) returning *`,keys.map(k=>row[k]));
 await audit(db,entity,rows[0].id,action,actor,null,rows[0]);return rows[0];
}
async function update(db,entity,before,changes,actor,action){
 const keys=Object.keys(changes);const [after]=await db.query(`update ${entity} set ${keys.map((k,i)=>k+'=$'+(i+1)).join(',')} where id=$${keys.length+1} returning *`,[...keys.map(k=>changes[k]),before.id]);
 await audit(db,entity,before.id,action,actor,before,after);return after;
}
async function active(db,value){const a=await resolve(db,'assets',value);if(a.archived)throw Error('Asset is archived');return a;}
async function impact(db,id){return db.query(`WITH RECURSIVE reached(id) AS (SELECT downstream_id FROM lineage WHERE upstream_id=$1 UNION SELECT l.downstream_id FROM lineage l JOIN reached r ON l.upstream_id=r.id) SELECT a.source,a.name,a.owner,a.kind,a.review_due FROM reached r JOIN assets a ON a.id=r.id WHERE a.id<>$1 ORDER BY a.name`,[id]);}
async function assetDetail(db,id){return {asset:(await db.query('select * from assets where id=$1',[id]))[0],fields:await db.query('select * from fields where asset_id=$1 order by name',[id]),terms:await db.query('select t.name,t.definition from terms t join term_links l on l.term_id=t.id where l.asset_id=$1',[id]),issues:await db.query('select * from issues where asset_id=$1 order by due',[id]),reviews:await db.query('select * from reviews where asset_id=$1 order by created_at',[id]),quality:await db.query('select * from quality_runs where asset_id=$1 order by checked_on',[id]),history:await db.query('select * from audit where entity_id=$1 order by created_at,id',[id])};}
const aliases={source:['Source','Database','Data source'],namespace:['Schema','Namespace'],name:['Name','Table','Object name'],kind:['Type','Object type'],description:['Description'],asset:['Table','Table name','Object','Parent'],field:['Name','Column','Column name'],type:['Data type','Datatype']};
async function readImport(o){
 const file=path.resolve(REPO_ROOT,required(o,'file')),map=o.map?JSON.parse(fs.readFileSync(path.resolve(REPO_ROOT,o.map),'utf8')):{};
 const header=integer(o['header-row']||'1');if(header<1)throw Error('header-row must be positive');
 let assets,columns=[];
 if(file.toLowerCase().endsWith('.xlsx')){
  const {default:ExcelJS}=await import('exceljs');const book=new ExcelJS.Workbook();await book.xlsx.readFile(file);
  function sheetRows(name,optional=false){const s=book.getWorksheet(name);if(!s){if(optional)return [];throw Error('No sheet '+name+'; available: '+book.worksheets.map(x=>x.name).join(', '));}
   const rows=[];s.eachRow({includeEmpty:true},(row,i)=>{if(i<header)return;rows.push(Array.from({length:s.columnCount},(_,j)=>row.getCell(j+1).text));});
   if(!rows.length)throw Error('Empty sheet '+name);
   // Ignore only trailing blank columns, never internal empty headings.
   while(rows[0].at(-1)==='')for(const row of rows)row.pop();
   const csv=rows.map(row=>row.map(v=>'"'+v.replaceAll('"','""')+'"').join(',')).join('\n');return parseCsv(csv);
  }
  assets=sheetRows(o.sheet||'Tables');columns=sheetRows(o['columns-sheet']||'Columns',!o['columns-sheet']);
 }else if(file.toLowerCase().endsWith('.csv')){assets=parseCsv(fs.readFileSync(file,'utf8'));if(o['columns-file'])columns=parseCsv(fs.readFileSync(path.resolve(REPO_ROOT,o['columns-file']),'utf8'));}
 else throw Error('Import requires .xlsx or .csv');
 if(!assets.length)throw Error('No asset rows found');
 const value=(row,k,section)=>pick(row,...(map[section]?.[k]?[map[section][k]]:aliases[k]||[k])).trim();
 const seen=new Set();
 const mapped=assets.map((row,i)=>{const a={source:value(row,'source','assets'),namespace:value(row,'namespace','assets'),name:value(row,'name','assets'),kind:value(row,'kind','assets').toLowerCase()||'table',description:value(row,'description','assets'),source_row:row};
  if(!a.source||!a.name)throw Error(`Asset row ${i+2} needs source and name; use --map for your export headings`);
  if(!['table','view','report','file','dataset'].includes(a.kind))throw Error('Unsupported object type: '+a.kind);
  const key=JSON.stringify([a.source,a.namespace,a.name]);if(seen.has(key))throw Error('Duplicate asset in import: '+key);seen.add(key);return a;});
 const seenFields=new Set();const fsMapped=columns.map((row,i)=>{const f={source:value(row,'source','fields'),namespace:value(row,'namespace','fields'),asset:value(row,'asset','fields'),name:value(row,'field','fields'),data_type:value(row,'type','fields'),description:value(row,'description','fields'),source_row:row};
  if(!f.source||!f.asset||!f.name)throw Error(`Column row ${i+2} needs source, parent and name`);
  const key=JSON.stringify([f.source,f.namespace,f.asset,f.name]);if(seenFields.has(key))throw Error('Duplicate field in import');seenFields.add(key);return f;});
 return {assets:mapped,fields:fsMapped};
}
async function importData(db,o,actor){
 const payload=await readImport(o),stats={assets_added:0,assets_updated:0,fields_added:0,fields_updated:0,unchanged:0,dry_run:!!o['dry-run']};
 for(const a of payload.assets){const [before]=await db.query('select * from assets where source=$1 and namespace=$2 and name=$3',[a.source,a.namespace,a.name]);
  if(!before){await insert(db,'assets',{...a,source_row:JSON.stringify(a.source_row)},actor,'import');stats.assets_added++;}
  else{if(before.archived)throw Error('Import matches archived asset');const changed=before.description!==a.description||before.kind!==a.kind||JSON.stringify(before.source_row)!==JSON.stringify(a.source_row);
   // JSONB normalises object key order, compare source values independently of property order.
   const sameSource=JSON.stringify(Object.entries(before.source_row||{}).sort())===JSON.stringify(Object.entries(a.source_row).sort());
   if(changed&&(!sameSource||before.description!==a.description||before.kind!==a.kind)){await update(db,'assets',before,{description:a.description,kind:a.kind,source_row:JSON.stringify(a.source_row),review_required:true},actor,'import');stats.assets_updated++;}else stats.unchanged++;
  }
 }
 for(const f of payload.fields){const [a]=await db.query('select * from assets where source=$1 and namespace=$2 and name=$3',[f.source,f.namespace,f.asset]);if(!a||a.archived)throw Error('Column parent missing or archived: '+f.asset);
  const row={asset_id:a.id,name:f.name,data_type:f.data_type,description:f.description,source_row:JSON.stringify(f.source_row)};
  const [before]=await db.query('select * from fields where asset_id=$1 and name=$2',[a.id,f.name]);
  if(!before){await insert(db,'fields',row,actor,'import');stats.fields_added++;await update(db,'assets',a,{review_required:true},actor,'import-field');}
  else if(before.description!==f.description||before.data_type!==f.data_type||JSON.stringify(Object.entries(before.source_row||{}).sort())!==JSON.stringify(Object.entries(f.source_row).sort())){await update(db,'fields',before,row,actor,'import');stats.fields_updated++;await update(db,'assets',a,{review_required:true},actor,'import-field');}else stats.unchanged++;
 }
 return stats;
}
async function execute(db,command,o,p){
 if(Object.hasOwn(reads,command))return db.query(reads[command]);
 if(command==='help')return Object.entries(usage).map(([command,args])=>({command,args}));
 if(command==='asset')return assetDetail(db,(await resolve(db,'assets',p[0])).id);
 if(command==='impact')return impact(db,(await resolve(db,'assets',p[0])).id);
 if(command==='weekly-review')return {review_queue:await db.query(reads['review-queue']),quality:await db.query(reads.quality),issues:await db.query(reads.issues),compliance:await db.query(reads.compliance)};
 if(command==='export'){
  const result={format:'data-catalog-v1',exported_at:new Date().toISOString()};
  await db.exec('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');
  try{for(const entity of ['assets','fields','terms','term_links','lineage','reviews','issues','quality_runs','audit'])result[entity]=await db.query('select * from '+entity+' order by id');await db.exec('COMMIT');}catch(e){await db.exec('ROLLBACK');throw e;}
  const file=path.resolve(REPO_ROOT,required(o,'file'));fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,JSON.stringify(result,null,2)+'\n',{flag:'wx'});return {file,assets:result.assets.length};
 }
 const actor=required(o,'actor');
 if(command==='draft-review'){
  const data=await execute(db,'weekly-review',{},[]);const file=path.join(process.env.OUTPUT_DIR||REPO_ROOT,'drafts',`steward-review-${randomUUID()}.md`);fs.mkdirSync(path.dirname(file),{recursive:true});
  fs.writeFileSync(file,`# Internal steward review\n\nDraft for ${actor}. Generated ${new Date().toISOString()}. Human review required.\n\n`+Object.entries(data).map(([k,v])=>'## '+k.replaceAll('_',' ')+'\n\n'+format(v)).join('\n\n')+'\n',{flag:'wx'});return {file};
 }
 if(command==='import'){if(p[0]!=='dataedo')throw Error('Only dataedo imports are supported');return importData(db,o,actor);}
 if(command==='add')return insert(db,'assets',{source:required(o,'source'),namespace:o.namespace||'',name:required(o,'name'),kind:o.kind||'table',description:o.description||'',owner:required(o,'owner')},actor);
 if(command==='define-term')return insert(db,'terms',{name:required(o,'name'),definition:required(o,'definition'),owner:required(o,'owner')},actor);
 if(command==='resolve-issue'){
  const issue=await resolve(db,'issues',p[0],'title');if(issue.status!=='open')throw Error('Issue already resolved');return update(db,'issues',issue,{status:'resolved',resolution:required(o,'resolution'),resolved_on:(await db.query('select current_date::text today'))[0].today},actor,'resolve');
 }
 const a=await active(db,p[0]);
 if(command==='add-field'){const f=await insert(db,'fields',{asset_id:a.id,name:required(o,'name'),data_type:o.type||'',description:o.description||'',classification:o.classification||'unknown'},actor);await update(db,'assets',a,{review_required:true},actor,'field-changed');return f;}
 if(command==='describe-field'){
  const all=await db.query('select * from fields where asset_id=$1',[a.id]);const name=required(o,'field');const exact=all.filter(f=>f.id===name||f.name.toLowerCase()===name.toLowerCase());const hits=exact.length?exact:all.filter(f=>f.id.startsWith(name)||f.name.toLowerCase().includes(name.toLowerCase()));
  if(hits.length!==1){const e=Error(hits.length?'Ambiguous field':'No matching field');e.candidates=hits.map(f=>({id:f.id,name:f.name}));throw e;}
  const changes={description:required(o,'description')};if(o.classification)changes.classification=o.classification;
  const f=await update(db,'fields',hits[0],changes,actor,'describe');await update(db,'assets',a,{review_required:true},actor,'field-changed');return f;
 }
 if(command==='set-metadata'){
  const changes={};for(const [flag,col] of Object.entries({owner:'owner',classification:'classification',purpose:'purpose',retention:'retention_rule',security:'security_evidence',description:'description'}))if(Object.hasOwn(o,flag))changes[col]=o[flag].trim();
  if(!Object.keys(changes).length)throw Error('No metadata changes specified');return update(db,'assets',a,{...changes,review_required:true},actor,'metadata');
 }
 if(command==='link-term'){const term=await resolve(db,'terms',required(o,'term'));const result=await insert(db,'term_links',{asset_id:a.id,term_id:term.id},actor);await update(db,'assets',a,{review_required:true},actor,'term-linked');return result;}
 if(command==='link-lineage'){const downstream=await active(db,required(o,'downstream'));return insert(db,'lineage',{upstream_id:a.id,downstream_id:downstream.id,evidence:required(o,'evidence')},actor);}
 const today=(await db.query('select current_date::text today'))[0].today;
 if(command==='review'){
  const next=validDate(required(o,'next-due'));if(next<=today)throw Error('Next review must be in the future');
  if(!a.owner||!a.description||a.classification==='unknown')throw Error('Review needs owner, description and classification');
  const personal=a.classification==='personal'||a.classification==='sensitive'||(await db.query("select 1 from fields where asset_id=$1 and classification in ('personal','sensitive')",[a.id])).length>0;
  if(personal&&(!a.purpose||!a.retention_rule||!a.security_evidence))throw Error('Personal records need purpose, retention rationale and security evidence');
  const review=await insert(db,'reviews',{asset_id:a.id,actor,evidence:required(o,'evidence'),next_due:next,snapshot:JSON.stringify({asset:a,fields:await db.query('select * from fields where asset_id=$1 order by name',[a.id]),terms:await db.query('select t.name,t.definition from terms t join term_links l on l.term_id=t.id where l.asset_id=$1',[a.id])})},actor,'review');
  await update(db,'assets',a,{last_reviewed:today,review_due:next,review_required:false},actor,'review');return review;
 }
 if(command==='raise-issue')return insert(db,'issues',{asset_id:a.id,title:required(o,'title'),owner:required(o,'owner'),severity:required(o,'severity'),due:validDate(required(o,'due'))},actor);
 if(command==='log-quality'){
  const on=validDate(required(o,'on'));if(on>today)throw Error('Quality observation cannot be in the future');
  return insert(db,'quality_runs',{asset_id:a.id,rule:required(o,'rule'),checked_on:on,examined:integer(required(o,'examined')),failed:integer(required(o,'failed')),evidence:required(o,'evidence'),actor},actor,'quality');
 }
 throw Error('Unhandled command');
}
export async function run(db,args){
 const {command,o,p}=parse(args);
 if(!writeCommands.has(command))return execute(db,command,o,p);
 await db.exec('BEGIN');
 try{
  // Serialize desk mutations across PostgreSQL sessions, including check-then-write reviews.
  await db.exec('LOCK TABLE assets IN SHARE ROW EXCLUSIVE MODE');
  const result=await execute(db,command,o,p);await db.exec(o['dry-run']?'ROLLBACK':'COMMIT');return result;
 }catch(e){await db.exec('ROLLBACK');throw e;}
}
export function format(result){
 if(Array.isArray(result)){if(!result.length)return '  (none)';const keys=Object.keys(result[0]).filter(k=>k!=='id'&&k!=='asset_id');return table(result.map(r=>Object.fromEntries(Object.entries(r).map(([k,v])=>[k,typeof v==='object'&&v!==null?JSON.stringify(v):v]))),keys.map(k=>({key:k,label:k.replaceAll('_',' '),width:55})));}
 return Object.entries(result).map(([k,v])=>Array.isArray(v)?'\n'+k.replaceAll('_',' ').toUpperCase()+'\n'+format(v):typeof v==='object'&&v!==null?'\n'+k.toUpperCase()+'\n'+format([v]):`${k}: ${v}`).join('\n');
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){
 let db;try{db=await getDb();const result=await run(db,process.argv.slice(2));console.log(process.argv.includes('--json')?JSON.stringify(result,null,2):format(result));}
 catch(e){console.error(process.argv.includes('--json')?JSON.stringify({error:e.message,candidates:e.candidates||[]}):e.message);process.exitCode=1;}
 finally{if(db)await db.close();}
}

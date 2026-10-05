/* Read-only regression checks for inventory filtering and partial updates. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import ts from 'typescript';
import { createRequire } from 'node:module';
const loadDependency = createRequire(import.meta.url);
function compile(file, imports = {}) {
  const filename = path.resolve(file);
  const source = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  const loadedModule = {exports:{}};
  vm.runInNewContext(source, {module:loadedModule,exports:loadedModule.exports,require:(name)=>Object.hasOwn(imports,name)?imports[name]:loadDependency(name),Request,Response,URL,console}, {filename});
  return loadedModule.exports;
}
const stock = compile('src/lib/stock.ts');
const defaults={query:'',brandId:'',categoryId:'',customerName:'',status:'all',missingCostOnly:false,zeroStockOnly:false};
const row=(id,quantity,active=true)=>({id,name:'Perfume '+id,brandName:'Marca',brandId:'b',categoryName:'Árabes',categoryId:'c',catalogReference:'REF-'+id,customerNames:['Cliente'],stock:quantity,lowStockAlert:3,active,status:stock.getStockStatus(quantity,3)});
const rows=[row('low',3),row('stable',4),row('reserve',0),row('inactive',0,false)];
assert.deepEqual(stock.filterStockRows(rows,{...defaults,inventory:'in'}).map(r=>r.id),['low','stable']);
assert.deepEqual(stock.filterStockRows(rows,{...defaults,inventory:'reserve'}).map(r=>r.id),['reserve']);
assert.deepEqual(stock.filterStockRows(rows,{...defaults,inventory:'inactive'}).map(r=>r.id),['inactive']);
assert.deepEqual(stock.filterStockRows(rows,{...defaults,status:'LOW'}).map(r=>r.id),['low']);
for(const query of ['arabes','Cliente','REF-']) assert.equal(stock.filterStockRows(rows,{...defaults,query}).length,4);
let writes=[],movements=[];
const original={id:'p',stock:12,lowStockAlert:3,active:true,salePriceInCents:4500,purchaseCostInCents:1700,stockNotes:'Preservar notas'};
const db={product:{findUnique:async()=>original},$transaction:async(fn)=>fn({product:{update:async(input)=>writes.push(input.data)},stockMovement:{create:async(input)=>movements.push(input.data)}})};
const {PATCH}=compile('src/app/api/admin/stock/product/[productId]/route.ts',{'@/lib/auth':{requireAdmin:async()=>{}},'@/lib/prisma':{prisma:db},'next/cache':{revalidatePath:()=>{}},'@/lib/stock-utils':{parseEuroPriceToCentsForStock:(s)=>Math.round(Number(s.replace(',','.'))*100)}});
const patch=(data)=>PATCH(new Request('http://localhost/api/test',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)}),{params:Promise.resolve({productId:'p'})});
(async()=>{
  const noop=await patch({stock:12,lowStockAlert:3,active:true}); assert.equal((await noop.json()).unchanged,true);assert.equal(writes.length,0);assert.equal(movements.length,0);
  await patch({stock:11,lowStockAlert:3,active:true});assert.deepEqual(JSON.parse(JSON.stringify(writes[0])),{stock:11,lowStockAlert:3,active:true});assert.equal(movements.length,1);assert.equal(movements[0].previousStock,12);assert.equal(movements[0].resultingStock,11);
  writes=[];movements=[];await patch({stock:12,lowStockAlert:3,stockNotes:'Novas notas'});assert.deepEqual(JSON.parse(JSON.stringify(writes[0])),{stock:12,lowStockAlert:3,stockNotes:'Novas notas'});assert.equal(movements.length,0);
  writes=[];const invalid=await patch({stock:-1,lowStockAlert:3});assert.equal(invalid.status,400);assert.equal(writes.length,0);
  console.log('PASS: inventory filters, threshold, reservation, search, no-op save, partial stock/notes updates and validation. No database used.');
})().catch(error=>{console.error(error);process.exitCode=1;});

import test from 'node:test';
import assert from 'node:assert/strict';
import { workbook } from '../src/utils/excel';
import { percent } from '../src/utils/progress';
test('Excel exports genuine OOXML preserving phone numbers and neutralizing formula input',()=>{
 const bytes=workbook([['الطالب','ولي الأمر'],['=HYPERLINK("bad")','01000000001']]);const v=new DataView(bytes.buffer);assert.equal(v.getUint32(0,true),0x04034b50);let offset=0;const files:Record<string,string>={};const decoder=new TextDecoder();while(v.getUint32(offset,true)===0x04034b50){const size=v.getUint32(offset+18,true),n=v.getUint16(offset+26,true);const name=decoder.decode(bytes.slice(offset+30,offset+30+n));files[name]=decoder.decode(bytes.slice(offset+30+n,offset+30+n+size));offset+=30+n+size;}assert.equal(Object.keys(files).length,5);const xml=files['xl/worksheets/sheet1.xml'];assert.match(xml,/01000000001/);assert.match(xml,/t="inlineStr"/);assert.ok(!xml.includes('<f>'));assert.match(xml,/rightToLeft="1"/);
});
test('watch percentage uses unique watched seconds rather than seek position',()=>{assert.equal(percent({lecture_id:'x',position:99,duration:100,watched_seconds:[0,1,1,2]}),3);assert.equal(percent({lecture_id:'x',position:0,duration:2,watched_seconds:[0,1]}),100);});

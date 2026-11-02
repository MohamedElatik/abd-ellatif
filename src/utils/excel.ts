// Minimal OOXML workbook, using inline strings so phone numbers keep leading zeroes
// and user-entered values cannot become spreadsheet formulas.
const enc = new TextEncoder();
const xml = (s: unknown) => String(s ?? '').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]!));
function crc(data: Uint8Array) { let n=0xffffffff; for(const b of data){n^=b;for(let i=0;i<8;i++)n=(n>>>1)^((n&1)?0xedb88320:0);}return (n^0xffffffff)>>>0; }
function zip(files: Record<string,string>): Uint8Array {
 const parts:Uint8Array[]=[], central:Uint8Array[]=[];let offset=0;
 for(const [name,value] of Object.entries(files)){
  const n=enc.encode(name),d=enc.encode(value),c=crc(d),h=new Uint8Array(30+n.length),v=new DataView(h.buffer);
  v.setUint32(0,0x04034b50,true);v.setUint16(4,20,true);v.setUint32(14,c,true);v.setUint32(18,d.length,true);v.setUint32(22,d.length,true);v.setUint16(26,n.length,true);h.set(n,30);
  const z=new Uint8Array(46+n.length),w=new DataView(z.buffer);w.setUint32(0,0x02014b50,true);w.setUint16(4,20,true);w.setUint16(6,20,true);w.setUint32(16,c,true);w.setUint32(20,d.length,true);w.setUint32(24,d.length,true);w.setUint16(28,n.length,true);w.setUint32(42,offset,true);z.set(n,46);central.push(z);parts.push(h,d);offset+=h.length+d.length;
 }
 const end=new Uint8Array(22),v=new DataView(end.buffer),size=central.reduce((a,b)=>a+b.length,0);v.setUint32(0,0x06054b50,true);v.setUint16(8,central.length,true);v.setUint16(10,central.length,true);v.setUint32(12,size,true);v.setUint32(16,offset,true);
 const out=new Uint8Array(offset+size+22);let p=0;for(const b of [...parts,...central,end]){out.set(b,p);p+=b.length;}return out;
}
export function workbook(rows: unknown[][]) {
 const ns='http://schemas.openxmlformats.org/spreadsheetml/2006/main';
 const data=rows.map((row,i)=>`<row r="${i+1}">${row.map((c,j)=>`<c r="${String.fromCharCode(65+j)}${i+1}" t="inlineStr"><is><t xml:space="preserve">${xml(c)}</t></is></c>`).join('')}</row>`).join('');
 return zip({
 '[Content_Types].xml':'<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>',
 '_rels/.rels':'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>',
 'xl/workbook.xml':`<workbook xmlns="${ns}" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="السجل" sheetId="1" r:id="rId1"/></sheets></workbook>`,
 'xl/_rels/workbook.xml.rels':'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>',
 'xl/worksheets/sheet1.xml':`<worksheet xmlns="${ns}"><sheetViews><sheetView workbookViewId="0" rightToLeft="1"/></sheetViews><cols><col min="1" max="10" width="25" customWidth="1"/></cols><sheetData>${data}</sheetData></worksheet>`
 });
}
export function downloadExcel(filename:string, rows:unknown[][]){const bytes=workbook(rows);const url=URL.createObjectURL(new Blob([bytes.buffer as ArrayBuffer],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}));const a=document.createElement('a');a.href=url;a.download=filename.replace(/[\\/:*?"<>|]/g,'-')+'.xlsx';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}

import { ensureSession } from './auth';
import { supabaseUrl, supabasePublishableKey } from '../../shared/supabase.mjs';
export async function uploadQuestionImage(file:File){
 if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>15*1024*1024)throw Error('اختر صورة JPG أو PNG أو WebP بحجم لا يتجاوز 15 ميجابايت.');
 const token=(await ensureSession())?.access_token;if(!token)throw Error('سجّل الدخول أولًا.');
 const bitmap=await createImageBitmap(file);const scale=Math.min(1,2000/Math.max(bitmap.width,bitmap.height));const canvas=document.createElement('canvas');canvas.width=Math.round(bitmap.width*scale);canvas.height=Math.round(bitmap.height*scale);const ctx=canvas.getContext('2d')!;ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(bitmap,0,0,canvas.width,canvas.height);bitmap.close();
 const blob=await new Promise<Blob>((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(Error('تعذر تجهيز الصورة.')),'image/jpeg',0.85));if(blob.size>3*1024*1024)throw Error('الصورة كبيرة جدًا. قلل حجمها ثم ارفعها مجددًا.');
 const path=`questions/${crypto.randomUUID()}.jpg`;
 const r=await fetch(`${supabaseUrl}/storage/v1/object/quiz-images/${path}`,{method:'POST',headers:{apikey:supabasePublishableKey,Authorization:`Bearer ${token}`,'Content-Type':'image/jpeg'},body:blob,signal:AbortSignal.timeout(60000)});
 if(!r.ok)throw Error('تعذر رفع صورة السؤال. تحقق من تسجيل دخول المعلم ثم حاول مجددًا.');return path;
}
export async function readQuestionImage(path:string,signal:AbortSignal){
 if(!/^questions\/[a-zA-Z0-9-]+\.jpg$/.test(path))throw Error('صورة غير صالحة.');const token=(await ensureSession())?.access_token;if(!token)throw Error('سجّل الدخول لعرض الصورة.');
 const r=await fetch(`${supabaseUrl}/storage/v1/object/authenticated/quiz-images/${path}`,{headers:{apikey:supabasePublishableKey,Authorization:`Bearer ${token}`},signal});if(!r.ok)throw Error('تعذر تحميل صورة السؤال.');return r.blob();
}


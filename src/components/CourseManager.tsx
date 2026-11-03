import { useState } from 'react';
import type { Course, Lecture } from '../types';
import { useCatalog } from '../utils/catalog';
import { databaseRequest } from '../utils/quizzes';
import { uploadCourseImage } from '../utils/admin';
import { ImagePlus } from 'lucide-react';
const blank=():Course=>({id:'course_'+crypto.randomUUID(),title:'',subtitle:'',description:'',grade:'sec3',gradeTitle:'الصف الثالث الثانوي',thumbnail:'',totalLectures:0,totalHours:0,price:0,isFree:true,units:[]});
export function CourseManager(){
 const {courses,lectures,error}=useCatalog();const [course,setCourse]=useState<Course>(blank),[selected,setSelected]=useState(''),[title,setTitle]=useState(''),[videoId,setVideoId]=useState(''),[editing,setEditing]=useState<Lecture|null>(null),[message,setMessage]=useState(''),[busy,setBusy]=useState(false),[uploading,setUploading]=useState(false);
 const field='block w-full p-3 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 mt-1';
 const changed=()=>window.dispatchEvent(new Event('catalog_changed'));
 return <section className="space-y-6" dir="rtl"><h2 className="text-2xl font-bold">الكورسات والفيديوهات — الصف الثالث الثانوي</h2>{(error||message)&&<p role="status">{error||message}</p>}
 <div className="grid md:grid-cols-2 gap-6"><form className="space-y-3 rounded-2xl p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800" onSubmit={async e=>{e.preventDefault();if(busy)return;setBusy(true);setMessage('');try{await databaseRequest('rpc/save_platform_course','POST',{course:{...course,price:0,isFree:true}});changed();setSelected(course.id);setMessage('تم حفظ الكورس ونشره للطلاب.');setCourse(blank());}catch(e){setMessage((e as Error).message);}finally{setBusy(false);}}}>
 <h3 className="font-bold">{courses.some(c=>c.id===course.id)?'تعديل الكورس':'إضافة كورس'}</h3>
 <label>اسم الكورس<input required className={field} value={course.title} onChange={e=>setCourse({...course,title:e.target.value})}/></label>
 <label>وصف الكورس<textarea className={field} value={course.description} onChange={e=>setCourse({...course,description:e.target.value,subtitle:e.target.value})}/></label>
 <div className="space-y-2"><span className="block">صورة الكورس</span>
  <div className="relative aspect-video rounded-xl overflow-hidden border border-dashed border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 grid place-items-center">
   {course.thumbnail?<img src={course.thumbnail} alt="صورة الكورس" className="w-full h-full object-cover"/>:<span className="text-sm text-slate-500 flex items-center gap-2"><ImagePlus className="w-5 h-5"/>مفيش صورة لسه</span>}
   {uploading&&<span className="absolute inset-0 grid place-items-center bg-slate-950/60 text-white font-bold">جارٍ رفع الصورة…</span>}
  </div>
  <div className="flex flex-wrap gap-2 items-center">
   <label className="cursor-pointer rounded-xl bg-emerald-600 text-white font-bold px-4 py-2 inline-flex items-center gap-2 focus-within:ring-2 focus-within:ring-amber-400"><ImagePlus className="w-4 h-4"/>{course.thumbnail?'تغيير الصورة':'رفع صورة'}
    <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" disabled={uploading||busy} onChange={async e=>{const f=e.target.files?.[0];e.target.value='';if(!f)return;setUploading(true);setMessage('');try{const url=await uploadCourseImage(course.id,f);const updated={...course,thumbnail:url};setCourse(updated);if(courses.some(c=>c.id===course.id)){await databaseRequest('rpc/save_platform_course','POST',{course:{...updated,price:0,isFree:true}});changed();setMessage('تم حفظ الصورة وتحديثها في الكورس وقائمة الفيديوهات.');}else setMessage('اترفعت الصورة. احفظ الكورس الجديد لنشره.');}catch(err){setMessage((err as Error).message);}finally{setUploading(false);}}}/></label>
   {course.thumbnail&&<button type="button" className="sx-mini-btn" onClick={()=>setCourse(c=>({...c,thumbnail:''}))}>إزالة الصورة</button>}
  </div>
  <p className="text-xs text-slate-500">بتتقص تلقائيًا بمقاس 16:9. الأفضل صورة عرضية.</p>
 </div>
 <p>الكورسات مجانية، ومشاهدة الفيديوهات تتطلب تسجيل الدخول.</p>
 <button disabled={busy||uploading} className="bg-emerald-600 text-white font-bold rounded-xl p-3 disabled:opacity-50">حفظ ونشر الكورس</button><button type="button" className="p-3" onClick={()=>setCourse(blank())}>كورس جديد</button>
 </form>
 <form className="space-y-3 rounded-2xl p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800" onSubmit={async e=>{e.preventDefault();if(busy)return;setBusy(true);setMessage('');try{const lecture:Lecture={...(editing||{}),id:editing?.id||'lec_'+crypto.randomUUID(),courseId:selected,unitId:'general',unitTitle:courses.find(c=>c.id===selected)?.title||'',title,description:'',grade:'sec3',videoDuration:'',videoDurationMinutes:0,videoUrl:'',playbackProvider:'vdocipher',thumbnail:'',isFreePreview:true,order:editing?.order||lectures.filter(l=>l.courseId===selected).length+1};await databaseRequest('rpc/save_platform_lecture','POST',{lecture,vdocipher_id:videoId.trim()});changed();setTitle('');setVideoId('');setEditing(null);setMessage('تم حفظ الفيديو داخل الكورس.');}catch(e){setMessage((e as Error).message);}finally{setBusy(false);}}}>
 <h3 className="font-bold">{editing?'تعديل الفيديو':'إضافة فيديو إلى كورس'}</h3><label>الكورس<select required className={field} value={selected} onChange={e=>setSelected(e.target.value)}><option value="">اختر الكورس</option>{courses.map(c=><option key={c.id} value={c.id}>{c.title}</option>)}</select></label>
 <label>عنوان الفيديو<input required className={field} value={title} onChange={e=>setTitle(e.target.value)}/></label>
 <label>معرّف الفيديو من VdoCipher<input required={!editing} placeholder={editing?'اتركه فارغًا للاحتفاظ بالفيديو الحالي':'Video ID'} pattern="[a-zA-Z0-9]{20,64}" className={field} dir="ltr" value={videoId} onChange={e=>setVideoId(e.target.value)}/></label><p className="text-sm">ارفع الفيديو في حساب VdoCipher، ثم انسخ Video ID هنا. أي فيديو تنشره متاح للحسابات المسجّلة دون اشتراك.</p>
 <button disabled={busy||!courses.length} className="bg-emerald-600 text-white font-bold p-3 rounded-xl disabled:opacity-50">حفظ ونشر الفيديو</button></form></div>
 {courses.map(c=><article key={c.id} className="rounded-2xl p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex gap-4 items-start">{c.thumbnail?<img src={c.thumbnail} alt="" className="w-40 aspect-video object-cover rounded-xl flex-none"/>:<span className="w-40 aspect-video rounded-xl bg-slate-100 dark:bg-slate-800 grid place-items-center text-xs text-slate-500 flex-none">بدون صورة</span>}<div className="min-w-0"><h3 className="font-bold">{c.title} — {c.isFree?'مجاني':`${c.price} ج.م`}</h3><button className="text-emerald-600 dark:text-emerald-400 font-bold py-2" onClick={()=>{setCourse(c);window.scrollTo({top:0,behavior:'smooth'});}}>تعديل الكورس والصورة</button><button type="button" className="sx-btn" onClick={()=>{setSelected(c.id);setEditing(null);setTitle('');setVideoId('');}}>إضافة درس آخر</button><ul>{lectures.filter(l=>l.courseId===c.id).map(l=><li key={l.id}>{l.title} <button type="button" className="sx-mini-btn" onClick={()=>{setEditing(l);setSelected(c.id);setTitle(l.title);setVideoId('');}}>تعديل الفيديو</button></li>)}</ul></div></article>)}
 </section>;
}


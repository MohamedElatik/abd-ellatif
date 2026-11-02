import { useState } from 'react';
import type { Course, Lecture } from '../types';
import { useCatalog } from '../utils/catalog';
import { databaseRequest } from '../utils/quizzes';
const blank=():Course=>({id:'course_'+crypto.randomUUID(),title:'',subtitle:'',description:'',grade:'sec3',gradeTitle:'الصف الثالث الثانوي',thumbnail:'',totalLectures:0,totalHours:0,price:0,isFree:true,units:[]});
export function CourseManager(){
 const {courses,lectures,error}=useCatalog();const [course,setCourse]=useState<Course>(blank),[selected,setSelected]=useState(''),[title,setTitle]=useState(''),[videoId,setVideoId]=useState(''),[message,setMessage]=useState(''),[busy,setBusy]=useState(false);
 const field='block w-full p-3 rounded-lg bg-slate-800 text-white border border-slate-600';
 const changed=()=>window.dispatchEvent(new Event('catalog_changed'));
 return <section className="space-y-6" dir="rtl"><h2 className="text-2xl font-bold">الكورسات والفيديوهات — الصف الثالث الثانوي</h2>{(error||message)&&<p role="status">{error||message}</p>}
 <div className="grid md:grid-cols-2 gap-6"><form className="space-y-3 border rounded-xl p-4" onSubmit={async e=>{e.preventDefault();if(busy)return;setBusy(true);setMessage('');try{await databaseRequest('rpc/save_platform_course','POST',{course});changed();setSelected(course.id);setMessage('تم حفظ الكورس ونشره للطلاب.');setCourse(blank());}catch(e){setMessage((e as Error).message);}finally{setBusy(false);}}}>
 <h3 className="font-bold">{courses.some(c=>c.id===course.id)?'تعديل الكورس':'إضافة كورس'}</h3>
 <label>اسم الكورس<input required className={field} value={course.title} onChange={e=>setCourse({...course,title:e.target.value})}/></label>
 <label>وصف الكورس<textarea className={field} value={course.description} onChange={e=>setCourse({...course,description:e.target.value,subtitle:e.target.value})}/></label>
 <label className="flex gap-2"><input type="checkbox" checked={course.isFree} onChange={e=>setCourse({...course,isFree:e.target.checked,price:e.target.checked?0:course.price})}/>كورس مجاني</label>
 {!course.isFree&&<label>السعر بالجنيه المصري<input required type="number" min="0.01" step="0.01" max="99999999" className={field} value={course.price} onChange={e=>setCourse({...course,price:Number(e.target.value)})}/></label>}
 <button disabled={busy} className="bg-emerald-600 rounded-lg p-3 disabled:opacity-50">حفظ ونشر الكورس</button><button type="button" className="p-3" onClick={()=>setCourse(blank())}>كورس جديد</button>
 </form>
 <form className="space-y-3 border rounded-xl p-4" onSubmit={async e=>{e.preventDefault();if(busy)return;setBusy(true);setMessage('');try{const lecture:Lecture={id:'lec_'+crypto.randomUUID(),courseId:selected,unitId:'general',unitTitle:courses.find(c=>c.id===selected)?.title||'',title,description:'',grade:'sec3',videoDuration:'',videoDurationMinutes:0,videoUrl:'',playbackProvider:'vdocipher',thumbnail:'',isFreePreview:false,order:lectures.filter(l=>l.courseId===selected).length+1};await databaseRequest('rpc/save_platform_lecture','POST',{lecture,vdocipher_id:videoId.trim()});changed();setTitle('');setVideoId('');setMessage('تم نشر الفيديو داخل الكورس.');}catch(e){setMessage((e as Error).message);}finally{setBusy(false);}}}>
 <h3 className="font-bold">إضافة فيديو إلى كورس</h3><label>الكورس<select required className={field} value={selected} onChange={e=>setSelected(e.target.value)}><option value="">اختر الكورس</option>{courses.map(c=><option key={c.id} value={c.id}>{c.title}</option>)}</select></label>
 <label>عنوان الفيديو<input required className={field} value={title} onChange={e=>setTitle(e.target.value)}/></label>
 <label>معرّف الفيديو من VdoCipher<input required pattern="[a-zA-Z0-9]{20,64}" className={field} dir="ltr" value={videoId} onChange={e=>setVideoId(e.target.value)}/></label><p className="text-sm">ارفع الفيديو في حساب VdoCipher، ثم انسخ Video ID هنا. الفيديو المجاني متاح للطلاب المسجلين، والمدفوع للمشتركين فقط.</p>
 <button disabled={busy||!courses.length} className="bg-emerald-600 p-3 rounded-lg disabled:opacity-50">حفظ ونشر الفيديو</button></form></div>
 {courses.map(c=><article key={c.id} className="border rounded-xl p-4"><h3 className="font-bold">{c.title} — {c.isFree?'مجاني':`${c.price} ج.م`}</h3><button className="text-emerald-400 py-2" onClick={()=>setCourse(c)}>تعديل الاسم والسعر</button><ul>{lectures.filter(l=>l.courseId===c.id).map(l=><li key={l.id}>{l.title}</li>)}</ul></article>)}
 </section>;
}

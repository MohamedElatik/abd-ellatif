import { useEffect, useState } from 'react';
import { readQuestionImage } from '../utils/questionImages';
export function QuestionImage({path}:{path?:string}){const [url,setUrl]=useState(''),[error,setError]=useState(''),[retry,setRetry]=useState(0);
 useEffect(()=>{setUrl('');setError('');if(!path)return;const controller=new AbortController();let object='';readQuestionImage(path,controller.signal).then(blob=>{if(controller.signal.aborted)return;object=URL.createObjectURL(blob);setUrl(object);}).catch(e=>{if(!controller.signal.aborted)setError(e.message);});return()=>{controller.abort();if(object)URL.revokeObjectURL(object);};},[path,retry]);
 if(!path)return null;return <div className="my-3">{url?<a href={url} target="_blank" rel="noreferrer" title="فتح الصورة بالحجم الكامل"><img src={url} alt="الرسم أو الصورة المرفقة بالسؤال" className="max-h-[600px] max-w-full mx-auto object-contain rounded-xl bg-white"/></a>:error?<p role="alert">{error} <button type="button" onClick={()=>setRetry(n=>n+1)}>إعادة التحميل</button></p>:<p>جارٍ تحميل صورة السؤال…</p>}</div>;
}


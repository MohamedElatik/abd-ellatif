import { useEffect, useState } from 'react';
import type { Course, Lecture } from '../types';
import { supabaseUrl, supabasePublishableKey } from '../../shared/supabase.mjs';
export function useCatalog() {
  const [courses,setCourses]=useState<Course[]>([]),[lectures,setLectures]=useState<Lecture[]>([]),[error,setError]=useState('');
  useEffect(()=>{let alive=true;
    async function load(){try {
      const fetchRows=async(table:string)=>{const r=await fetch(`${supabaseUrl}/rest/v1/${table}?select=document`,{headers:{apikey:supabasePublishableKey},cache:'no-store',signal:AbortSignal.timeout(15000)});if(!r.ok)throw new Error();return r.json();};
      const [c,l]=await Promise.all([fetchRows('platform_courses'),fetchRows('platform_lectures')]);
      if(alive){setCourses(c.map((r:{document:Course})=>r.document));setLectures(l.map((r:{document:Lecture})=>r.document).sort((a:Lecture,b:Lecture)=>a.order-b.order));setError('');}
    }catch{if(alive)setError('تعذر تحميل الكورسات. أعد المحاولة.');}}
    void load();const timer=setInterval(load,30000);window.addEventListener('catalog_changed',load);window.addEventListener('focus',load);
    return()=>{alive=false;clearInterval(timer);window.removeEventListener('catalog_changed',load);window.removeEventListener('focus',load);};
  },[]);return {courses,lectures,error};
}

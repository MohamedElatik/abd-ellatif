import { useEffect, useState } from 'react';
import { databaseRequest } from './quizzes';

/** Fired after a student saves a new photo so every avatar on the page updates at once. */
export const AVATAR_CHANGED = 'biomaster_avatar_changed';
const cache = new Map<string, string>();

/** The signed-in user's profile photo (a data: URL) from platform_profiles, or '' when none. */
export function useAvatar(userId: string) {
  const [avatar, setAvatar] = useState(() => cache.get(userId) || '');
  const [error, setError] = useState('');
  useEffect(() => {
    setAvatar(cache.get(userId) || '');
    setError('');
    if (userId === 'guest') return;
    let alive = true;
    if (!cache.has(userId)) {
      databaseRequest(`platform_profiles?user_id=eq.${encodeURIComponent(userId)}&select=avatar`)
        .then(rows => { const a = rows?.[0]?.avatar || ''; cache.set(userId, a); if (alive) setAvatar(a); })
        .catch(e => { if (alive) setError(e instanceof Error ? e.message : 'تعذر تحميل الصورة.'); });
    }
    const onChange = (e: Event) => {
      const d = (e as CustomEvent<{ userId: string; avatar: string }>).detail;
      if (d?.userId === userId) { cache.set(userId, d.avatar); setAvatar(d.avatar); }
    };
    window.addEventListener(AVATAR_CHANGED, onChange);
    return () => { alive = false; window.removeEventListener(AVATAR_CHANGED, onChange); };
  }, [userId]);
  return { avatar, error };
}

/** Crops the photo to a 256px square, saves it, and tells the rest of the page. */
export async function saveAvatar(userId: string, file: File): Promise<string> {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024) {
    throw new Error('اختر صورة PNG أو JPG أو WebP بحجم لا يتجاوز 5 ميجابايت.');
  }
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement('canvas');
  canvas.width = 256; canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  const side = Math.min(bitmap.width, bitmap.height);
  ctx.drawImage(bitmap, (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, 0, 0, 256, 256);
  bitmap.close();
  const image = canvas.toDataURL('image/jpeg', 0.85);
  await databaseRequest('platform_profiles?on_conflict=user_id', 'POST', { user_id: userId, avatar: image }, 'resolution=merge-duplicates,return=minimal');
  cache.set(userId, image);
  window.dispatchEvent(new CustomEvent(AVATAR_CHANGED, { detail: { userId, avatar: image } }));
  return image;
}

/** First letter of the name, for when there is no photo yet. */
export const initialOf = (name: string) => (name.trim()[0] || '؟');

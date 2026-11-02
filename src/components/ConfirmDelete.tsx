import { useState } from 'react';
import { Trash2 } from 'lucide-react';

/** Delete button that asks "are you sure?" in place before running. */
export function ConfirmDelete({ label, question, onConfirm, disabled }: { label: string; question: string; onConfirm: () => Promise<void>; disabled?: boolean }) {
  const [asking, setAsking] = useState(false);
  const [busy, setBusy] = useState(false);
  if (!asking) {
    return <button type="button" className="sx-danger" disabled={disabled} onClick={() => setAsking(true)}><Trash2 />{label}</button>;
  }
  return (
    <span className="sx-confirm" role="group" aria-label={question}>
      <span>{question}</span>
      <button type="button" className="sx-danger solid" disabled={busy} onClick={async () => {
        setBusy(true);
        try { await onConfirm(); } finally { setBusy(false); setAsking(false); }
      }}>{busy ? 'جارٍ الحذف…' : 'نعم، احذف'}</button>
      <button type="button" className="sx-mini-btn" disabled={busy} onClick={() => setAsking(false)}>إلغاء</button>
    </span>
  );
}

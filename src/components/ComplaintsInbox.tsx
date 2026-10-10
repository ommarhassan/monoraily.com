import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useLanguage } from '../i18n/LanguageContext';
import { allComplaints, updateComplaint, type Complaint, type ComplaintStatus } from '../lib/complaints';
import { formatDateTime, num } from '../lib/format';
import '../styles/complaints-inbox.css';
import '../styles/support.css';

const REFRESH_MS = 30_000;
const MAX_REPLY = 2000;

const STATUSES: { id: ComplaintStatus; ar: string; en: string }[] = [
  { id: 'new', ar: 'جديدة', en: 'New' },
  { id: 'in_progress', ar: 'قيد المعالجة', en: 'In progress' },
  { id: 'resolved', ar: 'تم الحل', en: 'Resolved' },
];

const CATEGORY_NAMES: Record<string, { ar: string; en: string }> = {
  complaint: { ar: 'شكوى', en: 'Complaint' },
  suggestion: { ar: 'اقتراح', en: 'Suggestion' },
  inquiry: { ar: 'استفسار', en: 'Inquiry' },
  payment: { ar: 'مشكلة دفع', en: 'Payment problem' },
  lost_item: { ar: 'مفقودات', en: 'Lost item' },
};

type Draft = { status: ComplaintStatus; reply: string };
type Filter = 'all' | ComplaintStatus;

/** Admin inbox: read every message, reply, and move it through new / in progress / resolved. */
export default function ComplaintsInbox() {
  const { user } = useAuth();
  const { lang, locale } = useLanguage();
  const isAr = lang === 'ar';
  const tx = (ar: string, en: string) => (isAr ? ar : en);

  const [items, setItems] = useState<Complaint[]>([]);
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [filter, setFilter] = useState<Filter>('all');
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const list = await allComplaints();
    setItems(list);
    // Keep what the admin is typing: only create drafts for messages that have none yet.
    setDrafts((prev) => {
      const next = { ...prev };
      for (const c of list) {
        if (!next[c.id]) next[c.id] = { status: c.status, reply: c.admin_reply ?? '' };
      }
      return next;
    });
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
    const timer = window.setInterval(() => void load(), REFRESH_MS);
    return () => window.clearInterval(timer);
  }, [load]);

  const count = (status: ComplaintStatus) => items.filter((c) => c.status === status).length;
  const visible = filter === 'all' ? items : items.filter((c) => c.status === filter);

  const setDraft = (id: string, patch: Partial<Draft>) =>
    setDrafts((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));

  const save = async (c: Complaint) => {
    const draft = drafts[c.id];
    if (!draft) return;
    setSavingId(c.id);
    setError(null);
    const result = await updateComplaint(c.id, {
      status: draft.status,
      admin_reply: draft.reply.trim() ? draft.reply.trim() : null,
    });
    setSavingId(null);
    if (!result.ok) {
      setError(
        result.error === 'not_allowed'
          ? tx('مينفعش تردّ على شكوى انت اللي كاتبها. لازم أدمن تاني يتعامل معاها.', 'You cannot handle a complaint you sent yourself. Another admin has to.')
          : tx('مقدرناش نحفظ التعديل. جرّب تاني.', 'Could not save the change. Please try again.'),
      );
      return;
    }
    setSavedId(c.id);
    window.setTimeout(() => setSavedId((current) => (current === c.id ? null : current)), 2500);
    await load();
  };

  return (
    <section className="ci-wrap">
      <div className="ci-head">
        <div>
          <span className="eyebrow green">{tx('الدعم', 'Support')}</span>
          <h2>
            {tx('صندوق الشكاوي', 'Complaints inbox')}
            {count('new') > 0 && <span className="ci-badge">{num(count('new'), locale)}</span>}
          </h2>
        </div>
        <div className="an-seg" role="group" aria-label={tx('تصفية', 'Filter')}>
          <button className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>
            {tx('الكل', 'All')} {num(items.length, locale)}
          </button>
          {STATUSES.map((s) => (
            <button key={s.id} className={filter === s.id ? 'active' : ''} onClick={() => setFilter(s.id)}>
              {s[lang]} {num(count(s.id), locale)}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <p className="sp-error" role="alert">
          {error}
        </p>
      )}

      {loading ? (
        <p>{tx('بنحمّل…', 'Loading…')}</p>
      ) : visible.length === 0 ? (
        <p className="ci-empty">{tx('مفيش رسايل هنا.', 'No messages here.')}</p>
      ) : (
        <ul className="ci-list">
          {visible.map((c) => {
            const draft = drafts[c.id] ?? { status: c.status, reply: c.admin_reply ?? '' };
            const own = c.user_id === user?.id;
            const changed = draft.status !== c.status || draft.reply.trim() !== (c.admin_reply ?? '');
            return (
              <li className={`ci-item ${c.status}`} key={c.id}>
                <div className="ci-top">
                  <span className={`sp-pill ${c.status}`}>{STATUSES.find((s) => s.id === c.status)?.[lang]}</span>
                  <strong className="ci-ref">{c.ref}</strong>
                  <span className="ci-cat">{CATEGORY_NAMES[c.category]?.[lang] ?? c.category}</span>
                  {own && <span className="ci-own-tag">{tx('شكواك', 'Your own')}</span>}
                  <span className="ci-date">{formatDateTime(c.created_at, locale)}</span>
                </div>

                <h4>{c.subject}</h4>

                <dl className="ci-meta">
                  <div>
                    <dt>{tx('الاسم', 'Name')}</dt>
                    <dd>{c.name}</dd>
                  </div>
                  <div>
                    <dt>{tx('الإيميل', 'Email')}</dt>
                    <dd dir="ltr">
                      <a href={`mailto:${c.email}?subject=${encodeURIComponent(`Re: ${c.ref}`)}`}>{c.email}</a>
                    </dd>
                  </div>
                  <div>
                    <dt>{tx('كود الحساب', 'Account ID')}</dt>
                    <dd dir="ltr">
                      <code>{c.user_id}</code>
                    </dd>
                  </div>
                  {c.ticket_id && (
                    <div>
                      <dt>{tx('كود التذكرة', 'Ticket code')}</dt>
                      <dd dir="ltr">
                        <code>{c.ticket_id}</code>
                      </dd>
                    </div>
                  )}
                </dl>

                <p className="sp-msg">{c.message}</p>

                {own ? (
                  <div className="ci-reply">
                    <p className="ci-own-note">
                      {tx(
                        'دي شكوى انت اللي كاتبها، فمينفعش تردّ عليها أو تغيّر حالتها. لازم أدمن تاني يتعامل معاها، وتتابعها من «رسايلي».',
                        'You sent this complaint, so you cannot reply to it or change its status. Another admin has to handle it. Follow it from “My messages”.',
                      )}
                    </p>
                    {c.admin_reply && <p className="sp-msg">{c.admin_reply}</p>}
                  </div>
                ) : (
                  <div className="ci-reply">
                    <label htmlFor={`reply-${c.id}`}>{tx('رد الإدارة (بيظهر للمستخدم)', 'Reply (the user will see it)')}</label>
                    <textarea
                      id={`reply-${c.id}`}
                      className="name-input sp-textarea"
                      value={draft.reply}
                      maxLength={MAX_REPLY}
                      onChange={(e) => setDraft(c.id, { reply: e.target.value })}
                      disabled={savingId === c.id}
                    />
                    <div className="ci-actions">
                      <select
                        className="name-input"
                        value={draft.status}
                        onChange={(e) => setDraft(c.id, { status: e.target.value as ComplaintStatus })}
                        disabled={savingId === c.id}
                        aria-label={tx('الحالة', 'Status')}
                      >
                        {STATUSES.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s[lang]}
                          </option>
                        ))}
                      </select>
                      <button className="dark-button" disabled={!changed || savingId === c.id} onClick={() => save(c)}>
                        {savingId === c.id ? tx('بنحفظ…', 'Saving…') : tx('حفظ', 'Save')}
                      </button>
                      {savedId === c.id && <span className="ci-saved">{tx('اتحفظ ✓', 'Saved ✓')}</span>}
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useLanguage } from '../i18n/LanguageContext';
import { myComplaints, submitComplaint, type Complaint, type ComplaintCategory } from '../lib/complaints';
import { formatDateTime, num } from '../lib/format';
import '../styles/support.css';

const MAX_MESSAGE = 2000;

const CATEGORIES: { id: ComplaintCategory; ar: string; en: string }[] = [
  { id: 'complaint', ar: 'شكوى', en: 'Complaint' },
  { id: 'payment', ar: 'مشكلة دفع', en: 'Payment problem' },
  { id: 'lost_item', ar: 'مفقودات', en: 'Lost item' },
  { id: 'inquiry', ar: 'استفسار', en: 'Inquiry' },
  { id: 'suggestion', ar: 'اقتراح', en: 'Suggestion' },
];

const STATUS_NAMES: Record<string, { ar: string; en: string }> = {
  new: { ar: 'جديدة', en: 'New' },
  in_progress: { ar: 'قيد المعالجة', en: 'In progress' },
  resolved: { ar: 'تم الحل', en: 'Resolved' },
};

export default function SupportPage() {
  const { user, profile } = useAuth();
  const { lang, locale } = useLanguage();
  const isAr = lang === 'ar';
  const tx = (ar: string, en: string) => (isAr ? ar : en);

  const [category, setCategory] = useState<ComplaintCategory>('complaint');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [ticketId, setTicketId] = useState('');
  const [name, setName] = useState(profile?.full_name ?? '');
  const [busy, setBusy] = useState(false);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [doneRef, setDoneRef] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [mine, setMine] = useState<Complaint[]>([]);
  const [loadingList, setLoadingList] = useState(true);

  useEffect(() => {
    if (profile?.full_name && !name) setName(profile.full_name);
  }, [profile?.full_name]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadMine = useCallback(async () => {
    setMine(await myComplaints());
    setLoadingList(false);
  }, []);

  useEffect(() => {
    void loadMine();
    const onFocus = () => void loadMine();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [loadMine, user?.id]);

  const errorText = (code: string) => {
    const map: Record<string, [string, string]> = {
      too_many: ['بعتّ رسايل كتير في آخر ساعة. جرّب بعد شوية.', 'You sent too many messages in the last hour. Please try again later.'],
      ticket_not_found: ['كود التذكرة ده مش موجود في حسابك. اتأكد منه أو سيب الخانة فاضية.', 'That ticket code is not in your account. Check it or leave it empty.'],
      subject_too_short: ['الموضوع قصير جدًا.', 'The subject is too short.'],
      message_too_short: ['الرسالة قصيرة جدًا، اكتب تفاصيل أكتر.', 'The message is too short. Please add more detail.'],
      'Not signed in': ['سجّل دخولك الأول عشان تبعت رسالة.', 'Please sign in first to send a message.'],
    };
    const pair = map[code] ?? ['حصلت مشكلة وإحنا بنبعت رسالتك. جرّب تاني.', 'Something went wrong while sending your message. Please try again.'];
    return tx(pair[0], pair[1]);
  };

  const canSend = subject.trim().length >= 3 && message.trim().length >= 10 && name.trim().length >= 2 && !busy;

  const send = async () => {
    setBusy(true);
    setErrorCode(null);
    setDoneRef(null);
    const result = await submitComplaint({
      category,
      subject: subject.trim(),
      message: message.trim(),
      name: name.trim(),
      ...(ticketId.trim() ? { ticket_id: ticketId.trim() } : {}),
    });
    setBusy(false);
    if (!result.ok) {
      setErrorCode(result.code);
      return;
    }
    setDoneRef(result.ref);
    setSubject('');
    setMessage('');
    setTicketId('');
    void loadMine();
  };

  const copyRef = async () => {
    if (!doneRef) return;
    try {
      await navigator.clipboard.writeText(doneRef);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard can be blocked: the number is on screen anyway */
    }
  };

  const catName = (id: string) => CATEGORIES.find((c) => c.id === id)?.[lang] ?? id;

  return (
    <div className="subpage">
      <div className="page-heading">
        <span className="eyebrow green">{tx('الدعم والشكاوي', 'Support & complaints')}</span>
        <h1>{tx('عندك مشكلة؟ قولّنا.', 'Have a problem? Tell us.')}</h1>
        <p>
          {tx(
            'ابعت شكوى أو اقتراح أو استفسار، وهيوصلك رقم متابعة تشوف بيه حالة رسالتك ورد الإدارة.',
            'Send a complaint, suggestion or question. You get a reference number to follow its status and our reply.',
          )}
        </p>
      </div>

      <div className="network-layout">
        <div className="network-card">
          {doneRef && (
            <div className="sp-done" role="status">
              <h3>{tx('وصلتنا رسالتك ✓', 'We received your message ✓')}</h3>
              <p>{tx('احتفظ برقم المتابعة ده:', 'Keep this reference number:')}</p>
              <div className="sp-ref">
                <code>{doneRef}</code>
                <button type="button" className="outline-button" onClick={copyRef}>
                  {copied ? tx('اتنسخ ✓', 'Copied ✓') : tx('انسخ', 'Copy')}
                </button>
              </div>
            </div>
          )}

          <div className="sp-field">
            <label className="name-label" htmlFor="sp-category">
              {tx('نوع الرسالة', 'Type')}
            </label>
            <select
              id="sp-category"
              className="name-input"
              value={category}
              onChange={(e) => setCategory(e.target.value as ComplaintCategory)}
              disabled={busy}
            >
              {CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c[lang]}
                </option>
              ))}
            </select>
          </div>

          <div className="sp-field">
            <label className="name-label" htmlFor="sp-name">
              {tx('الاسم', 'Name')}
            </label>
            <input
              id="sp-name"
              className="name-input"
              value={name}
              maxLength={80}
              onChange={(e) => setName(e.target.value)}
              disabled={busy}
              autoComplete="name"
            />
          </div>

          <div className="sp-field">
            <label className="name-label" htmlFor="sp-subject">
              {tx('الموضوع', 'Subject')}
            </label>
            <input
              id="sp-subject"
              className="name-input"
              value={subject}
              maxLength={120}
              onChange={(e) => setSubject(e.target.value)}
              disabled={busy}
              placeholder={tx('مثال: اتخصم مني مرتين', 'Example: I was charged twice')}
            />
          </div>

          <div className="sp-field">
            <label className="name-label" htmlFor="sp-ticket">
              {tx('كود التذكرة أو الاشتراك (اختياري)', 'Ticket or subscription code (optional)')}
            </label>
            <input
              id="sp-ticket"
              className="name-input"
              dir="ltr"
              value={ticketId}
              maxLength={60}
              onChange={(e) => setTicketId(e.target.value)}
              disabled={busy}
              placeholder="MN-XXXXXXXXXXXXXXXXXXXX"
            />
            <p className="sp-hint">
              {tx('هتلاقيه على كارت التذكرة في صفحة «تذاكري».', 'You can find it on the ticket card in “My tickets”.')}
            </p>
          </div>

          <div className="sp-field">
            <label className="name-label" htmlFor="sp-message">
              {tx('تفاصيل الرسالة', 'Message')}
            </label>
            <textarea
              id="sp-message"
              className="name-input sp-textarea"
              value={message}
              maxLength={MAX_MESSAGE}
              onChange={(e) => setMessage(e.target.value)}
              disabled={busy}
              placeholder={tx('اشرح اللي حصل بالتفصيل، والمحطة والوقت لو تعرف.', 'Explain what happened. Add the station and time if you can.')}
            />
            <div className="sp-counter">
              {num(message.length, locale)} / {num(MAX_MESSAGE, locale)}
            </div>
          </div>

          {errorCode && (
            <p className="sp-error" role="alert">
              {errorText(errorCode)}
            </p>
          )}

          <button className="dark-button full modal-action" disabled={!canSend} onClick={send}>
            {busy ? tx('بنبعت…', 'Sending…') : tx('ابعت الرسالة', 'Send message')}
          </button>
        </div>

        <aside className="network-card">
          <h3>{tx('رسايلي', 'My messages')}</h3>
          {loadingList ? (
            <p>{tx('بنحمّل…', 'Loading…')}</p>
          ) : mine.length === 0 ? (
            <p>{tx('لسه ماعتّتش أي رسالة.', 'You have not sent any message yet.')}</p>
          ) : (
            <ul className="sp-list">
              {mine.map((c) => (
                <li className="sp-item" key={c.id}>
                  <div className="sp-item-top">
                    <span className={`sp-pill ${c.status}`}>{STATUS_NAMES[c.status]?.[lang] ?? c.status}</span>
                    <span className="sp-ref-small">{c.ref}</span>
                  </div>
                  <h4>{c.subject}</h4>
                  <small>
                    {catName(c.category)} · {formatDateTime(c.created_at, locale)}
                  </small>
                  <details>
                    <summary>{tx('عرض التفاصيل', 'View details')}</summary>
                    <p className="sp-msg">{c.message}</p>
                  </details>
                  {c.admin_reply && (
                    <div className="sp-reply">
                      <b>{tx('رد الإدارة', 'Reply from administration')}</b>
                      <p className="sp-msg">{c.admin_reply}</p>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </aside>
      </div>
    </div>
  );
}

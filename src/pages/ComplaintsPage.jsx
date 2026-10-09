import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase"; // عدّل المسار لو مختلف
import "./complaints.css";

const CATEGORIES = [
  { value: "complaint", label: "شكوى" },
  { value: "suggestion", label: "اقتراح" },
  { value: "inquiry", label: "استفسار" },
  { value: "payment", label: "مشكلة دفع" },
  { value: "lost_item", label: "مفقودات" },
];

const STATUS = {
  new: "جديدة",
  in_progress: "قيد المعالجة",
  resolved: "تم الحل",
};

export default function ComplaintsPage() {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);
  const [category, setCategory] = useState("complaint");
  const [ticketCode, setTicketCode] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [sentRef, setSentRef] = useState("");
  const [mine, setMine] = useState([]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user ?? null);
      setChecking(false);
    });
  }, []);

  const loadMine = async () => {
    const { data } = await supabase
      .from("complaints")
      .select("id, ref_code, category, status, message, admin_reply, created_at")
      .order("created_at", { ascending: false });
    setMine(data ?? []);
  };

  useEffect(() => {
    if (user) loadMine();
  }, [user]);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setSentRef("");

    if (message.trim().length < 10) {
      setError("اكتب رسالة لا تقل عن 10 أحرف");
      return;
    }

    setSending(true);
    const { data, error: fnError } = await supabase.functions.invoke(
      "submit-complaint",
      {
        body: {
          category,
          ticket_code: ticketCode.trim(),
          message: message.trim(),
        },
      }
    );
    setSending(false);

    if (fnError) {
      let msg = "حصلت مشكلة، جرّب تاني";
      try {
        const body = await fnError.context.json();
        if (body?.error) msg = body.error;
      } catch {
        /* نسيب الرسالة العامة */
      }
      setError(msg);
      return;
    }

    setSentRef(data.ref_code);
    setMessage("");
    setTicketCode("");
    loadMine();
  };

  if (checking) return <div className="cmp-page" dir="rtl">جاري التحميل...</div>;

  if (!user) {
    return (
      <div className="cmp-page" dir="rtl">
        <h1>الشكاوي والدعم</h1>
        <p>لازم تسجّل دخول الأول عشان تبعت رسالة.</p>
        <a className="cmp-btn" href="/login">تسجيل الدخول</a>
      </div>
    );
  }

  return (
    <div className="cmp-page" dir="rtl">
      <h1>الشكاوي والدعم</h1>
      <p className="cmp-sub">
        عندك مشكلة أو اقتراح؟ ابعتلنا وهنرد عليك في أقرب وقت.
      </p>

      <form className="cmp-card" onSubmit={submit}>
        <label>
          نوع الرسالة
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </label>

        <label>
          كود التذكرة (اختياري)
          <input
            type="text"
            value={ticketCode}
            onChange={(e) => setTicketCode(e.target.value)}
            maxLength={100}
            placeholder="لو المشكلة متعلقة بتذكرة معينة"
            dir="ltr"
          />
        </label>

        <label>
          رسالتك
          <textarea
            rows={6}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            maxLength={2000}
            placeholder="اشرح المشكلة بالتفصيل..."
          />
          <span className="cmp-count">{message.length} / 2000</span>
        </label>

        {error && <div className="cmp-error">{error}</div>}

        {sentRef && (
          <div className="cmp-success">
            تم إرسال رسالتك. الرقم المرجعي: <b dir="ltr">{sentRef}</b>
            <br />
            احتفظ بيه لمتابعة الحالة.
          </div>
        )}

        <button className="cmp-btn" type="submit" disabled={sending}>
          {sending ? "جاري الإرسال..." : "إرسال"}
        </button>
      </form>

      {mine.length > 0 && (
        <section>
          <h2>رسائلي السابقة</h2>
          {mine.map((c) => (
            <div className="cmp-card cmp-item" key={c.id}>
              <div className="cmp-row">
                <b dir="ltr">{c.ref_code}</b>
                <span className={`cmp-status cmp-${c.status}`}>
                  {STATUS[c.status]}
                </span>
              </div>
              <div className="cmp-meta">
                {CATEGORIES.find((x) => x.value === c.category)?.label} ·{" "}
                {new Date(c.created_at).toLocaleDateString("ar-EG")}
              </div>
              <p>{c.message}</p>
              {c.admin_reply && (
                <div className="cmp-reply">
                  <b>رد الإدارة:</b>
                  <p>{c.admin_reply}</p>
                </div>
              )}
            </div>
          ))}
        </section>
      )}
    </div>
  );
}

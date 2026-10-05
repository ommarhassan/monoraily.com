import { brand } from '../config/brand';
import { nav, type Page } from '../navigation';
import Icon, { type IconName } from './Icon';

type Props = {
  page: Page;
  open: boolean;
  signedIn: boolean;
  isAdmin: boolean;
  onGo: (page: Page) => void;
};

export default function Sidebar({ page, open, signedIn, isAdmin, onGo }: Props) {
  const items: { id: Page; label: string; icon: IconName }[] = [
    ...nav,
    ...(signedIn
      ? [
          { id: 'dashboard' as const, label: 'لوحتي', icon: 'user' as const },
          { id: 'verification' as const, label: 'توثيق الفئة', icon: 'user' as const },
        ]
      : []),
    ...(isAdmin ? [{ id: 'admin' as const, label: 'لوحة الأدمن', icon: 'grid' as const }] : []),
  ];

  return (
    <aside className={`sidebar ${open ? 'sidebar-open' : ''}`}>
      <div className="brand">
        <div className="brand-mark">
          <Icon name="monorail" size={24} strokeWidth={2.1} />
        </div>
        <span>
          {brand.wordmark[0]}
          <strong>{brand.wordmark[1]}</strong>
          <i>.</i>
          <small>{brand.tagline}</small>
        </span>
      </div>

      <div className="sidebar-section-title">القائمة الرئيسية</div>
      <nav className="sidebar-nav" aria-label="القائمة الرئيسية">
        {items.map((item) => (
          <button
            key={item.id}
            className={`nav-item ${page === item.id ? 'active' : ''}`}
            onClick={() => onGo(item.id)}
          >
            <Icon name={item.icon} size={20} />
            <span>{item.label}</span>
            {page === item.id && <span className="nav-active-indicator" />}
          </button>
        ))}
      </nav>

      <div className="sidebar-bottom">
        <div className="side-help">
          <div className="side-help-icon">
            <Icon name="spark" size={21} />
          </div>
          <strong>كل مشوار له حكاية.</strong>
          <p>خطط رحلتك واستكشف المدينة من فوق الزحمة.</p>
          <button onClick={() => onGo('home')}>
            ابدأ رحلة جديدة <Icon name="arrow" size={15} />
          </button>
        </div>
        <div className="sidebar-footer">
          صُنع علشان المشوار يبقى أسهل <span>© {brand.name}</span>
        </div>
      </div>
    </aside>
  );
}

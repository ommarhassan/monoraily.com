import type { IconName } from './components/Icon';
import { translate } from './i18n';
import type { Key } from './i18n/ar';

export const nav = [
  { id: 'home', label: 'الرئيسية', labelKey: 'nav.home', icon: 'grid' },
  { id: 'map', label: 'الخريطة التفاعلية', labelKey: 'nav.map', icon: 'pin' },
  { id: 'stations', label: 'المحطات والخط', labelKey: 'nav.stations', icon: 'route' },
  { id: 'fares', label: 'التذاكر والأسعار', labelKey: 'nav.fares', icon: 'ticket' },
  { id: 'mytickets', label: 'تذاكري', labelKey: 'nav.mytickets', icon: 'ticket' },
  { id: 'gate', label: 'بوابة التحقق', labelKey: 'nav.gate', icon: 'monorail' },
] as const satisfies readonly { id: string; label: string; labelKey: Key; icon: IconName }[];

export type NavId = (typeof nav)[number]['id'];
export type Page = NavId | 'dashboard' | 'admin' | 'auth' | 'verification';

/** Pages that need a signed-in user. */
export const protectedPages: Page[] = ['mytickets', 'dashboard', 'admin', 'verification'];

/** Arabic titles, kept for code that still reads them directly. */
export const extraPageTitles: Partial<Record<Page, string>> = {
  dashboard: 'لوحتي',
  admin: 'لوحة الأدمن',
  auth: 'الحساب',
  verification: 'توثيق الفئة',
};

const extraPageTitleKeys: Partial<Record<Page, Key>> = {
  dashboard: 'page.dashboard',
  admin: 'page.admin',
  auth: 'page.auth',
  verification: 'page.verification',
};

/** Title in the current language. In sidebars/menus use `t(item.labelKey)` directly. */
export const pageTitle = (page: Page) => {
  const key = nav.find((item) => item.id === page)?.labelKey ?? extraPageTitleKeys[page];
  return key ? translate(key) : '';
};

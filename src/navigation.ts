import type { IconName } from './components/Icon';

export const nav = [
  { id: 'home', label: 'الرئيسية', icon: 'grid' },
  { id: 'map', label: 'الخريطة التفاعلية', icon: 'pin' },
  { id: 'stations', label: 'المحطات والخط', icon: 'route' },
  { id: 'fares', label: 'التذاكر والأسعار', icon: 'ticket' },
  { id: 'mytickets', label: 'تذاكري', icon: 'ticket' },
  { id: 'gate', label: 'بوابة التحقق', icon: 'monorail' },
] as const satisfies readonly { id: string; label: string; icon: IconName }[];

export type NavId = (typeof nav)[number]['id'];
export type Page = NavId | 'dashboard' | 'admin' | 'auth' | 'verification';

/** Pages that need a signed-in user. */
export const protectedPages: Page[] = ['mytickets', 'dashboard', 'admin', 'verification'];

export const extraPageTitles: Partial<Record<Page, string>> = {
  dashboard: 'لوحتي',
  admin: 'لوحة الأدمن',
  auth: 'الحساب',
  verification: 'توثيق الفئة',
};

export const pageTitle = (page: Page) => nav.find((item) => item.id === page)?.label ?? extraPageTitles[page] ?? '';

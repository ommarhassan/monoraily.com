export type Lang = 'ar' | 'en';

const ar = {
  clockLabel: 'توقيت القاهرة',
  myAccount: 'حسابي',
  dashboard: 'لوحتي',
  verification: 'توثيق الفئة',
  admin: 'لوحة الأدمن',
  signOut: 'خروج',
  login: 'تسجيل الدخول',
  register: 'حساب جديد',
  tagline: 'رحلتك فوق الزحمة',
  mainMenu: 'القائمة الرئيسية',
  menu: 'القائمة',
  switchLangShort: 'English',
  switchLangLabel: 'التبديل إلى الإنجليزية',
} as const;

export type TextKey = keyof typeof ar;

const en: Record<TextKey, string> = {
  clockLabel: 'Cairo time',
  myAccount: 'My account',
  dashboard: 'My dashboard',
  verification: 'Category verification',
  admin: 'Admin panel',
  signOut: 'Sign out',
  login: 'Log in',
  register: 'Sign up',
  tagline: 'Ride above the traffic',
  mainMenu: 'Main menu',
  menu: 'Menu',
  switchLangShort: 'عربي',
  switchLangLabel: 'Switch to Arabic',
};

export const dictionary: Record<Lang, Record<TextKey, string>> = { ar, en };

/** English names for the main navigation, keyed by page id. Arabic comes from navigation.ts. */
export const navLabelsEn: Record<string, string> = {
  home: 'Home',
  map: 'Interactive map',
  stations: 'Stations & line',
  fares: 'Tickets & fares',
  mytickets: 'My tickets',
  gate: 'Verification gate',
};

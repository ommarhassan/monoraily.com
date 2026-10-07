export type Lang = 'ar' | 'en';

const ar = {
  // Header
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

  // Common
  loading: 'بنحمّل…',
  save: 'حفظ',
  saved: 'اتحفظ ✓',
  currencyEgp: 'جنيه',
  currencyShort: 'ج',

  // Dashboard
  dashEyebrow: 'لوحة التحكم',
  dashWelcome: 'أهلًا {name} 👋',
  dashWelcomeAnon: 'أهلًا بيك 👋',
  adminSuffix: ' · أدمن',
  statTickets: 'عدد التذاكر',
  statSpent: 'إجمالي المصروف',
  statStops: 'محطات اتقطعت',
  statFavourite: 'محطتك المفضلة',
  recentTrips: 'آخر رحلاتك',
  newTrip: 'رحلة جديدة',
  noTickets: 'لسه ماحجزتش أي تذكرة.',
  myDetails: 'بياناتي',
  nameLabel: 'الاسم',
  signOutLong: 'تسجيل الخروج',

  // Verification page
  accountEyebrow: 'الحساب',
  verifIntro: 'نصف التذكرة متاح لكبار السن (فوق ٦٠ سنة) وذوي الإعاقة، بعد مراجعة المستند.',
  verifiedTitle: 'حسابك موثّق ✓',
  categoryLine: 'الفئة: {category}',
  validUntil: 'التوثيق ساري لحد {date}.',
  pendingBody: 'طلبك وصل وبيتراجع. هتقدر تحجز نصف تذكرة أول ما تتم الموافقة.',
  expiredNotice: 'التوثيق القديم انتهى. ابعت مستند جديد عشان تجدّده.',
  rejectedNotice: 'طلبك السابق اترفض. تقدر تبعت مستند أوضح.',
  submitTitle: 'ابعت طلب توثيق',
  categoryField: 'الفئة',
  fileField: 'صورة الهوية أو الكارنيه (JPG أو PNG أو WEBP أو PDF، لحد 5 ميجا)',
  privacyNote: 'المستند بيتخزن في مكان خاص، والمراجع (الأدمن) بس هو اللي يقدر يشوفه، ومابنستخدمه لأي حاجة غير التوثيق.',
  uploading: 'بنرفع…',
  sendRequest: 'ابعت الطلب',
  chooseIdFirst: 'اختار صورة الهوية الأول.',
  requestSent: 'اتبعت طلبك، وهيتراجع قريب.',
  genericError: 'حصلت مشكلة، جرّب تاني.',
  catSenior: 'كبار السن (فوق ٦٠ سنة)',
  catDisabled: 'ذوي الإعاقة',
  statusPending: 'قيد المراجعة',
  statusApproved: 'تمت الموافقة',
  statusRejected: 'مرفوض',

  // Verification errors
  errSignInFirst: 'سجّل دخول الأول',
  errFileType: 'الملف لازم يكون صورة (JPG أو PNG أو WEBP) أو PDF',
  errFileSize: 'الملف أكبر من 5 ميجا',
  errPendingExists: 'عندك طلب قيد المراجعة بالفعل',
  errUpload: 'مقدرناش نرفع الملف، جرّب تاني',
  errRequest: 'مقدرناش نسجّل الطلب، جرّب تاني',
  errServer: 'السيرفر مش متصل',
  errOperation: 'العملية فشلت',
} as const;

export type TextKey = keyof typeof ar;

const en: Record<TextKey, string> = {
  // Header
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

  // Common
  loading: 'Loading…',
  save: 'Save',
  saved: 'Saved ✓',
  currencyEgp: 'EGP',
  currencyShort: 'EGP',

  // Dashboard
  dashEyebrow: 'Dashboard',
  dashWelcome: 'Welcome, {name} 👋',
  dashWelcomeAnon: 'Welcome back 👋',
  adminSuffix: ' · Admin',
  statTickets: 'Tickets',
  statSpent: 'Total spent',
  statStops: 'Stops travelled',
  statFavourite: 'Favourite station',
  recentTrips: 'Recent trips',
  newTrip: 'New trip',
  noTickets: "You haven't booked any tickets yet.",
  myDetails: 'My details',
  nameLabel: 'Name',
  signOutLong: 'Sign out',

  // Verification page
  accountEyebrow: 'Account',
  verifIntro: 'Half-fare tickets are available to seniors (over 60) and people with disabilities, after a document review.',
  verifiedTitle: 'Your account is verified ✓',
  categoryLine: 'Category: {category}',
  validUntil: 'Verification is valid until {date}.',
  pendingBody: 'We received your request and it is under review. You can book half-fare tickets as soon as it is approved.',
  expiredNotice: 'Your previous verification has expired. Send a new document to renew it.',
  rejectedNotice: 'Your previous request was rejected. You can send a clearer document.',
  submitTitle: 'Submit a verification request',
  categoryField: 'Category',
  fileField: 'ID or card photo (JPG, PNG, WEBP or PDF, up to 5 MB)',
  privacyNote:
    'The document is stored privately. Only the reviewer (admin) can see it, and we use it for nothing but verification.',
  uploading: 'Uploading…',
  sendRequest: 'Send request',
  chooseIdFirst: 'Choose an ID image first.',
  requestSent: 'Your request was sent and will be reviewed soon.',
  genericError: 'Something went wrong, please try again.',
  catSenior: 'Seniors (over 60)',
  catDisabled: 'People with disabilities',
  statusPending: 'Under review',
  statusApproved: 'Approved',
  statusRejected: 'Rejected',

  // Verification errors
  errSignInFirst: 'Please sign in first',
  errFileType: 'The file must be an image (JPG, PNG or WEBP) or a PDF',
  errFileSize: 'The file is larger than 5 MB',
  errPendingExists: 'You already have a request under review',
  errUpload: "We couldn't upload the file, please try again",
  errRequest: "We couldn't record the request, please try again",
  errServer: 'The server is not connected',
  errOperation: 'The operation failed',
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

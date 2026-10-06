import { useI18n } from '../i18n';

/** Small button that flips between Arabic and English. Put it in the top bar. */
export default function LanguageSwitch({ className = 'outline-button' }: { className?: string }) {
  const { lang, toggle, t } = useI18n();
  return (
    <button
      type="button"
      className={className}
      onClick={toggle}
      aria-label={t('lang.switchTo')}
      lang={lang === 'ar' ? 'en' : 'ar'}
    >
      {lang === 'ar' ? 'English' : 'العربية'}
    </button>
  );
}

// قالب هر ناوبری: فید-این نرم صفحه (CSS در globals.css با احترام به reduced-motion)
export default function LocaleTemplate({ children }) {
  return <div className="page-enter">{children}</div>;
}

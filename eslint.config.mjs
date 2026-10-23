import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import reactHooks from "eslint-plugin-react-hooks";

const nextConfig = [...nextCoreWebVitals];

// الگوی رایج «بارگذاری داده در mount» در ۲۱ کامپوننت عمدی است؛ تا بازطراحی
// بزرگ به ایدئوم React 19 این قاعده فقط هشدار می‌دهد.
const relaxedHooks = {
  plugins: { "react-hooks": reactHooks },
  rules: {
    "react-hooks/set-state-in-effect": "warn"
  }
};

const eslintConfig = [
  {
    ignores: ["node_modules/**", ".next/**", "public/uploads/**", ".audit-shots/**"]
  },
  ...nextConfig,
  relaxedHooks
];

export default eslintConfig;

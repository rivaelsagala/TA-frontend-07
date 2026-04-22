import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        translation: {
          "thinking": "Loading...‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎  ",
          "startListening": "🔵 Start Listening",
          "stopListening": "🔴 Stop Listening",
          "general": "General",
          "detailed": "Detailed"
        }
      },
      id: {
        translation: {
          "thinking": "Loading...‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎  ",
          "startListening": "🔵 Mulai Mendengarkan",
          "stopListening": "🔴 Berhenti Mendengarkan",
          "general": "Umum",
          "detailed": "Detail"
        }
      }
    },
    lng: 'id', // default language
    fallbackLng: 'id',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
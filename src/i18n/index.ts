import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import fr from './fr.json';

// French UI by default; add a locale file and a resource entry to open another language.
void i18n.use(initReactI18next).init({
  resources: { fr: { translation: fr } },
  lng: 'fr',
  fallbackLng: 'fr',
  interpolation: { escapeValue: false }, // React already escapes
  returnObjects: true
});

export default i18n;

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { SUPPORTED_LANGUAGES } from '@/app/config';
import { usePreferencesStore } from '@/store';
import arAuth from './ar/auth.json';
import arCommon from './ar/common.json';
import arErrors from './ar/errors.json';
import arRegistration from './ar/registration.json';
import arRoles from './ar/roles.json';
import arValidation from './ar/validation.json';
import enAuth from './en/auth.json';
import enCommon from './en/common.json';
import enErrors from './en/errors.json';
import enRegistration from './en/registration.json';
import enRoles from './en/roles.json';
import enValidation from './en/validation.json';

export const defaultNS = 'common';

void i18n.use(initReactI18next).init({
  resources: {
    ar: { common: arCommon, errors: arErrors, validation: arValidation, auth: arAuth, registration: arRegistration, roles: arRoles },
    en: { common: enCommon, errors: enErrors, validation: enValidation, auth: enAuth, registration: enRegistration, roles: enRoles },
  },
  lng: usePreferencesStore.getState().language,
  fallbackLng: 'en',
  supportedLngs: [...SUPPORTED_LANGUAGES],
  ns: ['common', 'errors', 'validation', 'auth', 'registration', 'roles'],
  defaultNS,
  interpolation: { escapeValue: false },
  returnNull: false,
  initImmediate: false,
  react: { useSuspense: false },
});

export default i18n;

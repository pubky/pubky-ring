import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as RNLocalize from 'react-native-localize';
import en from './locales/en.json';
import es from './locales/es.json';

// Define available languages
export const resources = {
	en: { translation: en },
	es: { translation: es },
} as const;

export const supportedLanguages = Object.keys(resources);
export const defaultNS = 'translation';
export const fallbackLng = 'en';

const getDeviceLanguage = (): string => {
	const locales = RNLocalize.getLocales();
	if (locales.length > 0) {
		const { languageCode } = locales[0];
		// Return device language if supported, otherwise fallback
		if (supportedLanguages.includes(languageCode)) {
			return languageCode;
		}
	}
	return fallbackLng;
};

i18n.use(initReactI18next).init({
	resources,
	lng: getDeviceLanguage(),
	fallbackLng,
	defaultNS,
	interpolation: {
		escapeValue: false, // React already handles XSS
	},
	react: {
		useSuspense: false, // Disable suspense for React Native
	},
});

export default i18n;

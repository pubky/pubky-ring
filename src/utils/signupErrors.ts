import { classifySignupTokenError } from './signupTokenErrors';
import i18n from '../i18n';

export type LoadingErrorModalFields = {
	errorDescription?: string;
	errorModalTitle?: string;
};

export const getSignupTokenErrorDescription = (errorMessage: string): string | undefined => {
	if (classifySignupTokenError(errorMessage) === 'used') {
		return i18n.t('signup.alreadyUsedDescription');
	} else if (classifySignupTokenError(errorMessage) === 'required') {
		return i18n.t('signup.requiredDescription');
	} else if (classifySignupTokenError(errorMessage) === 'invalid') {
		return i18n.t('signup.invalidDescription');
	}

	return undefined;
};

export const getSignupTokenErrorModalFields = (errorMessage: string): LoadingErrorModalFields => {
	const errorDescription = getSignupTokenErrorDescription(errorMessage);

	if (!errorDescription) return {};

	return {
		errorDescription,
		errorModalTitle: i18n.t('signup.invalidTitle'),
	};
};

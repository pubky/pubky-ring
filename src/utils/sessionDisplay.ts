import { PubkySession } from '../types/pubky';
import type { TFunction } from 'i18next';

const SESSION_SECRET_FINGERPRINT_LENGTH = 6;

export const formatSessionTimestamp = (timestamp: number): string => {
	const date = new Date(timestamp);

	if (Number.isNaN(date.getTime())) {
		return '';
	}

	return new Intl.DateTimeFormat(undefined, {
		day: '2-digit',
		month: '2-digit',
		year: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
	}).format(date);
};

export const getSessionFingerprint = (session: PubkySession): string =>
	session.id.slice(-SESSION_SECRET_FINGERPRINT_LENGTH).toUpperCase();

export const hasRootSessionAccess = (session: PubkySession): boolean => session.capabilities.includes('/');

export const getSessionTitle = (t: TFunction, session: PubkySession): string => {
	const fingerprint = getSessionFingerprint(session);

	if (!fingerprint) {
		return t('activeSession.sessionTitleFallback');
	}

	return t('activeSession.sessionTitle', { fingerprint });
};

export const getSessionSubtitle = (t: TFunction, session: PubkySession): string => {
	if (session.capabilities.length === 0) {
		return t('activeSession.noPermissions');
	}

	if (hasRootSessionAccess(session)) {
		return t('activeSession.rootHomeserverAccess');
	}

	return t('activeSession.permissionCount', { count: session.capabilities.length });
};

export const getPermissionLabel = (capability: string): string => {
	if (capability === '/') {
		return '/';
	}

	return capability.endsWith('/') ? capability : `${capability}/`;
};

import { GrantInfo } from '../types/pubky';
import type { TFunction } from 'i18next';

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
export const getPermissionLabel = (capability: string): string => {
	if (capability === '/') {
		return '/';
	}

	return capability.endsWith('/') ? capability : `${capability}/`;
};

export const getGrantCapabilities = (grant: GrantInfo): string[] =>
	grant.capabilities
		.split(',')
		.map(capability => capability.trim())
		.filter(Boolean);

export const getGrantSubtitle = (t: TFunction, grant: GrantInfo): string => {
	const capabilities = getGrantCapabilities(grant);

	if (capabilities.length === 0) {
		return t('activeSession.noPermissions');
	}

	return t('activeSession.permissionCount', { count: capabilities.length });
};

export const formatGrantTimestamp = (timestamp: number): string => formatSessionTimestamp(timestamp * 1000);

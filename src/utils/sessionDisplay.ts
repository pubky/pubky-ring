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

export type GrantPermissionAction = 'read' | 'write';

export type GrantPermission = {
	path: string;
	actions: GrantPermissionAction[];
};

export const parseGrantPermission = (capability: string): GrantPermission => {
	const match = capability.match(/^(.*):([rw]+)$/);
	const scope = match?.[1] ?? capability;
	const encodedActions = match?.[2] ?? '';
	const actions: GrantPermissionAction[] = [];

	if (encodedActions.includes('r')) {
		actions.push('read');
	}
	if (encodedActions.includes('w')) {
		actions.push('write');
	}

	return {
		path: scope === '/' || scope.endsWith('/') ? scope : `${scope}/`,
		actions,
	};
};

export const getPermissionLabel = (capability: string): string => {
	return parseGrantPermission(capability).path;
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

export const getGrantExpiryLabel = (t: TFunction, timestamp: number): string => {
	if (timestamp <= 0) {
		return t('grants.neverExpires');
	}

	return t('grants.expires', { date: formatGrantTimestamp(timestamp) });
};

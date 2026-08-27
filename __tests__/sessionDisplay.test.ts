import { PubkySession } from '../src/types/pubky';
import { getPermissionLabel, getSessionSubtitle, getSessionTitle } from '../src/utils/sessionDisplay';
import type { TFunction } from 'i18next';

const session: PubkySession = {
	id: 'session-cookie',
	capabilities: ['/pub/example'],
	created_at: 123,
};

const t = ((key: string, options?: { count?: number; fingerprint?: string }) => {
	const translations: Record<string, string> = {
		'activeSession.sessionTitle': `Session ${options?.fingerprint}`,
		'activeSession.sessionTitleFallback': 'Session',
		'activeSession.noPermissions': 'No permissions',
		'activeSession.rootHomeserverAccess': 'Root homeserver access',
		'activeSession.permissionCount': `${options?.count} permission${options?.count === 1 ? '' : 's'}`,
	};

	return translations[key] ?? key;
}) as TFunction;

describe('sessionDisplay', () => {
	it('formats a session title from its id fingerprint', () => {
		expect(getSessionTitle(t, session)).toBe('Session COOKIE');
	});

	it('summarizes session permissions', () => {
		expect(getSessionSubtitle(t, session)).toBe('1 permission');
		expect(getSessionSubtitle(t, { ...session, capabilities: ['/'] })).toBe('Root homeserver access');
		expect(getSessionSubtitle(t, { ...session, capabilities: [] })).toBe('No permissions');
	});

	it('normalizes permission labels as paths', () => {
		expect(getPermissionLabel('/pub/example')).toBe('/pub/example/');
		expect(getPermissionLabel('/')).toBe('/');
	});
});

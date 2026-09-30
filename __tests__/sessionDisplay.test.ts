import {
	formatGrantTimestamp,
	getGrantCapabilities,
	getGrantSubtitle,
	getPermissionLabel,
} from '../src/utils/sessionDisplay';
import type { TFunction } from 'i18next';

const t = ((key: string, options?: { count?: number }) => {
	const translations: Record<string, string> = {
		'activeSession.noPermissions': 'No permissions',
		'activeSession.permissionCount': `${options?.count} permission${options?.count === 1 ? '' : 's'}`,
	};

	return translations[key] ?? key;
}) as TFunction;

describe('sessionDisplay', () => {
	it('normalizes permission labels as paths', () => {
		expect(getPermissionLabel('/pub/example')).toBe('/pub/example/');
		expect(getPermissionLabel('/')).toBe('/');
	});

	it('formats grant metadata for the authorized app UI', () => {
		const grant = {
			grant_id: 'grant-id',
			client_id: 'example.app',
			capabilities: '/pub/example/:rw, /pub/files/:r',
			issued_at: 1_700_000_000,
			expires_at: 1_800_000_000,
		};

		expect(getGrantCapabilities(grant)).toEqual(['/pub/example/:rw', '/pub/files/:r']);
		expect(getGrantSubtitle(t, grant)).toBe('2 permissions');
		expect(formatGrantTimestamp(grant.issued_at)).not.toBe('');
	});
});

import {
	formatGrantTimestamp,
	getGrantCapabilities,
	getGrantExpiryLabel,
	getGrantSubtitle,
	getPermissionLabel,
	parseGrantPermission,
} from '../src/utils/sessionDisplay';
import type { TFunction } from 'i18next';

const t = ((key: string, options?: { count?: number; date?: string }) => {
	const translations: Record<string, string> = {
		'activeSession.noPermissions': 'No permissions',
		'activeSession.permissionCount': `${options?.count} permission${options?.count === 1 ? '' : 's'}`,
		'grants.neverExpires': 'Never expires',
		'grants.expires': `Expires ${options?.date ?? ''}`,
	};

	return translations[key] ?? key;
}) as TFunction;

describe('sessionDisplay', () => {
	it('normalizes permission labels as paths', () => {
		expect(getPermissionLabel('/pub/example')).toBe('/pub/example/');
		expect(getPermissionLabel('/pub/example/:rw')).toBe('/pub/example/');
		expect(getPermissionLabel('/')).toBe('/');
	});

	it.each([
		['/pub/example/:r', '/pub/example/', ['read']],
		['/pub/example/:w', '/pub/example/', ['write']],
		['/pub/example/:rw', '/pub/example/', ['read', 'write']],
	])('parses %s into its scope and actions', (capability, path, actions) => {
		expect(parseGrantPermission(capability)).toEqual({ path, actions });
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

	it('describes grants without an expiry date as non-expiring', () => {
		expect(getGrantExpiryLabel(t, 0)).toBe('Never expires');
		expect(getGrantExpiryLabel(t, 1_800_000_000)).not.toContain('1970');
	});
});

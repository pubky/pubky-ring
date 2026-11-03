export interface AuthCapability {
	path: string;
	permission: string;
}

export const ENCRYPTION_ACTION = 'e';

export const hasEncryptionCapabilities = (capabilities: AuthCapability[]): boolean =>
	capabilities.some(capability => capability.permission.includes(ENCRYPTION_ACTION));

// Declining encryption preserves read/write access and omits scopes with no remaining actions.
export const buildApprovedCapabilities = (
	capabilities: AuthCapability[],
	encryptionApproved: boolean,
): AuthCapability[] =>
	capabilities
		.map(capability => ({
			...capability,
			permission: encryptionApproved
				? capability.permission
				: capability.permission.replaceAll(ENCRYPTION_ACTION, ''),
		}))
		.filter(capability => capability.permission.length > 0);

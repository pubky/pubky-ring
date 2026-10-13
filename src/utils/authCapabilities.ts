export interface AuthCapability {
	path: string;
	permission: string;
}

export const ENCRYPTION_ACTION = 'e';

export const hasEncryptionCapabilities = (capabilities: AuthCapability[]): boolean =>
	capabilities.some(capability => capability.permission.includes(ENCRYPTION_ACTION));

/**
 * Serialize the exact capability subset approved by the user.
 *
 * A declined encryption action is removed without changing read/write access
 * on the same scope. Capabilities with no remaining actions are omitted.
 */
export const buildApprovedCapabilities = (
	capabilities: AuthCapability[],
	declinedEncryptionIndexes: ReadonlySet<number>,
): string =>
	capabilities
		.map((capability, index) => {
			const permission = declinedEncryptionIndexes.has(index)
				? capability.permission.replaceAll(ENCRYPTION_ACTION, '')
				: capability.permission;

			return permission ? `${capability.path}:${permission}` : undefined;
		})
		.filter((capability): capability is string => capability !== undefined)
		.join(',');

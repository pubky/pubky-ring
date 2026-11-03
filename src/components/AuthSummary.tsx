import React, { memo, ReactElement } from 'react';
import { StyleSheet } from 'react-native';
import { Trans, useTranslation } from 'react-i18next';
import type { ParseKeys } from 'i18next';
import { TextBaseB, TextBaseM } from '../theme/typography';
import type { AuthCapability } from '../utils/authCapabilities';

interface AuthSummaryProps {
	capabilities: AuthCapability[];
	authorized: boolean;
}

const ACCESS_LABELS: Partial<Record<string, ParseKeys>> = {
	r: 'auth.readData',
	w: 'auth.editData',
	rw: 'auth.readAndEdit',
};

const AuthSummary = ({ capabilities, authorized }: AuthSummaryProps): ReactElement => {
	const { t } = useTranslation();
	const active = capabilities.filter(capability => capability.permission.length > 0);
	const encrypted = active.some(capability => capability.permission.includes('e'));
	const accessTypes = [
		...new Set(
			active.map(({ permission }) => ['r', 'w'].filter(action => permission.includes(action)).join('')),
		),
	];
	const scopes = [
		...new Set(active.map(({ path }) => path.match(/^\/(?:pub|priv)\/([^/]+)\//)?.[1] ?? path)),
	];
	const scopeList =
		scopes.length > 1
			? t('auth.scopeList', { scopes: scopes.slice(0, -1).join(', '), last: scopes.at(-1) })
			: scopes[0];
	const allData = scopes.includes('/');
	const access = t(
		accessTypes.length === 1 ? (ACCESS_LABELS[accessTypes[0]] ?? 'auth.accessData') : 'auth.accessData',
	);

	return (
		<TextBaseM style={styles.summary} testID="AuthSummary">
			{active.length === 0 ? (
				t(authorized ? 'auth.identitySuccessSummary' : 'auth.identityRequestSummary')
			) : (
				<Trans
					i18nKey={authorized ? 'auth.dataSuccessSummary' : 'auth.dataRequestSummary'}
					values={{ access }}
					components={{
						data: (
							<TextBaseM style={styles.summary}>
								{allData ? (
									t('auth.allYourData')
								) : (
									<Trans
										i18nKey="auth.scopeData"
										components={{ scope: <TextBaseB style={styles.bold}>{scopeList}</TextBaseB> }}
									/>
								)}
							</TextBaseM>
						),
						encryption: (
							<TextBaseM style={styles.summary}>
								{encrypted && (
									<Trans
										i18nKey="auth.includingEncryptedData"
										components={{ bold: <TextBaseB style={styles.bold} /> }}
									/>
								)}
							</TextBaseM>
						),
					}}
				/>
			)}
		</TextBaseM>
	);
};

const styles = StyleSheet.create({
	summary: { fontSize: 17, lineHeight: 22, fontWeight: '400' },
	bold: { fontSize: 17, lineHeight: 22, fontWeight: '700' },
});

export default memo(AuthSummary);

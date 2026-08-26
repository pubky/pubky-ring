import React, { Fragment, memo, ReactElement, useCallback } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTypedNavigation } from '../../navigation/hooks';
import { PubkyData } from '../../navigation/types';
import { PubkySession } from '../../types/pubky';
import { ChevronRight, Monitor } from '../../icons';
import { Text2Xl, TextBaseB, TextSmM, TextXsSb } from '../../theme/typography';
import { getSessionSubtitle, getSessionTitle } from '../../utils/sessionDisplay';
import { ThemedView } from '../../theme/components';

type SessionListProps = {
	pubkyData: PubkyData;
};

type SessionRowProps = {
	pubky: string;
	session: PubkySession;
};

const SessionRow = memo(({ pubky, session }: SessionRowProps): ReactElement => {
	const navigation = useTypedNavigation();
	const { t } = useTranslation();

	const handlePress = useCallback(() => {
		navigation.navigate('ActiveSession', {
			pubky,
			sessionId: session.id,
		});
	}, [navigation, pubky, session.id]);

	return (
		<TouchableOpacity
			style={styles.sessionRow}
			activeOpacity={0.75}
			testID="SessionRow"
			onPress={handlePress}
		>
			<ThemedView style={styles.iconBox} colorName="muted">
				<Monitor />
			</ThemedView>
			<View style={styles.sessionText}>
				<TextBaseB numberOfLines={1}>{getSessionTitle(t, session)}</TextBaseB>
				<TextSmM numberOfLines={1}>{getSessionSubtitle(t, session)}</TextSmM>
			</View>
			<ChevronRight colorName="foreground" />
		</TouchableOpacity>
	);
});

const SessionList = ({ pubkyData }: SessionListProps): ReactElement | null => {
	const { t } = useTranslation();
	const sessions = pubkyData.sessions;

	if (sessions.length === 0) {
		return null;
	}

	return (
		<View style={styles.container}>
			<View style={styles.titleRow}>
				<Text2Xl>{t('activeSession.activeSessions')}</Text2Xl>
				<ThemedView style={styles.countBadge} colorName="pubkyApp">
					<TextXsSb colorName="primaryForeground">{sessions.length}</TextXsSb>
				</ThemedView>
			</View>
			<View style={styles.list}>
				{sessions.map((session, sessionIndex) => (
					<Fragment key={session.id}>
						<SessionRow pubky={pubkyData.pubky} session={session} />
						{sessionIndex < sessions.length - 1 && (
							<ThemedView style={styles.sessionRowDivider} colorName="border" />
						)}
					</Fragment>
				))}
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		marginTop: 24,
	},
	titleRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 12,
		marginBottom: 16,
	},
	countBadge: {
		minWidth: 24,
		height: 20,
		paddingHorizontal: 10,
		borderRadius: 8,
		alignItems: 'center',
		justifyContent: 'center',
	},
	list: {
		gap: 16,
	},
	sessionRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 12,
	},
	sessionRowDivider: {
		height: 1,
	},
	iconBox: {
		width: 48,
		height: 48,
		borderRadius: 8,
		alignItems: 'center',
		justifyContent: 'center',
	},
	sessionText: {
		flex: 1,
	},
});

export default memo(SessionList);

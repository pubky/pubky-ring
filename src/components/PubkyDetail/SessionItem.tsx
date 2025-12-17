import React, { memo, ReactElement, useCallback, useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { PubkySession } from '../../types/pubky.ts';
import {
	SessionView,
	Text,
	TouchableOpacity,
	SessionText,
	SessionBox,
} from '../../theme/components.ts';

const formatTimestamp = (timestamp: number): string => {
	const date = new Date(timestamp);
	const pad = (n: number): string => n.toString().padStart(2, '0');
	const day = pad(date.getDate());
	const month = pad(date.getMonth() + 1);
	const year = date.getFullYear();
	const hours = pad(date.getHours());
	const minutes = pad(date.getMinutes());
	return `${day}-${month}-${year} ${hours}:${minutes}`;
};

const SessionItem = ({ session, onSignOut }: {
    session: PubkySession;
    onSignOut: (sessionSecret: string) => void;
}): ReactElement => {
	const { t } = useTranslation();
	const formattedDate = useMemo(() =>
    session.created_at ? formatTimestamp(session.created_at) : '',
	[session.created_at]
	);

	const handleSignOut = useCallback(() => {
		onSignOut(session.session_secret);
	}, [onSignOut, session.session_secret]);

	return (
		<SessionBox style={styles.sessionCard}>
			<SessionView style={styles.headerRow}>
				<SessionView style={styles.infoContainer}>
					<Text style={styles.pubkyText} numberOfLines={1}>
						{session.pubky}
					</Text>
					<SessionText style={styles.dateText}>{formattedDate}</SessionText>
				</SessionView>
				<TouchableOpacity
					style={styles.signOutButton}
					onPress={handleSignOut}
					activeOpacity={0.7}
				>
					<Text
						style={styles.signOutText}
						numberOfLines={1}
						adjustsFontSizeToFit
						minimumFontScale={0.8}
					>{t('sessionItem.signOut')}</Text>
				</TouchableOpacity>
			</SessionView>

			{session.capabilities?.length > 0 && (
				<SessionView style={styles.capsContainer}>
					<Text style={styles.capsTitle}>{t('sessionItem.capabilities')}</Text>
					<SessionView style={styles.capsWrapper}>
						{session.capabilities.map((cap, idx) => (
							<SessionView key={idx} style={styles.capChip}>
								<Text style={styles.capText}>{cap}</Text>
							</SessionView>
						))}
					</SessionView>
				</SessionView>
			)}
		</SessionBox>
	);
};

const styles = StyleSheet.create({
	sessionCard: {
		borderRadius: 24,
		padding: 16,
		marginBottom: 12,
		marginHorizontal: 24,
		borderWidth: 1,
	},
	signOutButton: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingVertical: 8,
		paddingHorizontal: 16,
		borderRadius: 20,
		backgroundColor: '#fff0f0',
		minWidth: 100,
		justifyContent: 'center',
	},
	signOutText: {
		fontSize: 14,
		color: '#ff4444',
		fontWeight: '500',
	},
	headerRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: 12,
	},
	infoContainer: {
		flex: 1,
		marginRight: 12,
	},
	pubkyText: {
		fontSize: 14,
		fontFamily: 'monospace',
		marginBottom: 4,
	},
	dateText: {
		fontSize: 12,
		fontStyle: 'italic',
	},
	capsContainer: {
		marginTop: 8,
	},
	capsTitle: {
		fontSize: 14,
		fontWeight: '500',
		marginBottom: 8,
	},
	capsWrapper: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: 8,
	},
	capChip: {
		backgroundColor: '#e0e0e0',
		borderRadius: 16,
		paddingHorizontal: 12,
		paddingVertical: 6,
	},
	capText: {
		fontSize: 12,
		color: '#666',
	},
});

export default memo(SessionItem);

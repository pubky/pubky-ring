// Currently not used

import React, { memo, ReactElement, useCallback, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { PubkySession } from '../../types/pubky.ts';
import { BodySSBText, BodySText, CaptionSBSpacedText } from '../../theme/typography';
import { TouchableOpacity, CardGradient } from '../../theme/components.ts';

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

const SessionItem = ({
	session,
	onSignOut,
}: {
	session: PubkySession;
	onSignOut: (sessionSecret: string) => void;
}): ReactElement => {
	const { t } = useTranslation();
	const formattedDate = useMemo(
		() => (session.created_at ? formatTimestamp(session.created_at) : ''),
		[session.created_at],
	);

	const handleSignOut = useCallback(() => {
		onSignOut(session.session_secret);
	}, [onSignOut, session.session_secret]);

	return (
		<CardGradient style={styles.sessionCard}>
			<View style={styles.headerRow}>
				<View style={styles.infoContainer}>
					<BodySSBText style={styles.pubkyText} numberOfLines={1}>
						{session.pubky}
					</BodySSBText>
					<BodySText colorName="textTertiary" style={styles.dateText}>
						{formattedDate}
					</BodySText>
				</View>
				<TouchableOpacity style={styles.signOutButton} onPress={handleSignOut} activeOpacity={0.7}>
					<CaptionSBSpacedText
						colorName="danger"
						numberOfLines={1}
						adjustsFontSizeToFit
						minimumFontScale={0.8}
					>
						{t('sessionItem.signOut')}
					</CaptionSBSpacedText>
				</TouchableOpacity>
			</View>

			{session.capabilities?.length > 0 && (
				<View style={styles.capsContainer}>
					<CaptionSBSpacedText style={styles.capsTitle}>{t('sessionItem.capabilities')}</CaptionSBSpacedText>
					<View style={styles.capsWrapper}>
						{session.capabilities.map(cap => (
							<View key={cap} style={styles.capChip}>
								<BodySText>{cap}</BodySText>
							</View>
						))}
					</View>
				</View>
			)}
		</CardGradient>
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
		marginBottom: 4,
	},
	dateText: {
		fontStyle: 'italic',
	},
	capsContainer: {
		marginTop: 8,
	},
	capsTitle: {
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
});

export default memo(SessionItem);

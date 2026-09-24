import React, { memo, ReactElement, useCallback } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from 'styled-components/native';
import { Theme } from '../theme';
import { Text2Xl, TextBaseB } from '../theme/typography';
import { truncateStr } from '../utils/pubky.ts';
import { showSheet } from '../sheets/sheetNavigation.tsx';
import ProfileAvatar from './ProfileAvatar.tsx';
import Button from './Button.tsx';
import DashedBorder from './DashedBorder.tsx';
import SourceAppPill from './SourceAppPill.tsx';
import { ChevronRight, Plus } from '../icons/index.ts';

interface ExternalPubkyBoxProps {
	pubky: string;
	sourceApp: string;
	index: number;
}

const ExternalPubkyBox = ({ pubky, sourceApp, index }: ExternalPubkyBoxProps): ReactElement => {
	const { t } = useTranslation();
	const theme = useTheme() as Theme;

	const pubkyName = `pubky #${index + 1} (Bitkit)`;

	const handlePress = useCallback(() => {
		showSheet('use-external-pubky', { pubky, sourceApp });
	}, [pubky, sourceApp]);

	return (
		<View style={styles.container} testID={`ExternalPubkyBox-${index}`}>
			<DashedBorder
				style={[styles.dashedCard, { backgroundColor: theme.colors.card }]}
				borderColor={theme.colors.foreground}
				borderWidth={1}
				borderRadius={styles.dashedCard.borderRadius}
			>
				<View style={styles.card}>
					<TouchableOpacity
						style={styles.content}
						activeOpacity={0.7}
						testID={`ExternalPubkyBox-${index}-Content`}
						onPress={handlePress}
					>
						<View style={styles.profileImage}>
							<ProfileAvatar name={pubkyName} pubky={pubky} size={48} external />
						</View>

						<View style={styles.contentContainer}>
							<Text2Xl style={styles.nameText} numberOfLines={1}>
								{pubkyName}
							</Text2Xl>

							<View style={styles.row}>
								<TextBaseB numberOfLines={1} ellipsizeMode="middle">
									{truncateStr(pubky)}
								</TextBaseB>

								<SourceAppPill style={styles.sourceAppPill} />
							</View>
						</View>

						<View style={styles.iconContainer}>
							<ChevronRight colorName="foreground" />
						</View>
					</TouchableOpacity>

					<DashedBorder
						style={styles.dashedButton}
						borderColor={theme.colors.foreground}
						borderWidth={1}
						borderRadius={styles.dashedButton.borderRadius}
					>
						<Button
							text={t('sharedPubky.useCta')}
							style={styles.useButton}
							size="large"
							variant="secondary"
							icon={<Plus />}
							testID={`ExternalPubkyBox-${index}-UseButton`}
							onPress={handlePress}
						/>
					</DashedBorder>
				</View>
			</DashedBorder>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		marginBottom: 24,
		marginHorizontal: 24,
	},
	dashedCard: {
		borderRadius: 16,
	},
	card: {
		padding: 24,
	},
	content: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	profileImage: {
		width: 48,
		height: 48,
		borderRadius: '50%',
		overflow: 'hidden',
		justifyContent: 'center',
		alignItems: 'center',
		marginRight: 16,
	},
	contentContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'flex-start',
	},
	nameText: {
		paddingRight: 16,
	},
	row: {
		flexDirection: 'row',
		flexWrap: 'nowrap',
		alignItems: 'center',
	},
	sourceAppPill: {
		marginLeft: 8,
	},
	iconContainer: {
		justifyContent: 'center',
		marginLeft: 'auto',
	},
	useButton: {
		// The large size flexes, which collapses it in the non-scrolling empty Home.
		flex: 0,
	},
	dashedButton: {
		borderRadius: 60,
		padding: 1,
		marginTop: 16,
	},
});

export default memo(ExternalPubkyBox);

import React, { ReactElement } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text, SessionText, RadialGradient, ForegroundView } from '../../theme/components.ts';
import ModalIndicator from '../ModalIndicator.tsx';
import { AUTHORIZE_KEY_GRADIENT } from '../../utils/constants.ts';
import PubkyProfile from '../PubkyProfile.tsx';
import { PubkyData } from '../../navigation/types.ts';
import i18n from '../../i18n';
import { textStyles } from '../../theme/utils';
import Button from '../Button.tsx';

interface PubkyReviewProps {
	modalTitle: string;
	headerText?: string;
	description: string;
	pubky: string;
	pubkyData: PubkyData;
	onContinue: () => void;
}

const PubkyReview = ({
	modalTitle,
	headerText,
	description,
	pubky,
	pubkyData,
	onContinue,
}: PubkyReviewProps): ReactElement => {
	return (
		<RadialGradient style={styles.content} colors={AUTHORIZE_KEY_GRADIENT} center={{ x: 0.5, y: 0.5 }}>
			<ModalIndicator />
			<View style={styles.titleContainer}>
				<Text style={styles.title}>{modalTitle}</Text>
			</View>
			{headerText && <Text style={styles.headerText}>{headerText}</Text>}
			<SessionText style={styles.message}>{description}</SessionText>
			<ForegroundView style={styles.profileCard}>
				<PubkyProfile pubky={pubky} pubkyData={pubkyData} hideButton={true} />
			</ForegroundView>
			<View style={styles.footer}>
				<Button
					text={i18n.t('common.continue')}
					size="large"
					variant="secondary"
					testID="NewPubkyContinueButton"
					onPress={onContinue}
				/>
			</View>
		</RadialGradient>
	);
};

const styles = StyleSheet.create({
	content: {
		flex: 1,
		paddingHorizontal: 20,
		borderTopRightRadius: 20,
		borderTopLeftRadius: 20,
		paddingBottom: 20,
	},
	titleContainer: {
		flexDirection: 'row',
		justifyContent: 'center',
		backgroundColor: 'transparent',
	},
	headerText: {
		...textStyles.display,
		marginBottom: 16,
	},
	title: {
		...textStyles.bodyMB,
		textAlign: 'center',
		textTransform: 'capitalize',
		marginBottom: 24,
		backgroundColor: 'transparent',
	},
	message: {
		...textStyles.bodyM,
		marginBottom: 24,
	},
	profileCard: {
		alignItems: 'center',
		justifyContent: 'center',
		borderRadius: 24,
		backgroundColor: 'rgba(255, 255, 255, 0.05)',
	},
	footer: {
		marginTop: 'auto',
		flexDirection: 'row',
		alignItems: 'center',
	},
});

export default PubkyReview;

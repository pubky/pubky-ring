import React, { ReactElement } from 'react';
import { StyleSheet, View } from 'react-native';
import { ForegroundView } from '../../theme/components.ts';
import PubkyProfile from '../PubkyProfile.tsx';
import { PubkyData } from '../../navigation/types.ts';
import i18n from '../../i18n';
import { BodyMText, DisplayText } from '../../theme/typography';
import Button from '../Button.tsx';

interface PubkyReviewProps {
	headerText?: string;
	description: string;
	pubky: string;
	pubkyData: PubkyData;
	onContinue: () => void;
}

const PubkyReview = ({
	headerText,
	description,
	pubky,
	pubkyData,
	onContinue,
}: PubkyReviewProps): ReactElement => {
	return (
		<View style={styles.content}>
			{headerText && <DisplayText style={styles.headerText}>{headerText}</DisplayText>}
			<BodyMText style={styles.message}>{description}</BodyMText>
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
		</View>
	);
};

const styles = StyleSheet.create({
	content: {
		flex: 1,
	},
	headerText: {
		marginBottom: 20,
	},
	message: {
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

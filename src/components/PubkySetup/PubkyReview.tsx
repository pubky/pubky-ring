import React, { ReactElement } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import PubkyProfile from '../PubkyProfile.tsx';
import { PubkyData } from '../../navigation/types.ts';
import { BodyMText, DisplayText } from '../../theme/typography';
import Button from '../Button.tsx';

interface PubkyReviewProps {
	headerText: string;
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
	const { t } = useTranslation();

	return (
		<View style={styles.content}>
			<DisplayText style={styles.headerText}>{headerText}</DisplayText>
			<BodyMText style={styles.message}>{description}</BodyMText>
			<PubkyProfile pubky={pubky} pubkyData={pubkyData} />
			<View style={styles.footer}>
				<Button
					text={t('common.continue')}
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
	footer: {
		marginTop: 'auto',
		flexDirection: 'row',
		alignItems: 'center',
	},
});

export default PubkyReview;

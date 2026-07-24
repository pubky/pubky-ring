import React, { memo, ReactElement } from 'react';
import { StyleSheet, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { SheetScreen } from '../components/Sheet.tsx';
import PubkyProfile from '../components/PubkyProfile.tsx';
import Button from '../components/Button.tsx';
import { defaultPubkyState } from '../store/shapes/pubky.ts';
import { PubkyData } from '../navigation/types.ts';
import { BodyMText, DisplayText } from '../theme/typography';
import type { AddPubkyStackParamList } from '../sheets/types.ts';

const SHEET_ID = 'add-pubky';

const AddPubkyReview = ({
	navigation,
	route,
}: NativeStackScreenProps<AddPubkyStackParamList, 'PubkyReview'>): ReactElement => {
	const { t } = useTranslation();
	const { pubky } = route.params;
	const pubkyData: PubkyData = { pubky, ...defaultPubkyState };

	return (
		<SheetScreen id={SHEET_ID} title={t('newPubkySetup.newPubky')} gradientType="brand">
			<View style={styles.content}>
				<DisplayText style={styles.headerText}>{t('pubky.yourPubky')}</DisplayText>
				<BodyMText style={styles.message}>{t('newPubkySetup.newPubkyDescription')}</BodyMText>
				<PubkyProfile pubky={pubky} pubkyData={pubkyData} />
				<View style={styles.footer}>
					<Button
						text={t('common.continue')}
						size="large"
						variant="secondary"
						testID="AddPubkyReviewContinue"
						onPress={() => navigation.navigate('Homeserver', { pubky })}
					/>
				</View>
			</View>
		</SheetScreen>
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

export default memo(AddPubkyReview);

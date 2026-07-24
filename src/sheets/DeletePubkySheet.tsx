import React, { memo, ReactElement, useCallback, useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { hideSheet } from './sheetNavigation.tsx';
import PubkyCard from '../components/PubkyCard.tsx';
import { getPubkyName } from '../store/selectors/pubkySelectors.ts';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import Button from '../components/Button.tsx';
import { useTranslation } from 'react-i18next';
import { BodyMText } from '../theme/typography';
import Sheet from '../components/Sheet.tsx';
import type { RootStackParamList } from '../navigation/types.ts';
import { useTypedNavigation } from '../navigation/hooks.ts';
import { deletePubky } from '../utils/pubky.ts';
import { showToast } from '../utils/helpers.ts';

const DeletePubkySheet = ({
	route,
}: NativeStackScreenProps<RootStackParamList, 'DeletePubkySheet'>): ReactElement => {
	const { t } = useTranslation();
	const dispatch = useDispatch();
	const navigation = useTypedNavigation();
	const { pubky } = route.params;
	const publicKey = pubky.startsWith('pk:') ? pubky.slice(3) : pubky;
	const currentPubkyName = useSelector((state: RootState) => getPubkyName(state, publicKey));
	// Preserve the original name while loading/deleting
	const [pubkyName] = useState(currentPubkyName);

	const closeSheet = useCallback((): void => {
		hideSheet('delete-pubky');
	}, []);

	const handleDelete = useCallback(async (): Promise<void> => {
		hideSheet('delete-pubky');
		navigation.goBack();

		const deleteRes = await deletePubky(pubky, dispatch);
		if (deleteRes.isErr()) {
			showToast({
				type: 'error',
				title: t('pubkyErrors.failedToDelete'),
				description: t('pubkyErrors.deleteError'),
			});
		}
	}, [dispatch, navigation, pubky, t]);

	return (
		<Sheet id="delete-pubky" title={t('pubky.deletePubky')} gradientType="brand">
			<BodyMText style={styles.message}>{t('pubky.deleteConfirm')}</BodyMText>
			<PubkyCard name={pubkyName} publicKey={publicKey} />
			<View style={styles.imageContainer}>
				<Image source={require('../images/trash.png')} style={styles.image} />
			</View>
			<View style={styles.buttonContainer}>
				<Button
					text={t('common.cancel')}
					size="large"
					testID="DeletePubkyCancelButton"
					onPress={closeSheet}
				/>
				<Button
					text={t('common.delete')}
					size="large"
					variant="secondary"
					testID="DeletePubkyConfirmButton"
					onPress={handleDelete}
				/>
			</View>
		</Sheet>
	);
};

const styles = StyleSheet.create({
	message: {
		marginBottom: 24,
	},
	imageContainer: {
		flex: 1,
		justifyContent: 'center',
	},
	image: {
		width: 342.57,
		height: 342.57,
		alignSelf: 'center',
	},
	buttonContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 16,
	},
});

export default memo(DeletePubkySheet);

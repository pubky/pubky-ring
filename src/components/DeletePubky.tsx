import React, { memo, ReactElement, useCallback, useRef } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { SheetManager } from 'react-native-actions-sheet';
import PubkyCard from './PubkyCard.tsx';
import { getPubkyName } from '../store/selectors/pubkySelectors.ts';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { Text } from '../theme/components.ts';
import Button from './Button.tsx';
import { useTranslation } from 'react-i18next';
import { textStyles } from '../theme/utils';
import Sheet from './Sheet.tsx';

const DeletePubky = ({
	payload,
}: {
	payload: {
		publicKey?: string;
		onDelete: () => void;
	};
}): ReactElement => {
	const { t } = useTranslation();
	const { onDelete, publicKey = '' } = payload;
	const currentPubkyName = useSelector((state: RootState) => getPubkyName(state, publicKey));
	// Preserve the original name while loading/deleting
	const pubkyName = useRef(currentPubkyName).current;

	const closeSheet = useCallback((): void => {
		SheetManager.hide('delete-pubky').then();
	}, []);

	return (
		<Sheet
			id="delete-pubky"
			title={t('pubky.deletePubky')}
			gradientType="brand"
		>
			<Text style={styles.message}>{t('pubky.deleteConfirm')}</Text>
			<PubkyCard
				name={pubkyName}
				publicKey={publicKey}
				containerStyle={styles.pubkyContainer}
				nameStyle={styles.pubkyName}
				avatarSize={48}
				avatarStyle={styles.avatarContainer}
			/>
			<View style={styles.imageContainer}>
				<Image source={require('../images/trash.png')} style={styles.image} />
			</View>
			<View style={styles.buttonContainer}>
				<Button text={t('common.cancel')} size="large" onPress={closeSheet} />
				<Button text={t('common.delete')} size="large" variant="secondary" onPress={onDelete} />
			</View>
		</Sheet>
	);
};

const styles = StyleSheet.create({
	message: {
		...textStyles.bodyM,
		marginBottom: 24,
	},
	pubkyContainer: {
		padding: 24,
	},
	avatarContainer: {
		width: 48,
		height: 48,
		borderRadius: 24,
		marginRight: 16,
	},
	pubkyName: {
		...textStyles.heading,
		marginBottom: 2,
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

export default memo(DeletePubky);

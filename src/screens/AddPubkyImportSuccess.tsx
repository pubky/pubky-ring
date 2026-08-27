import React, { memo, ReactElement, useCallback, useMemo } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { getAllPubkys, getPubky, getPubkyCount } from '../store/selectors/pubkySelectors.ts';
import { RootState } from '../store';
import { SheetScreen } from '../components/Sheet.tsx';
import PubkyProfile from '../components/PubkyProfile.tsx';
import { TextBaseM } from '../theme/typography.ts';
import Button from '../components/Button.tsx';
import { hideSheet, resetRootToHome, resetRootToHomeWithSheet } from '../sheets/sheetNavigation.tsx';
import type { AddPubkyStackParamList } from '../sheets/types.ts';
import PubkyCard from '../components/PubkyCard.tsx';
import { defaultPubkyState } from '../store/shapes/pubky.ts';
import { usePubkyHandlers } from '../hooks/usePubkyHandlers.ts';

const SHEET_ID = 'add-pubky';

const AddPubkyImportSuccess = ({
	route,
}: NativeStackScreenProps<AddPubkyStackParamList, 'ImportSuccess'>): ReactElement => {
	const { t } = useTranslation();
	const { onPubkyPress } = usePubkyHandlers();
	const pubkyCount = useSelector(getPubkyCount);
	const { params } = route;
	const isMigration = params.isMigration === true;
	const pubky = isMigration ? '' : params.pubky;
	const isNewPubky = isMigration ? false : params.isNewPubky;
	const pubkyData = useSelector((state: RootState) => (isMigration ? undefined : getPubky(state, pubky)));
	const allPubkys = useSelector(getAllPubkys);

	const onContinue = useCallback((): void => {
		if (isNewPubky) {
			resetRootToHomeWithSheet('edit-pubky', { pubky });
			return;
		}

		resetRootToHome();
	}, [isNewPubky, pubky]);

	const onMigrationPubkyPress = useCallback(
		(migratedPubky: string, index: number): void => {
			hideSheet(SHEET_ID);
			onPubkyPress(migratedPubky, index);
		},
		[onPubkyPress],
	);

	const modalTitle = isMigration || isNewPubky ? t('import.pubkyImported') : t('import.pubkyReImported');
	const description = useMemo(() => {
		if (isMigration) {
			const importedCount = params.pubkys.length;
			const failedCount = params.failedCount ?? Math.max(params.totalCount - importedCount, 0);
			if (failedCount > 0) {
				return t('migrate.importPartialSuccess', {
					imported: importedCount,
					total: params.totalCount,
				});
			}
			return t('migrate.importSuccess', { count: importedCount });
		}

		return !isNewPubky ? t('import.reImportSuccess') : t('import.importSuccess');
	}, [isMigration, isNewPubky, params, t]);

	const data = useMemo(() => {
		const resolvedPubkyData = pubkyData ?? defaultPubkyState;
		return {
			...resolvedPubkyData,
			pubky,
			name: resolvedPubkyData.name || `pubky #${pubkyCount}`,
		};
	}, [pubky, pubkyCount, pubkyData]);

	const migrationPubkys = useMemo(() => {
		if (!isMigration) {
			return [];
		}

		return params.pubkys.map((migratedPubky, index) => {
			const migratedPubkyData = allPubkys[migratedPubky];
			return {
				pubky: migratedPubky,
				name: migratedPubkyData?.name || `pubky #${index + 1}`,
			};
		});
	}, [allPubkys, isMigration, params]);

	return (
		<SheetScreen id={SHEET_ID} title={modalTitle} titleTestID="import-success-title" gradientType="brand">
			<TextBaseM style={styles.message}>{description}</TextBaseM>

			{isMigration ? (
				<ScrollView style={styles.migrationList} contentContainerStyle={styles.migrationListContent}>
					{migrationPubkys.map(({ pubky: migratedPubky, name }, index) => (
						<TouchableOpacity
							key={migratedPubky}
							style={styles.migrationCard}
							activeOpacity={0.7}
							onPress={() => onMigrationPubkyPress(migratedPubky, index)}
						>
							<PubkyCard publicKey={migratedPubky} name={name} showChevron />
						</TouchableOpacity>
					))}
				</ScrollView>
			) : (
				<PubkyProfile pubky={pubky} pubkyData={data} />
			)}

			<View style={styles.footer}>
				<Button
					text={t('common.continue')}
					variant="secondary"
					size="large"
					testID="ImportSuccessButton"
					onPress={onContinue}
				/>
			</View>
		</SheetScreen>
	);
};

const styles = StyleSheet.create({
	message: {
		marginBottom: 24,
	},
	migrationList: {
		flex: 1,
	},
	migrationListContent: {
		paddingBottom: 24,
	},
	migrationCard: {
		marginBottom: 16,
	},
	footer: {
		marginTop: 'auto',
		flexDirection: 'row',
		alignItems: 'center',
	},
});

export default memo(AddPubkyImportSuccess);

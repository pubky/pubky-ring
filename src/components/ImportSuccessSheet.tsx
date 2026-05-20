import React, { memo, ReactElement, useCallback, useMemo } from 'react';
import { SheetManager } from 'react-native-actions-sheet';
import { useSelector } from 'react-redux';
import PubkyReview from './PubkySetup/PubkyReview.tsx';
import { getPubky, getPubkyCount } from '../store/selectors/pubkySelectors.ts';
import { RootState } from '../store';
import { useTranslation } from 'react-i18next';
import Sheet from './Sheet.tsx';
import { SHEET_TRANSITION_DELAY } from '../utils/constants.ts';

interface ImportSuccessSheetPayload {
	modalTitle?: string;
	description?: string;
	isNewPubky?: boolean;
	pubky: string;
	onContinue?: () => void;
}

const ImportSuccessSheet = ({ payload }: { payload: ImportSuccessSheetPayload }): ReactElement => {
	const { t } = useTranslation();
	const pubkyCount = useSelector(getPubkyCount);
	const {
		modalTitle: payloadModalTitle,
		description: payloadDescription,
		isNewPubky = false,
		onContinue: onContinuePayload,
		pubky,
	} = payload;

	const pubkyData = useSelector((state: RootState) => getPubky(state, pubky));

	const onContinue = useCallback(async (): Promise<void> => {
		await SheetManager.hide('import-success');
		if (!isNewPubky) {
			// If re-imported, just return to avoid going back to the setup flow
			return;
		}
		setTimeout(() => {
			onContinuePayload?.();
		}, SHEET_TRANSITION_DELAY);
	}, [isNewPubky, onContinuePayload]);

	const modalTitle = !isNewPubky
		? t('import.pubkyReImported')
		: (payloadModalTitle ?? t('import.pubkyImported'));
	const description = !isNewPubky
		? t('import.reImportSuccess')
		: (payloadDescription ?? t('import.importSuccess'));

	const data = useMemo(() => {
		return { ...pubkyData, pubky, name: pubkyData.name || `pubky #${pubkyCount}` };
	}, [pubky, pubkyCount, pubkyData]);

	return (
		<Sheet id="import-success" title={modalTitle} gradientType="brand">
			<PubkyReview description={description} pubky={pubky} pubkyData={data} onContinue={onContinue} />
		</Sheet>
	);
};

export default memo(ImportSuccessSheet);

import React, {
	memo,
	ReactElement,
	useCallback,
	useMemo,
} from 'react';
import {
	Platform,
	StyleSheet,
} from 'react-native';
import {
	View,
	ActionSheetContainer,
} from '../theme/components.ts';
import { SheetManager } from 'react-native-actions-sheet';
import { useSelector } from 'react-redux';
import { getNavigationAnimation } from '../store/selectors/settingsSelectors.ts';
import absoluteFillObject = StyleSheet.absoluteFillObject;
import { Pubky } from "../types/pubky.ts";
import PubkyReview from "./PubkySetup/PubkyReview.tsx";
import { getPubky, getPubkyCount } from "../store/selectors/pubkySelectors.ts";
import { RootState } from "../store";
import { ACTION_SHEET_HEIGHT } from '../utils/constants.ts';

const ImportSuccessSheet = ({ payload }: {
    payload: {
        modalTitle?: string;
        description?: string;
		isNewPubky?: boolean;
        pubky: string;
        data?: Pubky;
        onContinue?: () => void;
    };
}): ReactElement => {
	const navigationAnimation = useSelector(getNavigationAnimation);
	const pubkyCount = useSelector(getPubkyCount);
	const pubky = useMemo(() => payload?.pubky ?? '', [payload?.pubky]);
	const isNewPubky = useMemo(() => payload?.isNewPubky ?? false, [payload?.isNewPubky]);
	const onContinue = useCallback(async (): Promise<void> => {
		try {
			await SheetManager.hide('import-success');
			if (!isNewPubky) {
				// If re-imported, just return to avoid going back to the setup flow
				return;
			}
			setTimeout(() => {
				payload.onContinue?.();
			}, 200);
		} catch {}
	}, [isNewPubky, payload]);

	const pubkyData = useSelector((state: RootState) => getPubky(state, pubky));

	const modalTitle = useMemo(() => {
		if (!isNewPubky) {
			return 'Pubky Re-Imported';
		}
		return payload?.modalTitle ?? 'Pubky Imported';
	}, [isNewPubky, payload?.modalTitle]);
	const description = useMemo(() => {
		if (!isNewPubky) {
			return 'You successfully re-imported your Pubky.';
		}
		return payload?.description ?? 'You successfully imported your Pubky.';
	}, [isNewPubky, payload?.description]);

	const data = useMemo(() => {
		return { ...pubkyData, pubky, name: pubkyData.name || `pubky #${pubkyCount}` };
	}, [pubky, pubkyCount, pubkyData]);

	return (
		<View style={styles.container}>
			<ActionSheetContainer
				id="import-success"
				navigationAnimation={navigationAnimation}
				keyboardHandlerEnabled={Platform.OS === 'ios'}
				//isModal={Platform.OS === 'ios'}
				CustomHeaderComponent={<></>}
				height={ACTION_SHEET_HEIGHT}
			>
				<View style={styles.fullSize}>
					<PubkyReview
						modalTitle={modalTitle}
						description={description}
						pubky={pubky}
						pubkyData={data}
						onContinue={onContinue}
						authorizeButtonStyle={styles.authorizeButton}
					/>
				</View>
			</ActionSheetContainer>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		...absoluteFillObject,
		backgroundColor: 'transparent',
		height: '100%',
		width: '100%',
		zIndex: 100,
	},
	fullSize: {
		height: '100%',
		width: '100%',
	},
	authorizeButton: {
		borderWidth: 0
	}
});

export default memo(ImportSuccessSheet);

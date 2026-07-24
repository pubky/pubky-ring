import React, { memo, ReactElement, useCallback } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AddPubkyStackParamList } from '../sheets/types.ts';
import RecoveryFilePassphraseScreen from './RecoveryFilePassphraseScreen.tsx';

const AddPubkyImportFileScreen = ({
	navigation,
	route,
}: NativeStackScreenProps<AddPubkyStackParamList, 'ImportFileScreen'>): ReactElement => {
	const handleImportSuccess = useCallback(
		(pubky: string, isNewPubky: boolean): void => {
			navigation.navigate('ImportSuccess', { pubky, isNewPubky });
		},
		[navigation],
	);

	return (
		<RecoveryFilePassphraseScreen
			sheetId="add-pubky"
			promptPayload={{ mode: 'import', ...route.params }}
			onImportSuccess={handleImportSuccess}
		/>
	);
};

export default memo(AddPubkyImportFileScreen);

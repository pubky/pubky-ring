import React, { memo, ReactElement, useCallback } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { hideSheet } from '../sheets/sheetNavigation.tsx';
import type { BackupStackParamList } from '../sheets/types.ts';
import RecoveryFilePassphraseScreen from './RecoveryFilePassphraseScreen.tsx';

const BackupFileScreen = ({
	route,
}: NativeStackScreenProps<BackupStackParamList, 'BackupFileScreen'>): ReactElement => {
	const handleImportSuccess = useCallback((): void => {
		hideSheet('backup');
	}, []);

	return (
		<RecoveryFilePassphraseScreen
			promptPayload={{ mode: 'backup', ...route.params }}
			sheetId="backup"
			onImportSuccess={handleImportSuccess}
		/>
	);
};

export default memo(BackupFileScreen);

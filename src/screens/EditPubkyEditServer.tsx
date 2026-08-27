import React, { memo, ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import ServerForm from '../components/EditPubky/ServerForm.tsx';
import type { EditPubkyStackParamList } from '../sheets/types.ts';

const EditPubkyEditServer = ({
	navigation,
	route,
}: NativeStackScreenProps<EditPubkyStackParamList, 'EditServer'>): ReactElement => {
	const { t } = useTranslation();

	return (
		<ServerForm
			title={t('editServer.title')}
			initialServer={route.params}
			testIDPrefix="EditServer"
			onBackPress={navigation.goBack}
		/>
	);
};

export default memo(EditPubkyEditServer);

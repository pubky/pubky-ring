import React, { memo, ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import ServerForm from '../components/EditPubky/ServerForm.tsx';
import type { EditPubkyStackParamList } from '../sheets/types.ts';

const EditPubkyAddServer = ({
	navigation,
}: NativeStackScreenProps<EditPubkyStackParamList, 'AddServer'>): ReactElement => {
	const { t } = useTranslation();

	return <ServerForm title={t('addServer.title')} testIDPrefix="AddServer" onBackPress={navigation.goBack} />;
};

export default memo(EditPubkyAddServer);

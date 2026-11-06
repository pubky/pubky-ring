import React, { ReactElement } from 'react';
import { StyleSheet, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import AppHeader, { HEADER_HEIGHT } from '../components/AppHeader';
import SafeAreaView from '../components/SafeAreaView';
import ServerForm from '../components/EditPubky/ServerForm';
import type { RootStackParamList } from '../navigation/types';

const HomeserverFormScreen = ({
	route,
	navigation,
}: NativeStackScreenProps<RootStackParamList, 'HomeserverForm'>): ReactElement => {
	const { t } = useTranslation();
	const server = route.params?.server;
	return (
		<SafeAreaView style={styles.root} edges={['bottom']}>
			<AppHeader title={t(server ? 'editServer.title' : 'addServer.title')} />
			<View style={styles.content}>
				<ServerForm initialServer={server} onCancel={navigation.goBack} onSaved={() => navigation.goBack()} />
			</View>
		</SafeAreaView>
	);
};
const styles = StyleSheet.create({
	root: { flex: 1 },
	content: { flex: 1, paddingTop: HEADER_HEIGHT + 24, paddingHorizontal: 24 },
});
export default HomeserverFormScreen;

import React, { ReactElement } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import AppHeader, { HEADER_HEIGHT } from '../components/AppHeader';
import SafeAreaInset from '../components/SafeAreaInset';
import Button from '../components/Button';
import ServerCard from '../components/ServerCard';
import { Pencil, Trash2 } from '../icons';
import { TextSmM } from '../theme/typography';
import { getAllPubkys, getHomeservers, getPreferredHomeserver } from '../store/selectors/pubkySelectors';
import { removeHomeserver } from '../store/slices/pubkysSlice';
import { defaultHomeserver } from '../store/shapes/pubky';
import { homeserverUseCount } from '../utils/homeservers';
import type { RootStackParamList } from '../navigation/types';

const HomeserversScreen = ({
	navigation,
}: NativeStackScreenProps<RootStackParamList, 'Homeservers'>): ReactElement => {
	const { t } = useTranslation();
	const dispatch = useDispatch();
	const servers = useSelector(getHomeservers);
	const pubkys = useSelector(getAllPubkys);
	const preferred = useSelector(getPreferredHomeserver);
	return (
		<View style={styles.root}>
			<AppHeader title={t('homeservers.title')} />
			<ScrollView contentContainerStyle={styles.content}>
				<TextSmM>{t('homeservers.description')}</TextSmM>
				{servers.map(server => {
					const used = homeserverUseCount(pubkys, server.publicKey);
					const builtin = server.publicKey === defaultHomeserver.publicKey;
					const isDefault = server.publicKey === preferred;
					return (
						<View key={server.publicKey} style={styles.server}>
							<ServerCard
								name={isDefault ? t('selectServer.defaultName', { name: server.name }) : server.name}
								publicKey={server.publicKey}
								headerRight={
									<View style={styles.actions}>
										<TouchableOpacity
											style={styles.iconAction}
											accessibilityRole="button"
											accessibilityLabel={t('common.edit')}
											testID={`HomeserverRename-${server.publicKey}`}
											onPress={() => navigation.navigate('HomeserverForm', { server })}
										>
											<Pencil size={20} />
										</TouchableOpacity>
										{!builtin && (
											<TouchableOpacity
												style={[styles.iconAction, used > 0 && styles.disabledAction]}
												accessibilityRole="button"
												accessibilityLabel={t('homeservers.remove')}
												disabled={used > 0}
												testID={`HomeserverRemove-${server.publicKey}`}
												onPress={() => dispatch(removeHomeserver(server.publicKey))}
											>
												<Trash2 size={20} />
											</TouchableOpacity>
										)}
									</View>
								}
							/>
							{used > 0 && <TextSmM>{t('homeservers.usedBy', { count: used })}</TextSmM>}
							{!builtin && used > 0 && (
								<TextSmM colorName="mutedForeground">{t('homeservers.inUse')}</TextSmM>
							)}
						</View>
					);
				})}
				<Button
					text={t('selectServer.addButton')}
					testID="HomeserversAddButton"
					onPress={() => navigation.navigate('HomeserverForm')}
				/>
				<SafeAreaInset edge="bottom" />
			</ScrollView>
		</View>
	);
};
const styles = StyleSheet.create({
	root: { flex: 1 },
	content: { flexGrow: 1, paddingTop: HEADER_HEIGHT + 24, paddingHorizontal: 24, gap: 24 },
	server: { gap: 12 },
	actions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
	iconAction: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
	disabledAction: { opacity: 0.32 },
});
export default HomeserversScreen;

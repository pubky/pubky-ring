import React, { memo, ReactElement, useEffect } from 'react';
import { Alert, StyleSheet, TouchableOpacity, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { showToast } from '@synonymdev/react-native-toast';
import Button from '../components/Button';
import { SheetScreen } from '../components/Sheet';
import { usePkdnsRecords } from '../components/EditPubky/PkdnsRecordsContext';
import { Trash2 } from '../icons';
import { ActivityIndicator } from '../theme/components';
import { TextSmB, TextSmM, TextXsM } from '../theme/typography';
import { getIsOnline } from '../store/selectors/settingsSelectors';
import { getPubky } from '../store/selectors/pubkySelectors';
import type { RootState } from '../types';
import { formatTtl, isSameRecord, PKDNS_PACKET_LIMIT, PkdnsRecord } from '../utils/pkdnsRecords';
import type { PkdnsError } from '../utils/pkdns';
import type { EditPubkyStackParamList } from '../sheets/types';

/** Show how full the packet is once it is this close to the limit. */
const PACKET_USAGE_NOTICE_THRESHOLD = 0.75;

const recordKey = (record: PkdnsRecord): string =>
	`${record.name}|${record.type}|${record.value}|${record.priority ?? ''}`;

const EditPubkyPkdnsRecords = ({
	navigation,
	route,
}: NativeStackScreenProps<EditPubkyStackParamList, 'PkdnsRecords'>): ReactElement => {
	const { t } = useTranslation();
	const isOnline = useSelector(getIsOnline);
	const hasHomeserver = useSelector((state: RootState) =>
		Boolean(getPubky(state, route.params.pubky)?.homeserver),
	);
	const { status, snapshot, loadError, deleting, load, deleteRecord } = usePkdnsRecords();

	useEffect(() => {
		if (status === 'idle') load();
	}, [status, load]);

	const errorMessage = (error: PkdnsError): string => t(`pkdns.errors.${error.code}`);

	// Without the packet the homeserver record lives in, an edit could replace it.
	const missingPacket = status === 'ready' && snapshot?.found === false && hasHomeserver;
	const packetSize = snapshot?.packetSize ?? 0;
	const canEdit = isOnline && status === 'ready' && !missingPacket && !deleting;

	const confirmDelete = (record: PkdnsRecord): void => {
		Alert.alert(
			t('pkdns.deleteTitle'),
			t('pkdns.deleteMessage', { name: record.name, type: record.type, value: record.value }),
			[
				{ text: t('common.cancel'), style: 'cancel' },
				{
					text: t('common.delete'),
					style: 'destructive',
					onPress: async (): Promise<void> => {
						const res = await deleteRecord(record);
						if (res.isErr()) {
							showToast({
								type: 'error',
								title: t('pkdns.errorTitle'),
								description: errorMessage(res.error as PkdnsError),
							});
						}
					},
				},
			],
		);
	};

	const renderContent = (): ReactElement | null => {
		if (status === 'idle' || status === 'loading') {
			return (
				<View style={styles.centered}>
					<ActivityIndicator testID="PkdnsRecordsLoading" />
				</View>
			);
		}
		if (status === 'error' && loadError) {
			return (
				<View style={styles.notice}>
					<TextSmM accessibilityRole="alert" colorName="danger">
						{errorMessage(loadError)}
					</TextSmM>
					<Button
						text={t('common.retry')}
						size="small"
						style={styles.inlineButton}
						variant="secondary"
						disabled={!isOnline}
						testID="PkdnsRecordsRetryButton"
						onPress={load}
					/>
				</View>
			);
		}
		if (missingPacket) {
			return (
				<TextSmM accessibilityRole="alert" colorName="danger" style={styles.notice}>
					{t('pkdns.errors.notFound')}
				</TextSmM>
			);
		}
		const records = snapshot?.records ?? [];
		if (records.length === 0) {
			return (
				<TextSmM colorName="mutedForeground" style={styles.notice} testID="PkdnsRecordsEmpty">
					{t('pkdns.empty')}
				</TextSmM>
			);
		}
		return (
			<View>
				<View style={styles.row}>
					<TextXsM style={[styles.nameColumn, styles.heading]}>{t('pkdns.columnName')}</TextXsM>
					<TextXsM style={[styles.typeColumn, styles.heading]}>{t('pkdns.columnType')}</TextXsM>
					<TextXsM style={[styles.ttlColumn, styles.heading]}>{t('pkdns.columnTtl')}</TextXsM>
					<TextXsM style={[styles.valueColumn, styles.heading]}>{t('pkdns.columnValue')}</TextXsM>
					<View style={styles.iconColumn} />
				</View>
				{records.map(record => {
					const key = recordKey(record);
					const isDeleting = deleting !== undefined && isSameRecord(deleting, record);
					const value = record.type === 'MX' ? `${record.priority} ${record.value}` : record.value;
					return (
						<View key={key} style={[styles.row, styles.recordRow]} testID={`PkdnsRecord-${key}`}>
							<TextSmB style={styles.nameColumn} numberOfLines={1} ellipsizeMode="middle">
								{record.name}
							</TextSmB>
							<TextSmB style={styles.typeColumn}>{record.type}</TextSmB>
							<TextSmB style={styles.ttlColumn}>{formatTtl(record.ttl)}</TextSmB>
							<TextSmB style={styles.valueColumn} numberOfLines={2} ellipsizeMode="middle">
								{value}
							</TextSmB>
							<View style={styles.iconColumn}>
								{isDeleting ? (
									<ActivityIndicator size="small" />
								) : (
									<TouchableOpacity
										style={!canEdit && styles.disabled}
										disabled={!canEdit}
										accessibilityRole="button"
										accessibilityLabel={t('pkdns.deleteRecordLabel', {
											name: record.name,
											type: record.type,
										})}
										hitSlop={8}
										testID={`PkdnsRecordDelete-${key}`}
										onPress={(): void => confirmDelete(record)}
									>
										<Trash2 size={20} />
									</TouchableOpacity>
								)}
							</View>
						</View>
					);
				})}
			</View>
		);
	};

	return (
		<SheetScreen id="edit-pubky" title={t('pkdns.recordsTitle')} scrollable onBackPress={navigation.goBack}>
			<TextXsM style={styles.label}>{t('pkdns.recordsLabel')}</TextXsM>
			{renderContent()}
			{!isOnline && (
				<TextSmM accessibilityRole="alert" colorName="mutedForeground" style={styles.notice}>
					{t('pkdns.offline')}
				</TextSmM>
			)}
			<Button
				text={t('pkdns.addRecord')}
				size="small"
				style={styles.addButton}
				variant="secondary"
				disabled={!canEdit}
				testID="PkdnsAddRecordButton"
				onPress={(): void => navigation.navigate('PkdnsAddRecord', route.params)}
			/>
			{status === 'ready' &&
				!missingPacket &&
				packetSize >= PKDNS_PACKET_LIMIT * PACKET_USAGE_NOTICE_THRESHOLD && (
					<View style={styles.footer}>
						<TextSmM colorName="mutedForeground" testID="PkdnsPacketUsage">
							{t('pkdns.packetUsage', { used: packetSize, limit: PKDNS_PACKET_LIMIT })}
						</TextSmM>
					</View>
				)}
		</SheetScreen>
	);
};

const styles = StyleSheet.create({
	label: { marginBottom: 16 },
	heading: { opacity: 0.5 },
	row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
	recordRow: {
		paddingVertical: 12,
		borderBottomWidth: 1,
		borderBottomColor: 'rgba(255, 255, 255, 0.1)',
	},
	nameColumn: { flex: 1 },
	typeColumn: { width: 54 },
	ttlColumn: { width: 40 },
	valueColumn: { flex: 2 },
	iconColumn: { width: 24, alignItems: 'center' },
	disabled: { opacity: 0.32 },
	centered: { paddingVertical: 24, alignItems: 'center' },
	notice: { marginTop: 8 },
	inlineButton: { alignSelf: 'flex-start', marginTop: 12 },
	addButton: { alignSelf: 'flex-start', marginTop: 24 },
	footer: { marginTop: 'auto', paddingTop: 24, gap: 8 },
});

export default memo(EditPubkyPkdnsRecords);

import React, { memo, ReactElement, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import Button from '../components/Button';
import { SheetScreen } from '../components/Sheet';
import TextField from '../components/TextField';
import SegmentedTabs from '../components/SegmentedTabs';
import { usePkdnsRecords } from '../components/EditPubky/PkdnsRecordsContext';
import { TextSmM, TextXsM } from '../theme/typography';
import { getIsOnline } from '../store/selectors/settingsSelectors';
import {
	DEFAULT_MX_PRIORITY,
	DEFAULT_PKDNS_TTL,
	PKDNS_RECORD_TYPES,
	PKDNS_TTL_OPTIONS,
	PkdnsDraftValidation,
	PkdnsRecordType,
	VALUE_PLACEHOLDERS,
	validateRecordDraft,
} from '../utils/pkdnsRecords';
import type { PkdnsError } from '../utils/pkdns';
import type { EditPubkyStackParamList } from '../sheets/types';

type FieldErrors = Extract<PkdnsDraftValidation, { valid: false }>['errors'];

const TYPE_OPTIONS = PKDNS_RECORD_TYPES.map(type => ({ value: type, label: type }));
const TTL_OPTIONS = PKDNS_TTL_OPTIONS.map(option => ({ value: option.seconds, label: option.label }));

const EditPubkyAddPkdnsRecord = ({
	navigation,
}: NativeStackScreenProps<EditPubkyStackParamList, 'PkdnsAddRecord'>): ReactElement => {
	const { t } = useTranslation();
	const isOnline = useSelector(getIsOnline);
	const { snapshot, addRecord } = usePkdnsRecords();
	const [name, setName] = useState('');
	const [value, setValue] = useState('');
	const [priority, setPriority] = useState(String(DEFAULT_MX_PRIORITY));
	const [type, setType] = useState<PkdnsRecordType>('A');
	const [ttl, setTtl] = useState<number>(DEFAULT_PKDNS_TTL);
	const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
	const [publishError, setPublishError] = useState<string>();
	const [publishing, setPublishing] = useState(false);

	const clearErrors = (field?: keyof FieldErrors): void => {
		setPublishError(undefined);
		setFieldErrors(current => (field ? { ...current, [field]: undefined } : {}));
	};

	const fieldError = (field: keyof FieldErrors): string | undefined => {
		const key = fieldErrors[field];
		return key ? t(`pkdns.fieldErrors.${key}`) : undefined;
	};

	const handlePublish = async (): Promise<void> => {
		const validation = validateRecordDraft({ name, type, ttl, value, priority }, snapshot?.records ?? []);
		if (!validation.valid) {
			setFieldErrors(validation.errors);
			return;
		}
		setPublishing(true);
		setPublishError(undefined);
		const res = await addRecord(validation.record);
		setPublishing(false);
		if (res.isErr()) {
			setPublishError(t(`pkdns.errors.${(res.error as PkdnsError).code}`));
			return;
		}
		navigation.goBack();
	};

	return (
		<SheetScreen id="edit-pubky" title={t('pkdns.addTitle')} scrollable onBackPress={navigation.goBack}>
			<View style={styles.section}>
				<TextXsM>{t('pkdns.nameLabel')}</TextXsM>
				<TextField
					testID="PkdnsRecordNameInput"
					containerStyle={styles.input}
					value={name}
					placeholder={t('pkdns.namePlaceholder')}
					error={fieldError('name')}
					editable={!publishing}
					autoCapitalize="none"
					autoCorrect={false}
					returnKeyType="next"
					onChangeText={(text): void => {
						setName(text);
						clearErrors('name');
					}}
				/>
			</View>
			<View style={styles.section}>
				<TextXsM>{t('pkdns.valueLabel')}</TextXsM>
				<TextField
					testID="PkdnsRecordValueInput"
					containerStyle={styles.input}
					value={value}
					placeholder={VALUE_PLACEHOLDERS[type]}
					error={fieldError('value')}
					editable={!publishing}
					autoCapitalize="none"
					autoCorrect={false}
					keyboardType={type === 'A' ? 'numbers-and-punctuation' : 'default'}
					returnKeyType="done"
					onChangeText={(text): void => {
						setValue(text);
						clearErrors('value');
					}}
				/>
			</View>
			<View style={styles.section}>
				<TextXsM>{t('pkdns.typeLabel')}</TextXsM>
				<SegmentedTabs
					style={styles.tabs}
					options={TYPE_OPTIONS}
					value={type}
					disabled={publishing}
					accessibilityLabel={t('pkdns.typeLabel')}
					testID="PkdnsRecordType"
					onChange={(next): void => {
						setType(next);
						clearErrors();
					}}
				/>
			</View>
			{type === 'MX' && (
				<View style={styles.section}>
					<TextXsM>{t('pkdns.priorityLabel')}</TextXsM>
					<TextField
						testID="PkdnsRecordPriorityInput"
						containerStyle={styles.input}
						value={priority}
						error={fieldError('priority')}
						editable={!publishing}
						keyboardType="number-pad"
						maxLength={5}
						onChangeText={(text): void => {
							setPriority(text);
							clearErrors('priority');
						}}
					/>
				</View>
			)}
			<View style={styles.section}>
				<TextXsM>{t('pkdns.ttlLabel')}</TextXsM>
				<SegmentedTabs
					style={styles.tabs}
					options={TTL_OPTIONS}
					value={ttl}
					disabled={publishing}
					accessibilityLabel={t('pkdns.ttlLabel')}
					testID="PkdnsRecordTtl"
					onChange={setTtl}
				/>
			</View>
			<View style={styles.footer}>
				{(publishError || !isOnline) && (
					<TextSmM accessibilityRole="alert" colorName="danger" style={styles.notice}>
						{publishError ?? t('pkdns.offline')}
					</TextSmM>
				)}
				<View style={styles.buttons}>
					<Button
						text={t('common.cancel')}
						size="large"
						disabled={publishing}
						testID="PkdnsAddRecordCancelButton"
						onPress={navigation.goBack}
					/>
					<Button
						text={t('pkdns.publish')}
						size="large"
						variant="secondary"
						loading={publishing}
						disabled={!isOnline || publishing}
						testID="PkdnsAddRecordPublishButton"
						onPress={handlePublish}
					/>
				</View>
			</View>
		</SheetScreen>
	);
};

const styles = StyleSheet.create({
	section: { marginBottom: 24 },
	input: { marginTop: 8 },
	tabs: { marginTop: 4 },
	footer: { marginTop: 'auto' },
	notice: { marginBottom: 16 },
	buttons: { flexDirection: 'row', gap: 16 },
});

export default memo(EditPubkyAddPkdnsRecord);

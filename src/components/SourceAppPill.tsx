import React, { memo, ReactElement } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { useTranslation } from 'react-i18next';
import { TextXsSb } from '../theme/typography';
import { shadows } from '../theme/shadows.ts';

/** Marks a pubky that is owned by another app. */
const SourceAppPill = ({ style }: { style?: StyleProp<ViewStyle> }): ReactElement => {
	const { t } = useTranslation();

	return (
		<View style={[styles.container, style]}>
			<TextXsSb colorName="orange">{t('sharedPubky.pill')}</TextXsSb>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		justifyContent: 'center',
		backgroundColor: 'rgba(255, 68, 0, 0.32)',
		borderRadius: 16,
		paddingHorizontal: 8,
		height: 20,
		...shadows.sm,
	},
});

export default memo(SourceAppPill);

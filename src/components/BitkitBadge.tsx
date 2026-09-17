import React, { memo, ReactElement } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { useTranslation } from 'react-i18next';
import { TextXsSb } from '../theme/typography';
import { shadows } from '../theme/shadows.ts';

interface BitkitBadgeProps {
	style?: StyleProp<ViewStyle>;
	testID?: string;
}

/**
 * Non-interactive pill marking a pubky whose key stays managed by Bitkit.
 * `pointerEvents="none"` keeps taps flowing through to whatever press target sits behind it.
 */
const BitkitBadge = ({ style, testID = 'BitkitBadge' }: BitkitBadgeProps): ReactElement => {
	const { t } = useTranslation();

	return (
		<View style={[styles.container, style]} pointerEvents="none" testID={testID}>
			<TextXsSb colorName="orange" numberOfLines={1}>
				{t('reuseSharedPubky.badge')}
			</TextXsSb>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: 'rgba(255, 68, 0, 0.32)',
		borderRadius: 16,
		paddingHorizontal: 8,
		height: 20,
		...shadows.sm,
	},
});

export default memo(BitkitBadge);

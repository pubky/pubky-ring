import React, { memo, ReactElement, useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { Text, View } from '../theme/components.ts';
import { useTranslation } from 'react-i18next';

interface AnimatedQRData {
	value: string;
}

interface AnimatedQRProps {
	data: AnimatedQRData[];
	cycleInterval?: number;
	size?: number;
}

const AnimatedQR = ({
	data,
	cycleInterval = 250,
	size = 250,
}: AnimatedQRProps): ReactElement => {
	const { t } = useTranslation();
	const [currentIndex, setCurrentIndex] = useState(0);

	// Cycle through data items
	useEffect(() => {
		if (data.length <= 1) {
			return;
		}

		const interval = setInterval(() => {
			setCurrentIndex(prev => (prev + 1) % data.length);
		}, cycleInterval);

		return (): void => clearInterval(interval);
	}, [data.length, cycleInterval]);

	const currentItem = data[currentIndex];

	return (
		<>
			<View style={styles.qrContainer}>
				<View style={styles.qrBackground}>
					<QRCode
						value={currentItem?.value || 'empty'}
						size={size}
						backgroundColor="#FFFFFF"
					/>
				</View>
			</View>
			<Text style={styles.progressText}>
				{t('settings.keyProgress', { current: currentIndex + 1, total: data.length })}
			</Text>
		</>
	);
};

const styles = StyleSheet.create({
	qrContainer: {
		alignItems: 'center',
		justifyContent: 'center',
		marginBottom: 16,
		backgroundColor: 'transparent',
	},
	qrBackground: {
		backgroundColor: '#FFFFFF',
		padding: 16,
		borderRadius: 16,
	},
	progressText: {
		fontSize: 15,
		fontWeight: '500',
		lineHeight: 20,
		textAlign: 'center',
		color: '#888',
		marginBottom: 16,
	},
});

export default memo(AnimatedQR);

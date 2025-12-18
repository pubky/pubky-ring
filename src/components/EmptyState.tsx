import React, { ReactElement, memo } from 'react';
import { StyleSheet } from 'react-native';
import { View, Text } from '../theme/components.ts';
import { Canvas, Path, Skia, StrokeCap, StrokeJoin } from '@shopify/react-native-skia';
import { useTranslation } from 'react-i18next';

const ARROW_COLOR = '#0085FF';

const DashedArrow = (): ReactElement => {
	// Curve rotated 45° clockwise - now goes top-left to bottom-right
	const curvePath = Skia.Path.Make();
	curvePath.moveTo(5, 0);
	curvePath.quadTo(5, 45, 55, 85);

	// Arrowhead chevron pointing down-right
	const arrowPath = Skia.Path.Make();
	arrowPath.moveTo(47, 90); //Left tip
	arrowPath.lineTo(59, 87); // Middle tip
	arrowPath.lineTo(57, 75); //Right tip

	// Dashed line paint
	const dashedPaint = Skia.Paint();
	dashedPaint.setColor(Skia.Color(ARROW_COLOR));
	dashedPaint.setStyle(1);
	dashedPaint.setStrokeWidth(3);
	dashedPaint.setStrokeCap(StrokeCap.Round);
	dashedPaint.setPathEffect(Skia.PathEffect.MakeDash([2, 8], 5));

	// Solid arrow head paint
	const solidPaint = Skia.Paint();
	solidPaint.setColor(Skia.Color(ARROW_COLOR));
	solidPaint.setStyle(1);
	solidPaint.setStrokeWidth(3);
	solidPaint.setStrokeCap(StrokeCap.Round);
	solidPaint.setStrokeJoin(StrokeJoin.Round);

	return (
		<View style={styles.arrowContainer}>
			<Canvas style={{ width: 80, height: 100 }}>
				<Path path={curvePath} paint={dashedPaint} />
				<Path path={arrowPath} paint={solidPaint} />
			</Canvas>
		</View>
	);
};

const EmptyState = (): ReactElement => {
	const { t } = useTranslation();

	return (
		<View style={styles.container}>
			<View style={styles.content}>
				<Text style={styles.heading}>{t('emptyState.heading')}</Text>
				<Text style={styles.description}>{t('emptyState.description')}</Text>
				<DashedArrow />
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		justifyContent: 'flex-end',
		backgroundColor: 'transparent',
	},
	content: {
		alignItems: 'flex-start',
		paddingHorizontal: 24,
		paddingBottom: 0,
		backgroundColor: 'transparent',
	},
	heading: {
		fontSize: 48,
		fontWeight: '700',
		lineHeight: 52,
		marginBottom: 12,
	},
	description: {
		fontSize: 17,
		fontWeight: '400',
		lineHeight: 24,
		opacity: 0.7,
	},
	arrowContainer: {
		alignSelf: 'center',
		marginTop: 5,
		backgroundColor: 'transparent',
	},
});

export default memo(EmptyState);

import React, { ReactElement, memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Canvas, Path, Skia, StrokeCap, StrokeJoin } from '@shopify/react-native-skia';
import { useTranslation } from 'react-i18next';
import { DisplayText } from '../theme/typography';
import { accentColors } from '../theme/index.ts';

const DashedArrow = (): ReactElement => {
	// Curve rotated 45° clockwise - now goes top-left to bottom-right
	const curvePath = Skia.Path.Make();
	curvePath.moveTo(4, 0);
	curvePath.quadTo(4, 32, 39, 60);

	// Arrowhead chevron pointing down-right
	const arrowPath = Skia.Path.Make();
	arrowPath.moveTo(33, 64); // Left tip
	arrowPath.lineTo(42, 62); // Middle tip
	arrowPath.lineTo(40, 53); // Right tip

	// Dashed line paint
	const dashedPaint = Skia.Paint();
	dashedPaint.setColor(Skia.Color(accentColors.pubkyRing));
	dashedPaint.setStyle(1);
	dashedPaint.setStrokeWidth(2);
	dashedPaint.setStrokeCap(StrokeCap.Round);
	dashedPaint.setPathEffect(Skia.PathEffect.MakeDash([4, 6], 1));

	// Solid arrow head paint
	const solidPaint = Skia.Paint();
	solidPaint.setColor(Skia.Color(accentColors.pubkyRing));
	solidPaint.setStyle(1);
	solidPaint.setStrokeWidth(2);
	solidPaint.setStrokeCap(StrokeCap.Round);
	solidPaint.setStrokeJoin(StrokeJoin.Round);

	return (
		<Canvas style={styles.canvas}>
			<Path path={curvePath} paint={dashedPaint} />
			<Path path={arrowPath} paint={solidPaint} />
		</Canvas>
	);
};

const EmptyState = (): ReactElement => {
	const { t } = useTranslation();

	return (
		<View style={styles.container}>
			<DisplayText>{t('emptyState.heading')}</DisplayText>
			<DashedArrow />
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		justifyContent: 'flex-end',
		paddingHorizontal: 24,
	},
	canvas: {
		width: 56,
		height: 70,
		marginVertical: 20,
		marginLeft: 60,
	},
});

export default memo(EmptyState);

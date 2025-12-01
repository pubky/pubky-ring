import React, { memo, ReactElement } from 'react';
import { View, StyleSheet } from 'react-native';
import {
	Canvas,
	Path,
	Skia,
	DashPathEffect,
	SkPath,
} from '@shopify/react-native-skia';

interface DashedBorderProps {
	children: React.ReactNode;
	borderColor?: string;
	borderWidth?: number;
	borderRadius?: number;
	dashWidth?: number;
	dashGap?: number;
	style?: any;
}

const DashedBorder = ({
	children,
	borderColor = 'rgba(173, 255, 47, 0.3)',
	borderWidth = 2,
	borderRadius = 12,
	dashWidth = 4,
	dashGap = 4,
	style,
}: DashedBorderProps): ReactElement => {
	// Create the rounded rectangle path
	const createPath = (width: number, height: number): SkPath => {
		const path = Skia.Path.Make();
		const halfBorder = borderWidth / 2;

		// Create rounded rectangle path
		path.addRRect({
			rect: {
				x: halfBorder,
				y: halfBorder,
				width: width - borderWidth,
				height: height - borderRadius,
			},
			rx: borderRadius,
			ry: borderRadius,
		});

		return path;
	};

	const [dimensions, setDimensions] = React.useState({ width: 0, height: 0 });

	return (
		<View
			style={[styles.container, style]}
			onLayout={(e) => {
				const { width, height } = e.nativeEvent.layout;
				setDimensions({ width, height });
			}}
		>
			{dimensions.width > 0 && dimensions.height > 0 && (
				<Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
					<Path
						path={createPath(dimensions.width, dimensions.height)}
						color={borderColor}
						style="stroke"
						strokeWidth={borderWidth}
					>
						<DashPathEffect intervals={[dashWidth, dashGap]} />
					</Path>
				</Canvas>
			)}
			{children}
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		position: 'relative',
	},
});

export default memo(DashedBorder);

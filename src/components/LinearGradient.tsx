import React, { memo, useCallback, useMemo } from 'react';
import { View, StyleSheet, ViewStyle, StyleProp, LayoutChangeEvent } from 'react-native';
import {
	Canvas,
	LinearGradient as SkiaLinearGradient,
	RadialGradient as SkiaRadialGradient,
	vec,
	Rect,
} from '@shopify/react-native-skia';

interface Point {
	x: number;
	y: number;
}

interface GradientBaseProps {
	colors?: string[];
	style?: StyleProp<ViewStyle>;
	children?: React.ReactNode;
	positions?: number[];
}

interface LinearGradientProps extends GradientBaseProps {
	start?: Point;
	end?: Point;
}

interface RadialGradientProps extends GradientBaseProps {
	center?: Point;
	radius?: number;
}

const GradientCanvas = memo(({ children }: { children: React.ReactNode }) => (
	<Canvas style={StyleSheet.absoluteFillObject}>
		{children}
	</Canvas>
));

const LinearGradient: React.FC<LinearGradientProps> = memo(({
	colors = ['#000000', '#FFFFFF'],
	start = { x: 0.5, y: 0 },
	end = { x: 0.5, y: 1 },
	style,
	children,
	positions,
}: {
	colors?: string[];
	start?: Point;
	end?: Point;
	style?: StyleProp<ViewStyle>;
	children?: React.ReactNode;
	positions?: number[];
}) => {
	const [layout, setLayout] = React.useState({ width: 0, height: 0 });

	const onLayout = useCallback((event: LayoutChangeEvent) => {
		const { width, height } = event.nativeEvent.layout;
		setLayout({ width, height });
	}, []);

	const gradientProps = useMemo(() => {
		if (layout.width === 0 || layout.height === 0) {return null;}

		return {
			startVec: vec(start.x * layout.width, start.y * layout.height),
			endVec: vec(end.x * layout.width, end.y * layout.height),
			gradientPositions: positions || colors.map((_, index) => index / (colors.length - 1)),
			dimensions: { width: layout.width, height: layout.height }
		};
	}, [colors, end.x, end.y, layout.height, layout.width, positions, start.x, start.y]);

	const renderGradient = useCallback(() => {
		if (!gradientProps) {return null;}

		const { startVec, endVec, gradientPositions, dimensions } = gradientProps;

		return (
			<GradientCanvas>
				<Rect x={0} y={0} width={dimensions.width} height={dimensions.height}>
					<SkiaLinearGradient
						start={startVec}
						end={endVec}
						colors={colors}
						positions={gradientPositions}
					/>
				</Rect>
			</GradientCanvas>
		);
	}, [colors, gradientProps]);

	return (
		<View style={[styles.container, style]} onLayout={onLayout}>
			{renderGradient()}
			{children}
		</View>
	);
});

const RadialGradient: React.FC<RadialGradientProps> = memo(({
	colors = ['#000000', '#FFFFFF'],
	center = { x: 0.5, y: 0.5 },
	radius = 1,
	style,
	children,
	positions,
}: {
	colors?: string[];
	center?: Point;
	radius?: number;
	style?: StyleProp<ViewStyle>;
	children?: React.ReactNode;
	positions?: number[];
}) => {
	const [layout, setLayout] = React.useState({ width: 0, height: 0 });

	const onLayout = useCallback((event: LayoutChangeEvent) => {
		const { width, height } = event.nativeEvent.layout;
		setLayout({ width, height });
	}, []);

	const gradientProps = useMemo(() => {
		if (layout.width === 0 || layout.height === 0) {return null;}

		const maxDimension = Math.max(layout.width, layout.height);
		return {
			centerVec: vec(center.x * layout.width, center.y * layout.height),
			radiusValue: radius * (maxDimension / 2),
			gradientPositions: positions || colors.map((_, index) => index / (colors.length - 1)),
			dimensions: { width: layout.width, height: layout.height }
		};
	}, [center.x, center.y, colors, layout.height, layout.width, positions, radius]);

	const renderGradient = useCallback(() => {
		if (!gradientProps) {return null;}

		const { centerVec, radiusValue, gradientPositions, dimensions } = gradientProps;

		return (
			<GradientCanvas>
				<Rect x={0} y={0} width={dimensions.width} height={dimensions.height}>
					<SkiaRadialGradient
						c={centerVec}
						r={radiusValue}
						colors={colors}
						positions={gradientPositions}
					/>
				</Rect>
			</GradientCanvas>
		);
	}, [colors, gradientProps]);

	return (
		<View style={[styles.container, style]} onLayout={onLayout}>
			{renderGradient()}
			{children}
		</View>
	);
});

const styles = StyleSheet.create({
	container: {
		position: 'relative',
		overflow: 'hidden',
		minHeight: 100,
	},
});

export {
	LinearGradient,
	RadialGradient,
	type LinearGradientProps,
	type RadialGradientProps,
};

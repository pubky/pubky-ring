import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import {
	View,
	StyleSheet,
	ViewStyle,
	StyleProp,
	LayoutChangeEvent,
	AppState,
} from 'react-native';
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

const useAppActiveKey = (): number => {
	const [key, setKey] = useState(0);
	useEffect(() => {
		const subscription = AppState.addEventListener('change', (nextAppState) => {
			if (nextAppState === 'active') {
				setKey((prev) => prev + 1);
			}
		});
		return (): void => {
			subscription.remove();
		};
	}, []);
	return key;
};

const LinearGradient: React.FC<LinearGradientProps> = memo(({
	colors = ['#000000', '#FFFFFF'],
	start = { x: 0.5, y: 0 },
	end = { x: 0.5, y: 1 },
	style,
	children,
	positions,
}: LinearGradientProps) => {
	const [size, setSize] = useState({ width: 0, height: 0 });
	const forceUpdate = useAppActiveKey();

	const onLayout = useCallback((event: LayoutChangeEvent) => {
		const { width, height } = event.nativeEvent.layout;
		setSize((prev) =>
			prev.width === width && prev.height === height ? prev : { width, height },
		);
	}, []);

	const gradientPositions = useMemo(
		() => positions || colors.map((_, i) => i / (colors.length - 1)),
		[colors, positions],
	);

	const canvasStyle = useMemo(
		() => [styles.canvas, { width: size.width, height: size.height }],
		[size.width, size.height],
	);

	return (
		<View style={[styles.container, style]} onLayout={onLayout}>
			{size.width > 0 && size.height > 0 && (
				<Canvas key={forceUpdate} style={canvasStyle}>
					<Rect x={0} y={0} width={size.width} height={size.height}>
						<SkiaLinearGradient
							start={vec(start.x * size.width, start.y * size.height)}
							end={vec(end.x * size.width, end.y * size.height)}
							colors={colors}
							positions={gradientPositions}
						/>
					</Rect>
				</Canvas>
			)}
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
}: RadialGradientProps) => {
	const [size, setSize] = useState({ width: 0, height: 0 });
	const forceUpdate = useAppActiveKey();

	const onLayout = useCallback((event: LayoutChangeEvent) => {
		const { width, height } = event.nativeEvent.layout;
		setSize((prev) =>
			prev.width === width && prev.height === height ? prev : { width, height },
		);
	}, []);

	const gradientPositions = useMemo(
		() => positions || colors.map((_, i) => i / (colors.length - 1)),
		[colors, positions],
	);

	const canvasStyle = useMemo(
		() => [styles.canvas, { width: size.width, height: size.height }],
		[size.width, size.height],
	);

	return (
		<View style={[styles.container, style]} onLayout={onLayout}>
			{size.width > 0 && size.height > 0 && (
				<Canvas key={forceUpdate} style={canvasStyle}>
					<Rect x={0} y={0} width={size.width} height={size.height}>
						<SkiaRadialGradient
							c={vec(center.x * size.width, center.y * size.height)}
							r={radius * (Math.max(size.width, size.height) / 2)}
							colors={colors}
							positions={gradientPositions}
						/>
					</Rect>
				</Canvas>
			)}
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
	canvas: {
		position: 'absolute',
		top: 0,
		left: 0,
	},
});

export {
	LinearGradient,
	RadialGradient,
	type LinearGradientProps,
	type RadialGradientProps,
};

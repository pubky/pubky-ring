import React, { ReactElement, memo, useMemo } from 'react';
import { StyleSheet, StyleProp, ViewStyle } from 'react-native';
import {
	Edge,
	EdgeRecord,
	Edges,
	SafeAreaView as RNSafeAreaView,
	SafeAreaViewProps,
	useSafeAreaInsets,
} from 'react-native-safe-area-context';

const BOTTOM_FALLBACK_PADDING = 24;
const BOTTOM_EXTRA_PADDING = 12;
const DEFAULT_EDGES: EdgeRecord = {
	top: 'additive',
	right: 'additive',
	bottom: 'additive',
	left: 'additive',
};

const resolveEdges = (edges?: Edges): Edges => {
	if (!edges) {
		return DEFAULT_EDGES;
	}

	if (Array.isArray(edges)) {
		return edges.reduce<EdgeRecord>((acc, edge: Edge) => {
			acc[edge] = 'additive';
			return acc;
		}, {});
	}

	const edgeRecord = edges as EdgeRecord;

	return { ...edgeRecord };
};

const includesBottomEdge = (edges?: Edges): boolean => {
	if (!edges) {
		return true;
	}

	if (Array.isArray(edges)) {
		return edges.includes('bottom');
	}

	const edgeRecord = edges as EdgeRecord;
	return edgeRecord.bottom !== undefined && edgeRecord.bottom !== 'off';
};

const SafeAreaView = ({ children, edges, style, ...props }: SafeAreaViewProps): ReactElement => {
	const insets = useSafeAreaInsets();
	const resolvedEdges = useMemo(() => resolveEdges(edges), [edges]);
	const bottomStyle = useMemo<StyleProp<ViewStyle>>(() => {
		if (!includesBottomEdge(edges)) {
			return undefined;
		}

		return {
			paddingBottom: insets.bottom > 0 ? BOTTOM_EXTRA_PADDING : BOTTOM_FALLBACK_PADDING,
		};
	}, [edges, insets.bottom]);

	return (
		<RNSafeAreaView {...props} edges={resolvedEdges} style={[styles.container, bottomStyle, style]}>
			{children}
		</RNSafeAreaView>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#000000',
	},
});

export default memo(SafeAreaView);

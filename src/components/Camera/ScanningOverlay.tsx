import React, { memo, ReactElement } from 'react';
import {
	StyleSheet,
	View,
	Text,
} from 'react-native';

const ScanningOverlay = ({
	size = 250,
	message = "Auth-URL's & Homeservers are supported",
}: {
    size?: number;
    message?: string;
}): ReactElement => (
	<View style={styles.overlay}>
		<View
			style={[
				styles.scanArea,
				{ width: size,
					height: size },
			]}
		>
			<View style={styles.cornerTL} />
			<View style={styles.cornerTR} />
			<View style={styles.cornerBL} />
			<View style={styles.cornerBR} />
		</View>
		<Text style={styles.instructions}>
			{message}
		</Text>
	</View>
);

const styles = StyleSheet.create({
	overlay: {
		...StyleSheet.absoluteFillObject,
		backgroundColor: 'rgba(0,0,0,0.5)',
		justifyContent: 'center',
		alignItems: 'center',
	},
	scanArea: {
		borderRadius: 16,
		backgroundColor: 'transparent',
		justifyContent: 'center',
		alignItems: 'center',
	},
	instructions: {
		color: 'white',
		fontSize: 16,
		marginTop: 20,
		textAlign: 'center',
		paddingHorizontal: 32,
		fontWeight: '500',
	},
	// Corner styles for scanning frame
	cornerTL: {
		position: 'absolute',
		top: 0,
		left: 0,
		width: 40,
		height: 40,
		borderTopWidth: 3,
		borderLeftWidth: 3,
		borderColor: '#fff',
		borderTopLeftRadius: 16,
	},
	cornerTR: {
		position: 'absolute',
		top: 0,
		right: 0,
		width: 40,
		height: 40,
		borderTopWidth: 3,
		borderRightWidth: 3,
		borderColor: '#fff',
		borderTopRightRadius: 16,
	},
	cornerBL: {
		position: 'absolute',
		bottom: 0,
		left: 0,
		width: 40,
		height: 40,
		borderBottomWidth: 3,
		borderLeftWidth: 3,
		borderColor: '#fff',
		borderBottomLeftRadius: 16,
	},
	cornerBR: {
		position: 'absolute',
		bottom: 0,
		right: 0,
		width: 40,
		height: 40,
		borderBottomWidth: 3,
		borderRightWidth: 3,
		borderColor: '#fff',
		borderBottomRightRadius: 16,
	},
});

export default memo(ScanningOverlay);

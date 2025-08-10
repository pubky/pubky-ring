import React, { memo, useCallback } from 'react';
import { Image, Linking, StyleSheet } from 'react-native';
import { TouchableOpacity, View, Text } from '../theme/components';
import { PUBKY_APP_URL } from '../utils/constants';
import { showErrorToast } from '../utils/toastHelpers';
// @ts-ignore
import PubkyRingLogo from '../images/pubky-ring.png';
// @ts-ignore
import DeviceMobileLogo from '../images/device-mobile.png';

const AppFooter: React.FC = () => {
	const onFooterPress = useCallback(() => {
		try {
			Linking.openURL(PUBKY_APP_URL).then();
		} catch {
			showErrorToast('Unable to open URL');
		}
	}, []);

	return (
		<TouchableOpacity
			onPress={onFooterPress}
			activeOpacity={0.8}
			style={styles.footer}
		>
			<View style={styles.footerContent}>
				<View style={styles.footerWrapper}>
					<View style={styles.divider} />
					<View style={styles.footerRow}>
						<View style={styles.phoneIconContainer}>
							<Image
								source={DeviceMobileLogo}
								style={styles.deviceLogo}
							/>
							<Text style={styles.footerText}>
								Try Pubky Ring with
							</Text>
						</View>
						<View style={styles.pubkyLogoContainer}>
							<Image
								source={PubkyRingLogo}
								style={styles.pubkyLogo}
							/>
						</View>
					</View>
				</View>
			</View>
		</TouchableOpacity>
	);
};

const styles = StyleSheet.create({
	footer: {
		position: 'absolute',
		left: 0,
		right: 0,
		bottom: 0,
		width: '100%',
	},
	divider: {
		borderTopWidth: 1,
		borderTopColor: '#2A2A2A',
		width: '100%',
		alignSelf: 'center',
	},
	footerContent: {
		flex: 1,
		backgroundColor: 'black',
		alignItems: 'center',
	},
	footerWrapper: {
		width: '89%',
	},
	footerRow: {
		flexDirection: 'row',
		flex: 1,
		paddingTop: 20,
		paddingBottom: 10,
		backgroundColor: 'black',
		alignItems: 'center',
	},
	phoneIconContainer: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'flex-start',
		backgroundColor: 'black',
	},
	footerText: {
		color: '#808080',
		fontSize: 15,
		fontWeight: '600',
		lineHeight: 18,
		marginLeft: 8,
		backgroundColor: 'black',
	},
	pubkyLogoContainer: {
		flex: 1,
		alignItems: 'flex-end',
		justifyContent: 'flex-end',
		backgroundColor: 'black',
	},
	deviceLogo: {
		height: 36,
		resizeMode: 'contain',
		alignSelf: 'center',
		justifyContent: 'center',
		backgroundColor: 'black',
	},
	pubkyLogo: {
		height: 28,
		resizeMode: 'contain',
		backgroundColor: 'black',
		marginRight: -28,
	},
});

export default memo(AppFooter);

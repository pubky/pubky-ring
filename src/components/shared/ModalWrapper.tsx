import React, { memo, ReactNode } from 'react';
import { StyleSheet, Platform, Dimensions } from 'react-native';
import { View, ActionSheetContainer, SkiaGradient, RadialGradient } from '../../theme/components';
import { useSelector } from 'react-redux';
import { getNavigationAnimation } from '../../store/selectors/settingsSelectors';
import Toast from 'react-native-toast-message';
import { toastConfig } from '../../theme/toastConfig';
import ModalIndicator from '../ModalIndicator';
import { AUTHORIZE_KEY_GRADIENT } from '../../utils/constants';

interface ModalWrapperProps {
	id: string;
	children: ReactNode;
	onClose?: () => void;
	height?: string;
	keyboardHandlerEnabled?: boolean;
	modal?: boolean;
	gradientType?: 'skia' | 'radial';
	showIndicator?: boolean;
	showToast?: boolean;
	contentStyle?: any;
}

const { height: screenHeight } = Dimensions.get('window');
const isSmallScreen = screenHeight < 700;

const toastStyle = {
	top: Platform.select({
		ios: isSmallScreen ? -9 : -50,
		android: isSmallScreen ? -9 : -50,
	}),
};

const ModalWrapper: React.FC<ModalWrapperProps> = ({
	id,
	children,
	onClose,
	height,
	keyboardHandlerEnabled = true,
	modal = Platform.OS === 'ios',
	gradientType = 'skia',
	showIndicator = true,
	showToast = true,
	contentStyle,
}) => {
	const navigationAnimation = useSelector(getNavigationAnimation);

	const GradientContent = gradientType === 'radial' ? (
		<RadialGradient
			style={[styles.content, contentStyle]}
			colors={AUTHORIZE_KEY_GRADIENT}
			center={{ x: 0.5, y: 0.5 }}
		>
			{showIndicator && <ModalIndicator />}
			{children}
		</RadialGradient>
	) : (
		<SkiaGradient modal={true} style={[styles.content, contentStyle]}>
			{showIndicator && <ModalIndicator />}
			{children}
		</SkiaGradient>
	);

	return (
		<View style={styles.container}>
			{/* @ts-ignore - Complex styled-components typing issue */}
			<ActionSheetContainer
				id={id}
				onClose={onClose}
				keyboardHandlerEnabled={keyboardHandlerEnabled}
				navigationAnimation={navigationAnimation}
				modal={modal}
				height={height}
				CustomHeaderComponent={<></>}
			>
				{GradientContent}
				{showToast && <Toast config={toastConfig({ style: toastStyle })} />}
			</ActionSheetContainer>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		...StyleSheet.absoluteFillObject,
		backgroundColor: 'transparent',
		height: '100%',
		width: '100%',
		zIndex: 100,
	},
	content: {
		paddingHorizontal: 20,
		borderTopRightRadius: 20,
		borderTopLeftRadius: 20,
		backgroundColor: 'transparent',
		paddingBottom: 32,
	},
});

export default memo(ModalWrapper);

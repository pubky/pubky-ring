import React, { memo, useCallback } from 'react';
import { StyleSheet } from 'react-native';
import Button from '../Button';
import { buttonStyles, textStyles } from '../../theme/utils';

export interface ModalButtonProps {
	text: string;
	onPress?: () => void;
	variant?: 'primary' | 'secondary' | 'danger';
	width?: 'half' | 'full';
	disabled?: boolean;
	style?: any;
	textStyle?: any;
}

export enum EButtonVariant {
	primary = 'primary',
	secondary = 'secondary',
	danger = 'danger',
}

export enum EButtonWidth {
	full = 'full',
	half = 'half',
}

const ModalButton: React.FC<ModalButtonProps> = ({
	text,
	onPress,
	variant = EButtonVariant.primary,
	width = EButtonWidth.half,
	disabled = false,
	style,
	textStyle,
}) => {
	const getVariantStyles = useCallback((): object => {
		switch (variant) {
			case 'secondary':
				return { borderWidth: 0 };
			case 'danger':
				return { borderWidth: 1 };
			case 'primary':
			default:
				return { borderWidth: 1 };
		}
	}, [variant]);

	return (
		<Button
			text={text}
			onPress={onPress}
			disabled={disabled}
			style={[
				styles.button,
				width === 'full' ? styles.fullWidth : styles.halfWidth,
				getVariantStyles(),
				disabled && styles.disabled,
				style,
			]}
			textStyle={[styles.buttonText, textStyle]}
		/>
	);
};

const styles = StyleSheet.create({
	button: {
		...buttonStyles.secondary,
		minHeight: 64,
		justifyContent: 'center',
	},
	halfWidth: {
		width: '45%',
	},
	fullWidth: {
		width: '100%',
	},
	buttonText: {
		...textStyles.button,
		fontSize: 17,
	},
	disabled: {
		opacity: 0.7,
	},
});

export default memo(ModalButton);

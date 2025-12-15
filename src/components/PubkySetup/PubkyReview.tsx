import React, { ReactElement } from 'react';
import { Platform, StyleSheet } from 'react-native';
import {
	View,
	Text,
	SessionText,
	RadialGradient,
	ForegroundView,
	CardButton,
} from '../../theme/components.ts';
import ModalIndicator from '../ModalIndicator.tsx';
import { AUTHORIZE_KEY_GRADIENT } from '../../utils/constants.ts';
import PubkyProfile from '../PubkyProfile.tsx';
import { PubkyData } from "../../navigation/types.ts";
import i18n from '../../i18n';

interface PubkyReviewProps {
	modalTitle: string;
	headerText?: string;
	description: string;
	pubky: string;
	pubkyData: PubkyData;
	onContinue: () => void;
	authorizeButtonStyle?: Object;
}

const PubkyReview = ({
	modalTitle,
	headerText,
	description,
	pubky,
	pubkyData,
	onContinue,
	authorizeButtonStyle
}: PubkyReviewProps): ReactElement => {
	return (
		<RadialGradient
			style={styles.content}
			colors={AUTHORIZE_KEY_GRADIENT}
			center={{ x: 0.5, y: 0.5 }}
		>
			<ModalIndicator />
			<View style={styles.titleContainer}>
				<Text style={styles.title}>{modalTitle}</Text>
			</View>
			{headerText && (
				<Text style={styles.headerText}>{headerText}</Text>
			)}
			<SessionText style={styles.message}>
				{description}
			</SessionText>
			<ForegroundView style={styles.profileCard}>
				<PubkyProfile
					pubky={pubky}
					pubkyData={pubkyData}
					hideButton={true}
				/>
			</ForegroundView>
			<View style={styles.footer}>
				<CardButton
					testID="NewPubkyContinueButton"
					style={[styles.authorizeButton, authorizeButtonStyle]}
					onPressIn={onContinue}
				>
					<Text style={styles.buttonText}>{i18n.t('common.continue')}</Text>
				</CardButton>
			</View>
		</RadialGradient>
	);
};

const styles = StyleSheet.create({
	content: {
		flex: 1,
		paddingHorizontal: 20,
		borderTopRightRadius: 20,
		borderTopLeftRadius: 20,
		paddingBottom: 20,
	},
	titleContainer: {
		flexDirection: 'row',
		justifyContent: 'center',
		backgroundColor: 'transparent',
	},
	headerText: {
		fontSize: 48,
		lineHeight: 48,
		fontWeight: '700',
		marginBottom: 16,
	},
	title: {
		fontSize: 17,
		fontWeight: '700',
		lineHeight: 22,
		letterSpacing: 0.4,
		textAlign: 'center',
		textTransform: 'capitalize',
		marginBottom: 24,
		backgroundColor: 'transparent',
	},
	message: {
		fontWeight: '400',
		fontSize: 17,
		lineHeight: 24,
		marginBottom: 24,
	},
	profileCard: {
		alignItems: 'center',
		justifyContent: 'center',
		borderRadius: 24,
		backgroundColor: 'rgba(255, 255, 255, 0.05)',
	},
	authorizeButton: {
		flexDirection: 'row',
		width: '100%',
		minHeight: 64,
		borderRadius: 64,
		paddingVertical: 15,
		paddingHorizontal: 15,
		alignContent: 'center',
		justifyContent: 'center',
		alignItems: 'center',
		borderWidth: 1,
		borderColor: 'rgba(255, 255, 255, 1)',
		backgroundColor: 'rgba(255, 255, 255, 0.08)'
	},
	buttonText: {
		fontSize: 15,
		fontWeight: 600,
		lineHeight: 18,
		letterSpacing: 0.2,
		marginLeft: 5,
	},
	footer: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'flex-end',
		backgroundColor: 'transparent',
		marginBottom: Platform.select({ ios: 0, android: 20 })
	}
});

export default PubkyReview;

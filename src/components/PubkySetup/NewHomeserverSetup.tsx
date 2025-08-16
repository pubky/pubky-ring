import React, {
	memo,
	ReactElement,
	useCallback,
	useMemo,
	useState,
} from 'react';
import {
	StyleSheet,
	Image,
} from 'react-native';
import {
	View,
	Text,
	SessionText,
	RadialGradient,
	AuthorizeButton,
	TouchableOpacity,
} from '../../theme/components.ts';
import { SheetManager } from 'react-native-actions-sheet';
import ModalIndicator from '../ModalIndicator.tsx';
import { AUTHORIZE_KEY_GRADIENT } from '../../utils/constants.ts';
import { showEditPubkySheet } from "../../utils/sheetHelpers.ts";
import { defaultPubkyState } from "../../store/shapes/pubky.ts";

export enum HomeserverOption {
	default = 'default',
	custom = 'custom',
}

const NewHomeserverSetup = ({ payload }: {
	payload: {
		pubky: string;
		onContinue?: () => void;
	};
}): ReactElement => {
	const [selectedOption, setSelectedOption] = useState<HomeserverOption>(HomeserverOption.default);
	const pubky = payload?.pubky ?? '';

	const closeSheet = useCallback(async (): Promise<void> => {
		return SheetManager.hide('new-pubky-setup');
	}, []);

	const handleContinue = useCallback(async () => {
		switch (selectedOption) {
			case HomeserverOption.default:
				if (payload?.onContinue) {
					payload.onContinue();
				} else {
					closeSheet();
				}
				break;
			case HomeserverOption.custom:
				await closeSheet();
				setTimeout(() => {
					showEditPubkySheet({
						title: 'Setup',
						description: '',
						pubky: pubky,
						data: defaultPubkyState,
					});
				}, 200);
				break;
			default:
				closeSheet();
		}
	}, [selectedOption, payload, closeSheet, pubky]);

	const truncatedPubky = useMemo(() => {
		if (!pubky) return '';
		if (pubky.length > 20) {
			return `${pubky.substring(0, 7)}...${pubky.substring(pubky.length - 5)}`;
		}
		return pubky;
	}, [pubky]);

	return (
		<RadialGradient
			style={styles.content}
			colors={AUTHORIZE_KEY_GRADIENT}
			center={{ x: 0.5, y: 0.5 }}
		>
			<ModalIndicator />
			<View style={styles.titleContainer}>
				<Text style={styles.title}>Homeserver</Text>
			</View>
			<Text style={styles.headerText}>Data hosting.</Text>
			<SessionText style={styles.message}>
				Choose a homeserver to host your data for pubky {truncatedPubky}
			</SessionText>

			<View style={styles.optionsContainer}>
				<Text style={styles.optionLabel}>HOMESERVER</Text>

				<TouchableOpacity
					style={styles.optionRow}
					onPress={() => setSelectedOption(HomeserverOption.default)}
					activeOpacity={0.7}
				>
					<View style={[
						styles.radioOuter,
						selectedOption === HomeserverOption.default && styles.radioOuterSelected
					]}>
						{selectedOption === HomeserverOption.default && (
							<View style={styles.radioInner} />
						)}
					</View>
					<Text style={styles.optionText}>
						Default <Text style={styles.optionSubtext}>(requires invite code)</Text>
					</Text>
				</TouchableOpacity>

				<TouchableOpacity
					style={styles.optionRow}
					onPress={() => setSelectedOption(HomeserverOption.custom)}
					activeOpacity={0.7}
				>
					<View style={[
						styles.radioOuter,
						selectedOption === HomeserverOption.custom && styles.radioOuterSelected
					]}>
						{selectedOption === HomeserverOption.custom && (
							<View style={styles.radioInner} />
						)}
					</View>
					<Text style={styles.optionText}>Custom</Text>
				</TouchableOpacity>
			</View>

			<View style={styles.bottomSection}>
				<Image
					source={require('../../images/setup-device.png')}
					style={styles.deviceImage}
					resizeMode="contain"
				/>
				<AuthorizeButton
					style={styles.continueButton}
					onPressIn={handleContinue}
				>
					<Text style={styles.buttonText}>Continue</Text>
				</AuthorizeButton>
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
		marginBottom: 24,
		backgroundColor: 'transparent',
	},
	title: {
		fontSize: 20,
		fontWeight: '600',
		textAlign: 'center',
		color: '#FFFFFF',
		backgroundColor: 'transparent',
	},
	headerText: {
		fontSize: 48,
		lineHeight: 56,
		marginBottom: 16,
		fontWeight: '600',
		color: '#FFFFFF',
		backgroundColor: 'transparent',
	},
	message: {
		fontWeight: '400',
		fontSize: 17,
		lineHeight: 24,
		marginBottom: 30,
		color: '#FFFFFF',
		backgroundColor: 'transparent',
	},
	optionsContainer: {
		marginBottom: 20,
		backgroundColor: 'transparent',
		zIndex: 1,
	},
	optionLabel: {
		fontSize: 12,
		fontWeight: '600',
		letterSpacing: 1,
		color: '#FFFFFF',
		opacity: 0.6,
		marginBottom: 20,
		backgroundColor: 'transparent',
	},
	optionRow: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingVertical: 16,
		backgroundColor: 'transparent',
	},
	radioOuter: {
		width: 24,
		height: 24,
		borderRadius: 12,
		borderWidth: 2,
		borderColor: 'rgba(255, 255, 255, 0.3)',
		marginRight: 16,
		alignItems: 'center',
		justifyContent: 'center',
	},
	radioOuterSelected: {
		borderColor: '#FFFFFF',
	},
	radioInner: {
		width: 12,
		height: 12,
		borderRadius: 6,
		backgroundColor: '#FFFFFF',
	},
	optionText: {
		fontSize: 17,
		fontWeight: '400',
		color: '#FFFFFF',
	},
	optionSubtext: {
		opacity: 0.6,
	},
	bottomSection: {
		alignItems: 'center',
		backgroundColor: 'transparent',
		flex: 1,
		justifyContent: 'flex-end',
	},
	deviceImage: {
		width: 480,
		height: 480,
		position: 'absolute',
		bottom: -35,
	},
	continueButton: {
		width: '100%',
		borderRadius: 64,
		paddingVertical: 20,
		alignItems: 'center',
		display: 'flex',
		backgroundColor: 'rgba(255, 255, 255, 0.08)',
		flexDirection: 'row',
		gap: 4,
		borderWidth: 1,
		alignSelf: 'center',
		alignContent: 'center',
		justifyContent: 'center',
		zIndex: 1,
	},
	buttonText: {
		fontSize: 15,
		fontWeight: 600,
		lineHeight: 18,
		letterSpacing: 0.2,
		color: '#FFFFFF',
	},
});

export default memo(NewHomeserverSetup);

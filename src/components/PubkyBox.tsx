import React, {
	memo,
	ReactElement,
	useCallback,
	useMemo,
	useState,
} from 'react';
import { StyleSheet } from 'react-native';
import { SvgXml } from 'react-native-svg';
import jdenticon, { JdenticonConfig } from 'jdenticon';
import { Pubky } from '../types/pubky.ts';
import { Dispatch } from 'redux';
import { useDispatch } from 'react-redux';
import {
	Text,
	SessionText,
	TouchableOpacity,
	Box,
	ForegroundView,
	ActivityIndicator,
	QrCode,
	Clipboard,
	NavView,
} from '../theme/components.ts';

const Jdenticon = ({
	value,
	size = 32,
	config,
}: {
	value: string;
	size?: number;
	config?: JdenticonConfig;
}): ReactElement => {
	const svg = jdenticon.toSvg(value, size, config);
	return <SvgXml xml={svg} />;
};

interface PubkyBoxProps {
	pubky: string;
	pubkyData: Pubky;
	sessionsCount?: number;
	onQRPress: (
		pubky: string,
		pubkyData: Pubky,
		dispatch: Dispatch,
		onComplete?: () => void
	) => Promise<string>;
	onCopyClipboard: (
		pubky: string,
		pubkyData: Pubky,
		dispatch: Dispatch
	) => void;
	onPress: (data: string) => void;
}

const truncatePubky = (pubky: string): string => {
	if (pubky.length <= 16) {
		return pubky;
	}
	return `${pubky.substring(0, 8)}...${pubky.substring(pubky.length - 8)}`;
};

const PubkyBox = ({
	pubky,
	pubkyData,
	sessionsCount = 0,
	onQRPress,
	onCopyClipboard,
	onPress,
}: PubkyBoxProps): ReactElement => {
	const [isQRLoading, setIsQRLoading] = useState(false);
	const [isClipboardLoading, setIsClipboardLoading] = useState(false);
	const dispatch = useDispatch();

	const handleQRPress = useCallback(async () => {
		setIsQRLoading(true);
		try {
			await onQRPress(pubky, pubkyData, dispatch);
		} finally {
			setIsQRLoading(false);
		}
	}, [dispatch, onQRPress, pubky, pubkyData]);

	const handleCopyClipboard = useCallback(async () => {
		setIsClipboardLoading(true);
		try {
			onCopyClipboard(pubky, pubkyData, dispatch);
		} finally {
			setIsClipboardLoading(false);
		}
	}, [dispatch, onCopyClipboard, pubky, pubkyData]);

	const handleOnPress = useCallback(() => {
		onPress(pubky);
	}, [onPress, pubky]);

	const publicKey = useMemo(() => pubky.startsWith('pk:') ? pubky.slice(3) : pubky, [pubky]);

	return (
		<Box
			onPress={handleOnPress}
			style={styles.box}
			activeOpacity={0.7}
		>
			<ForegroundView style={styles.profileImageContainer}>
				<NavView style={styles.profileImage}>
					<Jdenticon value={publicKey} size={60} />
				</NavView>
			</ForegroundView>

			<ForegroundView style={styles.contentContainer}>
				{pubkyData.name ? (
					<Text style={styles.nameText} numberOfLines={1}>
						{pubkyData.name}
					</Text>
        ) : null}
				<Text style={styles.pubkyText} numberOfLines={1}>
					{truncatePubky(pubky)}
				</Text>
				<SessionText style={styles.sessionsText}>Sessions: {sessionsCount}</SessionText>
			</ForegroundView>

			<ForegroundView style={styles.buttonsContainer}>
				<ForegroundView style={styles.buttonsInnerContainer}>
					<TouchableOpacity
						activeOpacity={0.7}
						style={[
							styles.actionButton,
							isQRLoading && styles.actionButtonDisabled,
						]}
						onPressIn={handleQRPress}
						disabled={isQRLoading}
					>
						{isQRLoading ? (
							<ActivityIndicator size="small" />
            ) : (
	<QrCode size={20} />
            )}
					</TouchableOpacity>
					<TouchableOpacity
						activeOpacity={0.7}
						style={[
							styles.actionButton,
							styles.bottomButton,
							isClipboardLoading && styles.actionButtonDisabled,
						]}
						onPressIn={handleCopyClipboard}
						disabled={isClipboardLoading}
					>
						{isClipboardLoading ? (
							<ActivityIndicator size="small" />
            ) : (
	<Clipboard size={20} />
            )}
					</TouchableOpacity>
				</ForegroundView>
			</ForegroundView>
		</Box>
	);
};

const styles = StyleSheet.create({
	box: {
		width: '90%',
		borderRadius: 12,
		borderWidth: 1,
		alignSelf: 'center',
		marginVertical: 8,
		paddingVertical: 8,
		paddingHorizontal: 16,
		flexDirection: 'row',
		alignItems: 'center',
		shadowColor: '#000',
		shadowOffset: {
			width: 0,
			height: 1,
		},
		shadowOpacity: 0.1,
		shadowRadius: 2,
		elevation: 2,
	},
	profileImageContainer: {
		marginRight: 12,
	},
	profileImage: {
		width: 60,
		height: 60,
		borderRadius: 30,
		borderWidth: 1,
		borderColor: '#ccc',
		overflow: 'hidden',
		justifyContent: 'center',
		alignItems: 'center',
	},
	contentContainer: {
		flex: 1,
		justifyContent: 'center',
	},
	nameText: {
		fontSize: 17,
		fontWeight: '600',
		marginBottom: 4,
	},
	pubkyText: {
		fontSize: 16,
		fontFamily: 'monospace',
		marginBottom: 4,
	},
	sessionsText: {
		fontSize: 13,
		fontWeight: '500',
	},
	buttonsContainer: {
		marginLeft: 12,
		justifyContent: 'center',
	},
	buttonsInnerContainer: {
		justifyContent: 'center',
	},
	actionButton: {
		width: 36,
		minHeight: 36,
		borderRadius: 18,
		borderWidth: 1,
		borderColor: '#ccc',
		justifyContent: 'center',
		alignItems: 'center',
	},
	bottomButton: {
		marginTop: 4,
	},
	actionButtonDisabled: {
		opacity: 0.7,
	},
});

export default memo(PubkyBox);

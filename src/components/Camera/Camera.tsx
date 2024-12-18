import React, {
	ReactElement,
	useState,
	useEffect,
	memo,
	useCallback,
} from 'react';
import {
	StyleSheet,
	View,
} from 'react-native';
import {
	Camera as CameraKit,
	CameraType,
} from 'react-native-camera-kit';
import CameraNoAuth from './CameraNoAuth';
import { requestCameraPermission } from '../../utils/permissions';

interface CameraProps {
	children?: ReactElement;
	bottomSheet?: boolean;
	onBarCodeRead: (data: string) => void;
}

const Camera = ({
	children,
	onBarCodeRead,
}: CameraProps): ReactElement => {
	const prevDataRef = React.useRef<string>('');

	const [cameraState, setCameraState] = useState<{
		status: boolean | undefined;
		isInitialized: boolean;
	}>({ status: undefined, isInitialized: false });

	useEffect(() => {
		let mounted = true;

		const initializeCamera = async (): Promise<void> => {
			try {
				const result = await requestCameraPermission();
				if (mounted) {
					setCameraState(prev => ({
						status: result,
						isInitialized: prev.isInitialized,
					}));

					if (result) {
						// Use RAF instead of setTimeout for better performance
						requestAnimationFrame(() => {
							if (mounted) {
								setCameraState(prev => ({
									...prev,
									isInitialized: true,
								}));
							}
						});
					}
				}
			} catch (error) {
				console.error('Error initializing camera:', error);
				if (mounted) {
					setCameraState(prev => ({
						status: false,
						isInitialized: prev.isInitialized,
					}));
				}
			}
		};

		initializeCamera().then();

		return (): void => {
			mounted = false;
		};
	}, []);

	const handleCodeRead = useCallback((event: {
		nativeEvent: { codeStringValue: string }
	}): void => {
		const { codeStringValue } = event.nativeEvent;
		if (prevDataRef.current !== codeStringValue) {
			prevDataRef.current = codeStringValue;
			onBarCodeRead(codeStringValue);
		}
	}, [onBarCodeRead]);

	const cameraKitProps = React.useMemo(() => ({
		style: styles.camera,
		scanBarcode: true,
		onReadCode: handleCodeRead,
		cameraType: CameraType.Back,
	}), [handleCodeRead]);

	// Early return for loading state
	if (cameraState.status === undefined) {
		return <View style={styles.container} />;
	}

	if (cameraState.status === false) {
		return <CameraNoAuth />;
	}

	if (cameraState.status === true && cameraState.isInitialized) {
		return (
			<View style={styles.container}>
				<CameraKit {...cameraKitProps} />
				{children}
			</View>
		);
	}

	return <View style={styles.container} />;
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	camera: {
		...StyleSheet.absoluteFillObject,
	},
});

export default memo(Camera);

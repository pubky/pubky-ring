import { SvgXml } from 'react-native-svg';
import { memo, ReactElement, useMemo } from 'react';
import { Image } from 'react-native';
import jdenticon from 'jdenticon';
import { useSelector } from 'react-redux';
import { getPubkyImage } from '../store/selectors/pubkySelectors.ts';
import { RootState } from '../types';

interface ProfileAvatarProps {
	pubky: string;
	size?: number;
}

const ProfileAvatar = ({ pubky, size = 32 }: ProfileAvatarProps): ReactElement => {
	const publicKey = pubky.startsWith('pk:') ? pubky.slice(3) : pubky;
	const imageUri = useSelector((state: RootState) => getPubkyImage(state, publicKey));

	// Memoize style object to prevent unnecessary re-renders
	const imageStyle = useMemo(
		() => ({
			width: size,
			height: size,
			borderRadius: '50%',
		}),
		[size],
	);

	// Memoize SVG generation - expensive string operation
	const svg = useMemo(() => jdenticon.toSvg(pubky, size, { padding: 0 }), [pubky, size]);

	if (imageUri) {
		return <Image source={{ uri: imageUri }} style={imageStyle} />;
	}

	return <SvgXml xml={svg} />;
};

export default memo(ProfileAvatar);

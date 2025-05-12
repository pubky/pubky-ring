import { SvgXml } from 'react-native-svg';
import { memo, ReactElement, useMemo } from 'react';
import {
	Image,
} from 'react-native';
import jdenticon, { JdenticonConfig } from 'jdenticon';
import { useSelector } from 'react-redux';
import { getPubkyImage } from '../store/selectors/pubkySelectors.ts';
import { RootState } from '../types';

interface ProfileAvatarProps {
    pubky: string;
    size?: number;
    config?: JdenticonConfig;
}

const ProfileAvatar = ({ pubky, size = 32, config }: ProfileAvatarProps): ReactElement => {
	const publicKey = useMemo(
		() => (pubky.startsWith('pk:') ? pubky.slice(3) : pubky),
		[pubky],
	);
	const imageUri = useSelector((state: RootState) => getPubkyImage(state, publicKey));

	if (imageUri) {
		return <Image source={{ uri: imageUri }} style={{ width: size, height: size }} />;
	}

	const svg = jdenticon.toSvg(pubky, size, config);
	return <SvgXml xml={svg} />;
};

export default memo(ProfileAvatar);


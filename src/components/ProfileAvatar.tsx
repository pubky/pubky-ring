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
	const publicKey = useMemo(() => {
		if (!pubky) {
			return '';
		}
		return pubky.startsWith('pk:') ? pubky.slice(3) : pubky;
	}, [pubky]);

	const imageUri = useSelector((state: RootState) => getPubkyImage(state, publicKey));

	const borderRadius = useMemo(() => size / 2, [size]);

	if (imageUri) {
		return (
			<Image
				source={{ uri: imageUri }}
				style={{
					width: size,
					height: size,
					borderRadius,
				}}
			/>
		);
	}

	const svg = jdenticon.toSvg(pubky, size);
	return <SvgXml xml={svg} />;
};

export default memo(ProfileAvatar);


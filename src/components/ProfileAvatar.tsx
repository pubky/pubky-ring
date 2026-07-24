import { memo, ReactElement, useMemo } from 'react';
import { Image, Text } from 'react-native';
import { Facehash } from 'react-native-facehash';
import { useSelector } from 'react-redux';
import { getPubkyImage } from '../store/selectors/pubkySelectors.ts';
import { RootState } from '../types';

/**
 * Shared palette used when generating Facehash avatars for profiles without an image.
 * The selected color remains deterministic per seed.
 */
export const FACEHASH_AVATAR_COLORS = ['#00FF5D', '#00F0FF', '#004BFF', '#FC00FF', '#FF0000', '#FF9900'];

interface ProfileAvatarProps {
	pubky: string;
	name?: string;
	size?: number;
	image?: string;
}

const resolveFallbackSeed = (pubky: string): string => {
	const publicKey = pubky.startsWith('pk:') ? pubky.slice(3) : pubky;
	return publicKey.trim();
};

const resolveFallbackInitial = (name: string | undefined, seed: string): string => {
	const nameInitial = name?.trim().charAt(0).toUpperCase();
	if (nameInitial) {
		return nameInitial;
	}

	return seed.trim().charAt(0).toUpperCase();
};

const ProfileAvatar = ({ pubky, name, size = 32, image }: ProfileAvatarProps): ReactElement => {
	const fallbackSeed = useMemo(() => resolveFallbackSeed(pubky), [pubky]);
	const storedImageUri = useSelector((state: RootState) => getPubkyImage(state, fallbackSeed));
	const imageUri = image || storedImageUri;
	const fallbackInitial = useMemo(() => resolveFallbackInitial(name, fallbackSeed), [name, fallbackSeed]);

	// Memoize style object to prevent unnecessary re-renders
	const imageStyle = useMemo(
		() => ({
			width: size,
			height: size,
			borderRadius: '50%',
		}),
		[size],
	);
	const initialStyle = useMemo(
		() => ({
			color: '#050505',
			fontSize: size * 0.26,
			fontWeight: '500' as const,
			lineHeight: size * 0.26,
		}),
		[size],
	);

	if (imageUri) {
		return <Image source={{ uri: imageUri }} style={imageStyle} />;
	}

	return (
		<Facehash
			colors={FACEHASH_AVATAR_COLORS}
			enableBlink
			name={fallbackSeed}
			showInitial={false}
			size={size}
			onRenderMouth={() => <Text style={initialStyle}>{fallbackInitial}</Text>}
		/>
	);
};

export default memo(ProfileAvatar);

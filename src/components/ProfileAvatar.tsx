import { memo, ReactElement, useMemo } from 'react';
import { Image, Text } from 'react-native';
import { Facehash } from 'react-native-facehash';
import { useSelector } from 'react-redux';
import { getPubky, getPubkyImage } from '../store/selectors/pubkySelectors.ts';
import { RootState } from '../types';
import { accentColors } from '../theme';

/**
 * Shared palette used when generating Facehash avatars for profiles without an image.
 * The selected color remains deterministic per seed.
 */
export const FACEHASH_AVATAR_COLORS = ['#00FF5D', '#00F0FF', '#004BFF', '#FC00FF', '#FF0000', '#FF9900'];

// Bitkit-owned pubkys always use the Bitkit brand color.
const EXTERNAL_AVATAR_COLORS = [accentColors.orange];

interface ProfileAvatarProps {
	pubky: string;
	name?: string;
	size?: number;
	// Set for Bitkit pubkys that are not adopted yet and so are not in the store.
	external?: boolean;
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

const ProfileAvatar = ({ pubky, name, size = 32, external = false }: ProfileAvatarProps): ReactElement => {
	const fallbackSeed = useMemo(() => resolveFallbackSeed(pubky), [pubky]);
	const imageUri = useSelector((state: RootState) => getPubkyImage(state, fallbackSeed));
	const isExternal = useSelector((state: RootState) => external || !!getPubky(state, fallbackSeed)?.sourceApp);
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
			colors={isExternal ? EXTERNAL_AVATAR_COLORS : FACEHASH_AVATAR_COLORS}
			enableBlink
			name={fallbackSeed}
			showInitial={false}
			size={size}
			onRenderMouth={() => <Text style={initialStyle}>{fallbackInitial}</Text>}
		/>
	);
};

export default memo(ProfileAvatar);

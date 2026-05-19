import React, { memo } from 'react';
import AppHeader from './AppHeader';
import HeaderNavButton from './HeaderNavButton.tsx';
import { useTypedNavigation } from '../navigation/hooks';
import { Gear, Info } from '../icons';

const HomeHeader = () => {
	const navigation = useTypedNavigation();

	const leftButton = (
		<HeaderNavButton onPressIn={() => navigation.navigate('About')}>
			<Info size={24} />
		</HeaderNavButton>
	);

	const rightButton = (
		<HeaderNavButton
			onPressIn={() => {
				navigation.navigate('Settings', { showSecretSettings: false });
			}}
		>
			<Gear size={24} />
		</HeaderNavButton>
	);

	return <AppHeader leftButton={leftButton} rightButton={rightButton} />;
};

export default memo(HomeHeader);

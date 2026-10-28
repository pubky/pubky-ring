import React, { memo } from 'react';
import AppHeader from './AppHeader';
import HeaderNavButton from './HeaderNavButton.tsx';
import { useTypedNavigation } from '../navigation/hooks';
import { Gear, Info } from '../icons';

const HomeHeader = () => {
	const navigation = useTypedNavigation();

	const leftButton = (
		<HeaderNavButton onPressIn={() => navigation.navigate('About')}>
			<Info size={20} />
		</HeaderNavButton>
	);

	const rightButton = (
		<HeaderNavButton
			testID="HomeHeaderSettingsButton"
			onPressIn={() => {
				navigation.navigate('Settings');
			}}
		>
			<Gear size={20} />
		</HeaderNavButton>
	);

	return <AppHeader leftButton={leftButton} rightButton={rightButton} />;
};

export default memo(HomeHeader);

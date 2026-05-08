import React, { memo } from 'react';
import { Info, Settings } from '../theme/components';
import AppHeader, { HeaderNavButton } from './AppHeader';
import { useTypedNavigation } from '../navigation/hooks';

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
			<Settings size={24} />
		</HeaderNavButton>
	);

	return <AppHeader leftButton={leftButton} rightButton={rightButton} />;
};

export default memo(HomeHeader);

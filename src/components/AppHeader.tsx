import React, { memo, useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { NavButton, CircleAlert } from '../theme/components';
import PubkyRingHeader from './PubkyRingHeader';
import { useTypedNavigation } from '../navigation/hooks';

interface AppHeaderProps {
	showLeftButton?: boolean;
	showRightButton?: boolean;
}

const AppHeader: React.FC<AppHeaderProps> = ({
	showLeftButton = true,
	showRightButton = true
}) => {
	const navigation = useTypedNavigation();

	const LeftButton = useMemo(() =>
		showLeftButton ? (
			<NavButton
				style={styles.navButton}
				onPressIn={() => navigation.navigate('About')}
				hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
			>
				<CircleAlert size={24} />
			</NavButton>
		) : null,
	[navigation, showLeftButton]);

	const RightButton = useMemo(() =>
		showRightButton ? (
			<NavButton style={styles.rightNavButton} />
		) : null,
	[showRightButton]);

	return (
		<PubkyRingHeader leftButton={LeftButton} rightButton={RightButton} />
	);
};

const styles = StyleSheet.create({
	navButton: {
		zIndex: 1,
		height: 40,
		width: 40,
		alignSelf: 'center',
		alignItems: 'center',
		justifyContent: 'center',
		right: -5,
	},
	rightNavButton: {
		width: 40,
		height: 40,
		justifyContent: 'center',
		alignItems: 'center',
		alignSelf: 'center',
		backgroundColor: 'transparent',
	},
});

export default memo(AppHeader);

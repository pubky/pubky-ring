import styled from 'styled-components/native';
import {
	Scan as _Scan,
	Clipboard as _Clipboard,
	ChevronLeft as _ChevronLeft,
	Eye as _Eye,
	EyeOff as _EyeOff,
	Plus as _Plus,
	ChevronRight as _ChevronRight,
	Check as _Check,
	Edit2 as _Edit2,
	Trash2 as _Trash2,
	Save as _Save,
	KeyRound as _KeyRound,
	Folder as _Folder,
} from 'lucide-react-native';
import ActionSheet from 'react-native-actions-sheet';
import Animated from 'react-native-reanimated';

interface ActionSheetContainerProps {
  backgroundColor?: string;
}

export const ActionSheetContainer = styled(
	ActionSheet,
).attrs<ActionSheetContainerProps>(props => ({
	containerStyle: {
		backgroundColor: props.backgroundColor || props.theme.colors.background,
		borderTopLeftRadius: 20,
		borderTopRightRadius: 20,
	},
	indicatorStyle: {
		width: 32,
		height: 4,
		backgroundColor: '#ccc',
		borderRadius: 2,
		marginVertical: 12,
	},
	gestureEnabled: true,
	defaultOverlayOpacity: 0.3,
	statusBarTranslucent: true,
	drawUnderStatusBar: false,
	springOffset: 50,
}))``;

export const TextInput = styled.TextInput`
  background-color: ${(props): string => props.theme.colors.background};
  color: ${(props): string => props.theme.colors.text};
`;

export const View = styled.View`
	background-color: ${(props): string => props.theme.colors.background};
	border-color: ${(props): string => props.theme.colors.text};
`;

export const AnimatedView = styled(Animated.View)`
	background-color: ${(props): string => props.theme.colors.background};
	border-color: ${(props): string => props.theme.colors.text};
`;

export const TouchableOpacity = styled.TouchableOpacity`
  background-color: ${(props): string => props.theme.colors.background};
`;

export const NavButton = styled.TouchableOpacity`
  background-color: ${(props): string => props.theme.colors.navButton};
`;

export const NavView = styled.View`
  background-color: ${(props): string => props.theme.colors.navButton};
`;

export const SafeAreaView = styled.SafeAreaView`
  flex: 1;
  background-color: ${(props): string => props.theme.colors.background};
`;

export const ScrollView = styled.ScrollView`
  background-color: ${(props): string => props.theme.colors.background};
`;

export const Text = styled.Text`
  color: ${(props): string => props.theme.colors.text};
`;

export const SessionBox = styled.View`
  background-color: ${(props): string => props.theme.colors.cardBackground};
  border-color: ${(props): string => props.theme.colors.border};
`;

export const Card = styled.View`
	background-color: ${(props): string => props.theme.colors.actionButton};
	border-color: ${(props): string => props.theme.colors.border};
`;

export const Button = styled.TouchableOpacity`
	background-color: ${(props): string => props.theme.colors.actionButton};
	border-color: ${(props): string => props.theme.colors.buttonBorder};
`;

export const CardView = styled.View`
	background-color: ${(props): string => props.theme.colors.cardButton};
`;

export const CardButton = styled.TouchableOpacity`
	background-color: ${(props): string => props.theme.colors.cardButton};
`;

export const AuthorizeButton = styled.TouchableOpacity`
	background-color: ${(props): string => props.theme.colors.cardButton};
	border-color: ${(props): string => props.theme.colors.buttonBorder};
`;

export const SessionView = styled.View`
  background-color: ${(props): string => props.theme.colors.cardBackground};
  border-color: ${(props): string => props.theme.colors.border};
`;

export const SessionText = styled.Text`
  color: ${(props): string => props.theme.colors.sessionText};
`;

export const Box = styled.TouchableOpacity`
  background-color: ${(props): string => props.theme.colors.foreground};
  border-color: ${(props): string => props.theme.colors.border};
`;

export const ForegroundView = styled.View`
  background-color: ${(props): string => props.theme.colors.foreground};
`;

export const AvatarRing = styled.View`
  background-color: ${(props): string => props.theme.colors.avatarRing};
  border-color: ${(props): string => props.theme.colors.border};
`;

export const ActionButton = styled.TouchableOpacity`
  background-color: ${(props): string => props.theme.colors.actionButton};
	  border-color: ${(props): string => props.theme.colors.buttonBorder};
`;

export const ActivityIndicator = styled.ActivityIndicator`
  color: ${(props): string => props.theme.colors.sessionText};
`;

export const QrCode = styled(_Scan)`
  color: ${(props): string => props.theme.colors.sessionText};
`;

export const ArrowRight = styled(_ChevronRight)`
  color: ${(props): string => props.theme.colors.sessionText};
`;

export const Plus = styled(_Plus)`
  color: ${(props): string => props.theme.colors.text};
`;

export const Clipboard = styled(_Clipboard)`
	color: ${(props): string => props.theme.colors.sessionText};
`;

export const Trash2 = styled(_Trash2)`
	color: ${(props): string => props.theme.colors.sessionText};
`;

export const Save = styled(_Save)`
	color: ${(props): string => props.theme.colors.sessionText};
`;

export const ChevronLeft = styled(_ChevronLeft)`
  color: ${(props): string => props.theme.colors.sessionText};
`;

export const Check = styled(_Check)`
	  color: ${(props): string => props.theme.colors.sessionText};
`;

export const Edit2 = styled(_Edit2)`
		  color: ${(props): string => props.theme.colors.sessionText};
`;

export const Eye = styled(_Eye)`
  color: ${(props): string => props.theme.colors.sessionText};
`;

export const EyeOff = styled(_EyeOff)`
  color: ${(props): string => props.theme.colors.sessionText};
`;

export const KeyRound = styled(_KeyRound)`
  color: ${(props): string => props.theme.colors.sessionText};
`;

export const Folder = styled(_Folder)`
	  color: ${(props): string => props.theme.colors.text};
`;

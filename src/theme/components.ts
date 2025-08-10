import React from 'react';
import styled from 'styled-components/native';
import { Theme } from './index';
import {
	Scan as _Scan,
	Clipboard as _Clipboard,
	Share as _Share,
	ArrowLeft as _ArrowLeft,
	ChevronLeft as _ChevronLeft,
	CircleAlert as _CircleAlert,
	Eye as _Eye,
	EyeOff as _EyeOff,
	Plus as _Plus,
	ChevronRight as _ChevronRight,
	Check as _Check,
	Edit2 as _Edit2,
	Pencil as _Pencil,
	Trash2 as _Trash2,
	Save as _Save,
	KeyRound as _KeyRound,
	Folder as _Folder,
} from 'lucide-react-native';
import ActionSheet from 'react-native-actions-sheet';
import Animated from 'react-native-reanimated';
import { ENavigationAnimation } from '../types/settings.ts';
import {
	LinearGradient as _SkiaGradient,
	RadialGradient as _RadialGradient,
} from '../components/LinearGradient.tsx';
import { LinearGradient as _LinearGradient } from 'react-native-linear-gradient';
import { SafeAreaView as _SafeAreaView } from 'react-native-safe-area-context';
import { SafeAreaProvider as _SafeAreaProvider } from 'react-native-safe-area-context';

interface ActionSheetContainerProps {
  backgroundColor?: string;
  navigationAnimation?: ENavigationAnimation;
  springOffset?: number;
  height?: string;
  keyboardHandlerEnabled?: boolean;
  isModal?: boolean;
  modal?: boolean;
  animated?: boolean;
  onClose?: () => void;
  CustomHeaderComponent?: React.ReactElement;
  theme: Theme;
}

const fadeAnimationConfig = {
	speed: 2000,
};
const openAnimationConfig = {
	tension: 500,
	friction: 50,
	velocity: 0,
};
export const ActionSheetContainer = styled(
	ActionSheet,
).attrs<ActionSheetContainerProps>(props => ({
	containerStyle: {
		backgroundColor: props.backgroundColor || props.theme.colors.background,
		borderTopLeftRadius: 20,
		borderTopRightRadius: 20,
		height: props?.height as any || undefined,
	},
	indicatorStyle: {
		width: 32,
		height: 4,
		backgroundColor: '#ccc',
		borderRadius: 2,
		marginVertical: 12,
	},
	gestureEnabled: true,
	defaultOverlayOpacity: 0.7,
	statusBarTranslucent: true,
	drawUnderStatusBar: false,
	springOffset: props?.springOffset ?? 80,
	animated: true,
	openAnimationConfig: props?.navigationAnimation === ENavigationAnimation.fade ? fadeAnimationConfig : openAnimationConfig,
	closeAnimationConfig: props?.navigationAnimation === ENavigationAnimation.fade ? fadeAnimationConfig : undefined,
}))``;

export const TextInput = styled.TextInput<{ theme: Theme }>`
	background-color: ${(props): string => props.theme.colors.background};
	color: ${(props): string => props.theme.colors.text};
	font-family: 'InterTight-VariableFont_wght';
`;

export const View = styled.View<{ theme: Theme }>`
	background-color: ${(props): string => props.theme.colors.background};
	border-color: ${(props): string => props.theme.colors.text};
`;

export const AnimatedView = styled(Animated.View)<{ theme: Theme }>`
	background-color: ${(props): string => props.theme.colors.background};
	border-color: ${(props): string => props.theme.colors.text};
`;

export const TouchableOpacity = styled.TouchableOpacity<{ theme: Theme }>`
  background-color: ${(props): string => props.theme.colors.background};
`;

export const NavButton = styled.TouchableOpacity<{ theme: Theme }>`
  background-color: ${(props): string => props.theme.colors.background};
`;

export const NavView = styled.View<{ theme: Theme }>`
  background-color: ${(props): string => props.theme.colors.navButton};
`;

export const SafeAreaView = styled(_SafeAreaView)<{ theme: Theme }>`
  flex: 1;
  background-color: ${(props): string => props.theme.colors.background};
`;

export const SafeAreaProvider = styled(_SafeAreaProvider)<{ theme: Theme }>`
  flex: 1;
  background-color: ${(props): string => props.theme.colors.background};
`;

export const ScrollView = styled.ScrollView<{ theme: Theme }>`
  background-color: ${(props): string => props.theme.colors.background};
`;

export const Text = styled.Text<{ theme: Theme }>`
	color: ${(props): string => props.theme.colors.text};
	font-family: 'InterTight-VariableFont_wght';
`;

export const SessionBox = styled.View<{ theme: Theme }>`
  background-color: ${(props): string => props.theme.colors.cardBackground};
  border-color: ${(props): string => props.theme.colors.border};
`;

export const Card = styled.View<{ theme: Theme }>`
	background-color: ${(props): string => props.theme.colors.actionButton};
	border-color: ${(props): string => props.theme.colors.border};
`;

export const Button = styled.TouchableOpacity<{ theme: Theme }>`
	background-color: ${(props): string => props.theme.colors.actionButton};
	border-color: ${(props): string => props.theme.colors.buttonBorder};
`;

export const CardView = styled.View<{ theme: Theme }>`
	background-color: ${(props): string => props.theme.colors.cardButton};
`;

export const CardButton = styled.TouchableOpacity<{ theme: Theme }>`
	background-color: ${(props): string => props.theme.colors.cardButton};
`;

export const AuthorizeButton = styled.TouchableOpacity<{ theme: Theme }>`
	background-color: ${(props): string => props.theme.colors.cardButton};
	border-color: ${(props): string => props.theme.colors.buttonBorder};
`;

export const SessionView = styled.View<{ theme: Theme }>`
  background-color: ${(props): string => props.theme.colors.cardBackground};
  border-color: ${(props): string => props.theme.colors.border};
`;

export const SessionText = styled.Text<{ theme: Theme }>`
	color: ${(props): string => props.theme.colors.sessionText};
	font-family: 'InterTight-VariableFont_wght';
`;

export const Box = styled.TouchableOpacity<{ theme: Theme }>`
  background-color: ${(props): string => props.theme.colors.foreground};
  border-color: ${(props): string => props.theme.colors.border};
`;

export const ForegroundView = styled.View<{ theme: Theme }>`
  background-color: ${(props): string => props.theme.colors.foreground};
`;

export const AvatarRing = styled.View<{ theme: Theme }>`
  background-color: ${(props): string => props.theme.colors.avatarRing};
  border-color: ${(props): string => props.theme.colors.border};
`;

export const ActionButton = styled.TouchableOpacity<{ theme: Theme }>`
  background-color: ${(props): string => props.theme.colors.actionButton};
	  border-color: ${(props): string => props.theme.colors.buttonBorder};
`;

export const ActivityIndicator = styled.ActivityIndicator<{ theme: Theme }>`
  color: ${(props): string => props.theme.colors.sessionText};
`;

export const QrCode = styled(_Scan)<{ theme: Theme }>`
  color: ${(props): string => props.theme.colors.sessionText};
`;

export const ArrowRight = styled(_ChevronRight)<{ theme: Theme }>`
  color: ${(props): string => props.theme.colors.sessionText};
`;

export const Plus = styled(_Plus)<{ theme: Theme }>`
  color: ${(props): string => props.theme.colors.text};
`;

export const Clipboard = styled(_Clipboard)<{ theme: Theme }>`
	color: ${(props): string => props.theme.colors.sessionText};
`;

export const Share = styled(_Share)<{ theme: Theme }>`
	color: ${(props): string => props.theme.colors.sessionText};
`;

export const Trash2 = styled(_Trash2)<{ theme: Theme }>`
	color: ${(props): string => props.theme.colors.sessionText};
`;

export const Save = styled(_Save)<{ theme: Theme }>`
	color: ${(props): string => props.theme.colors.sessionText};
`;

export const ArrowLeft = styled(_ArrowLeft)<{ theme: Theme }>`
  color: ${(props): string => props.theme.colors.text};
`;

export const CircleAlert = styled(_CircleAlert)<{ theme: Theme }>`
  color: ${(props): string => props.theme.colors.text};
`;

export const ChevronLeft = styled(_ChevronLeft)<{ theme: Theme }>`
  color: ${(props): string => props.theme.colors.sessionText};
`;

export const Check = styled(_Check)<{ theme: Theme }>`
	  color: ${(props): string => props.theme.colors.text};
`;

export const Pencil = styled(_Pencil)<{ theme: Theme }>`
		  color: ${(props): string => props.theme.colors.text};
`;

export const Edit2 = styled(_Edit2)<{ theme: Theme }>`
		  color: ${(props): string => props.theme.colors.sessionText};
`;

export const Eye = styled(_Eye)<{ theme: Theme }>`
  color: ${(props): string => props.theme.colors.sessionText};
`;

export const EyeOff = styled(_EyeOff)<{ theme: Theme }>`
  color: ${(props): string => props.theme.colors.sessionText};
`;

export const KeyRound = styled(_KeyRound)<{ theme: Theme }>`
  color: ${(props): string => props.theme.colors.sessionText};
`;

export const Folder = styled(_Folder)<{ theme: Theme }>`
	  color: ${(props): string => props.theme.colors.text};
`;

interface LinearGradientProps {
	colors?: string[];
	modal?: boolean;
	theme: Theme;
}

export const LinearGradient = styled(_LinearGradient).attrs<LinearGradientProps>((props) => ({
	colors: props.colors || (props.modal ? props.theme.colors.modalGradient : props.theme.colors.gradient),
}))``;

interface SkiaGradientProps {
	colors?: string[];
	modal?: boolean;
	theme: Theme;
}

export const SkiaGradient = styled(_SkiaGradient).attrs<SkiaGradientProps>((props) => ({
	colors: props.colors || (props.modal ? props.theme.colors.modalGradient : props.theme.colors.gradient),
}))``;

interface RadialGradientProps {
	colors?: string[];
	center?: { x: number; y: number };
	radius?: number;
	modal?: boolean;
	positions?: number[];
	theme: Theme;
}

export const RadialGradient = styled(_RadialGradient).attrs<RadialGradientProps>((props) => {
	const resolvedColors = props.colors || (props.modal ? props.theme.colors.modalGradient : props.theme.colors.gradient);
	return {
		colors: resolvedColors,
		center: props.center || { x: 0.5, y: 0.5 },
		radius: props.radius || 1,
		positions: props.positions || resolvedColors.map((_: any, index: number) => index / (resolvedColors.length - 1)),
	};
})``;

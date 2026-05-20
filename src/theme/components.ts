import React from 'react';
import styled from 'styled-components/native';
import { Theme } from './index';
import {
	Scan as _Scan,
	QrCode as _QrCode,
	Clipboard as _Clipboard,
	Share as _Share,
	ArrowLeft as _ArrowLeft,
	ChevronLeft as _ChevronLeft,
	CircleAlert as _CircleAlert,
	Info as _Info,
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
	Settings as _Settings,
	Globe as _Globe,
	CircleCheck as _CircleCheck,
	Gift as _Gift,
	Mail as _Mail,
	Send as _Send,
} from 'lucide-react-native';
import Animated from 'react-native-reanimated';
import { RadialGradient as _RadialGradient } from '../components/LinearGradient.tsx';
import { LinearGradient as _LinearGradient } from 'react-native-linear-gradient';
import { SafeAreaView as _SafeAreaView } from 'react-native-safe-area-context';
import { SafeAreaProvider as _SafeAreaProvider } from 'react-native-safe-area-context';
import { fontFamily } from './fonts';

// Default stroke width for Lucide icons to improve sharpness on high-DPI displays
const ICON_STROKE_WIDTH = 2.5;

export const TextInput = styled.TextInput<{ theme: Theme }>`
	background-color: ${(props): string => props.theme.colors.background};
	color: ${(props): string => props.theme.colors.text};
	font-family: ${fontFamily};
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
	font-family: ${fontFamily};
`;

export const SessionBox = styled.View<{ theme: Theme }>`
	background-color: ${(props): string => props.theme.colors.cardBackground};
	border-color: ${(props): string => props.theme.colors.border};
`;

export const Card = styled.View<{ theme: Theme }>`
	background-color: ${(props): string => props.theme.colors.buttonBackground};
	border-color: ${(props): string => props.theme.colors.border};
`;

export const CardView = styled.View<{ theme: Theme }>`
	background-color: ${(props): string => props.theme.colors.buttonBackground};
`;

export const SessionView = styled.View<{ theme: Theme }>`
	background-color: ${(props): string => props.theme.colors.cardBackground};
	border-color: ${(props): string => props.theme.colors.border};
`;

export const SessionText = styled.Text<{ theme: Theme }>`
	color: ${(props): string => props.theme.colors.sessionText};
	font-family: ${fontFamily};
`;

export const BoldText = styled.Text<{ theme: Theme }>`
	color: ${(props): string => props.theme.colors.text};
	font-weight: bold;
	font-family: ${fontFamily};
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

export const ActivityIndicator = styled.ActivityIndicator<{ theme: Theme }>`
	color: ${(props): string => props.theme.colors.sessionText};
`;

export const QrCode = styled(_QrCode).attrs({ strokeWidth: ICON_STROKE_WIDTH })<{ theme: Theme }>`
	color: ${(props): string => props.theme.colors.sessionText};
`;

export const Scan = styled(_Scan).attrs({ strokeWidth: ICON_STROKE_WIDTH })<{ theme: Theme }>`
	color: ${(props): string => props.theme.colors.sessionText};
`;

export const ArrowRight = styled(_ChevronRight).attrs({ strokeWidth: ICON_STROKE_WIDTH })<{ theme: Theme }>`
	color: ${(props): string => props.theme.colors.sessionText};
`;

export const Plus = styled(_Plus).attrs<{ strokeWidth?: number }>(({ strokeWidth }) => ({
	strokeWidth: strokeWidth ?? ICON_STROKE_WIDTH,
}))<{ theme: Theme }>`
	color: ${(props): string => props.theme.colors.text};
`;

export const Clipboard = styled(_Clipboard).attrs({ strokeWidth: ICON_STROKE_WIDTH })<{ theme: Theme }>`
	color: ${(props): string => props.theme.colors.sessionText};
`;

export const Share = styled(_Share).attrs({ strokeWidth: ICON_STROKE_WIDTH })<{ theme: Theme }>`
	color: ${(props): string => props.theme.colors.sessionText};
`;

export const Trash2 = styled(_Trash2).attrs({ strokeWidth: ICON_STROKE_WIDTH })<{ theme: Theme }>`
	color: ${(props): string => props.theme.colors.sessionText};
`;

export const Save = styled(_Save).attrs({ strokeWidth: ICON_STROKE_WIDTH })<{ theme: Theme }>`
	color: ${(props): string => props.theme.colors.sessionText};
`;

export const ArrowLeft = styled(_ArrowLeft).attrs({ strokeWidth: ICON_STROKE_WIDTH })<{ theme: Theme }>`
	color: ${(props): string => props.theme.colors.text};
`;

export const CircleAlert = styled(_CircleAlert).attrs({ strokeWidth: ICON_STROKE_WIDTH })<{ theme: Theme }>`
	color: ${(props): string => props.theme.colors.text};
`;

export const Info = styled(_Info).attrs({ strokeWidth: ICON_STROKE_WIDTH })<{ theme: Theme }>`
	color: ${(props): string => props.theme.colors.text};
`;

export const ChevronLeft = styled(_ChevronLeft).attrs({ strokeWidth: ICON_STROKE_WIDTH })<{ theme: Theme }>`
	color: ${(props): string => props.theme.colors.sessionText};
`;

export const ChevronRight = styled(_ChevronRight).attrs({ strokeWidth: ICON_STROKE_WIDTH })<{ theme: Theme }>`
	color: ${(props): string => props.theme.colors.sessionText};
`;

export const Check = styled(_Check).attrs({ strokeWidth: ICON_STROKE_WIDTH })<{ theme: Theme }>`
	color: ${(props): string => props.theme.colors.text};
`;

export const Pencil = styled(_Pencil).attrs({ strokeWidth: ICON_STROKE_WIDTH })<{ theme: Theme }>`
	color: ${(props): string => props.theme.colors.text};
`;

export const Edit2 = styled(_Edit2).attrs({ strokeWidth: ICON_STROKE_WIDTH })<{ theme: Theme }>`
	color: ${(props): string => props.theme.colors.sessionText};
`;

export const Eye = styled(_Eye).attrs({ strokeWidth: ICON_STROKE_WIDTH })<{ theme: Theme }>`
	color: ${(props): string => props.theme.colors.sessionText};
`;

export const EyeOff = styled(_EyeOff).attrs({ strokeWidth: ICON_STROKE_WIDTH })<{ theme: Theme }>`
	color: ${(props): string => props.theme.colors.sessionText};
`;

export const KeyRound = styled(_KeyRound).attrs({ strokeWidth: ICON_STROKE_WIDTH })<{ theme: Theme }>`
	color: ${(props): string => props.theme.colors.sessionText};
`;

export const Folder = styled(_Folder).attrs({ strokeWidth: ICON_STROKE_WIDTH })<{ theme: Theme }>`
	color: ${(props): string => props.theme.colors.text};
`;

export const Settings = styled(_Settings).attrs({ strokeWidth: ICON_STROKE_WIDTH })<{ theme: Theme }>`
	color: ${(props): string => props.theme.colors.text};
`;

export const Globe = styled(_Globe).attrs({ strokeWidth: ICON_STROKE_WIDTH })<{ theme: Theme }>`
	color: ${(props): string => props.theme.colors.sessionText};
`;

export const CircleCheck = styled(_CircleCheck).attrs({ strokeWidth: ICON_STROKE_WIDTH })<{ theme: Theme }>`
	color: ${(props): string => props.theme.colors.text};
`;

export const Gift = styled(_Gift).attrs({ strokeWidth: ICON_STROKE_WIDTH })<{ theme: Theme }>`
	color: ${(props): string => props.theme.colors.sessionText};
`;

export const Mail = styled(_Mail).attrs({ strokeWidth: ICON_STROKE_WIDTH })<{ theme: Theme }>`
	color: ${(props): string => props.theme.colors.sessionText};
`;

export const Send = styled(_Send).attrs({ strokeWidth: ICON_STROKE_WIDTH })<{ theme: Theme }>`
	color: ${(props): string => props.theme.colors.sessionText};
`;

interface LinearGradientProps {
	colors?: string[];
	modal?: boolean;
	theme: Theme;
}

export const LinearGradient = styled(_LinearGradient).attrs<LinearGradientProps>(props => ({
	colors:
		props.colors || (props.modal ? props.theme.colors.defaultGradient : props.theme.colors.defaultGradient),
}))``;

interface RadialGradientProps {
	colors?: string[];
	center?: { x: number; y: number };
	radius?: number;
	modal?: boolean;
	positions?: number[];
	theme: Theme;
}

export const RadialGradient = styled(_RadialGradient).attrs<RadialGradientProps>(props => {
	const resolvedColors =
		props.colors || (props.modal ? props.theme.colors.modalGradient : props.theme.colors.gradient);
	return {
		colors: resolvedColors,
		center: props.center || { x: 0.5, y: 0.5 },
		radius: props.radius || 1,
		positions:
			props.positions || resolvedColors.map((_: any, index: number) => index / (resolvedColors.length - 1)),
	};
})``;

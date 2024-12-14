import styled from 'styled-components/native';
import {
  QrCode as _QrCode,
  Clipboard as _Clipboard,
  ChevronLeft as _ChevronLeft,
  Eye as _Eye,
  EyeOff as _EyeOff,
  ArrowRight as _ArrowRight,
} from 'lucide-react-native';
import ActionSheet from 'react-native-actions-sheet';

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
}))``;

export const TextInput = styled.TextInput`
  background-color: ${(props): string => props.theme.colors.background};
  color: ${(props): string => props.theme.colors.text};
`;

export const View = styled.View`
  background-color: ${(props): string => props.theme.colors.background};
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
  background-color: ${(props): string => props.theme.colors.sessionBackground};
  border-color: ${(props): string => props.theme.colors.border};
`;

export const SessionView = styled.View`
  background-color: ${(props): string => props.theme.colors.sessionBackground};
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

export const ForegroundTouchableOpacity = styled.TouchableOpacity`
  background-color: ${(props): string => props.theme.colors.foreground};
`;

export const AvatarRing = styled.View`
  background-color: ${(props): string => props.theme.colors.avatarRing};
  border-color: ${(props): string => props.theme.colors.border};
`;

export const ActionButton = styled.TouchableOpacity`
  background-color: ${(props): string => props.theme.colors.actionButton};
`;

export const ActivityIndicator = styled.ActivityIndicator`
  color: ${(props): string => props.theme.colors.sessionText};
`;

export const QrCode = styled(_QrCode)`
  color: ${(props): string => props.theme.colors.sessionText};
`;

export const ArrowRight = styled(_ArrowRight)`
  color: ${(props): string => props.theme.colors.sessionText};
`;

export const Clipboard = styled(_Clipboard)`
  color: ${(props): string => props.theme.colors.sessionText};
`;

export const ChevronLeft = styled(_ChevronLeft)`
  color: ${(props): string => props.theme.colors.sessionText};
`;

export const Eye = styled(_Eye)`
  color: ${(props): string => props.theme.colors.sessionText};
`;

export const EyeOff = styled(_EyeOff)`
  color: ${(props): string => props.theme.colors.sessionText};
`;

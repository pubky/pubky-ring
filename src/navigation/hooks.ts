import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from './types';

export const useTypedNavigation = (): NativeStackNavigationProp<RootStackParamList> =>
	useNavigation<NativeStackNavigationProp<RootStackParamList>>();

export const useTypedRoute = <T extends keyof RootStackParamList>(): RouteProp<RootStackParamList, T> =>
	useRoute<RouteProp<RootStackParamList, T>>();
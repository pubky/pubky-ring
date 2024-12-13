import React, {
  memo,
  ReactElement,
  useCallback,
  useEffect,
  useMemo,
} from 'react';
import {
  Alert,
  BackHandler,
  StyleSheet,
  TouchableOpacity,
  Text,
  Image,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useDispatch, useSelector} from 'react-redux';
import {RootStackParamList} from '../navigation/types';
import PubkyBox from '../components/PubkyBox';
import EmptyState from '../components/EmptyState';
import {PubkyState} from '../types/pubky';
import {createNewPubky} from '../utils/pubky';
import {showQRScanner, handleClipboardData} from '../utils/helpers';
import {importFile} from '../utils/rnfs';
import {SafeAreaView, ScrollView, View} from '../theme/components.ts';
import {RootState} from '../store';
import {ImportIcon, Plus} from 'lucide-react-native';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

const HomeScreen = (): ReactElement => {
  const navigation = useNavigation<NavigationProp>();
  const dispatch = useDispatch();
  const {pubkys = {}} = useSelector(
    (state: RootState): PubkyState => state.pubky,
  );
  const hasPubkys = useMemo(() => Object.keys(pubkys).length > 0, [pubkys]);

  useEffect(() => {
    const backAction = (): boolean => true;
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction,
    );
    return (): void => backHandler.remove();
  }, []);

  const handlePubkyPress = useCallback(
    (pubky: string) => {
      navigation.navigate('PubkyDetail', {pubky});
    },
    [navigation],
  );

  const createPubky = useCallback(async () => {
    await createNewPubky(dispatch);
  }, [dispatch]);

  const importPubky = useCallback(async () => {
    const res = await importFile(dispatch);
    if (res.isErr()) {
      if (res.error?.message) {
        Alert.alert('Error', res.error.message);
      }
    } else {
      Alert.alert('Success', 'Pubky imported successfully');
    }
  }, [dispatch]);

  return (
    <SafeAreaView style={styles.container}>
      {hasPubkys ? (
        <ScrollView
          contentInsetAdjustmentBehavior="automatic"
          style={styles.scrollView}>
          <Image
            source={require('../images/pubky-ring-logo.png')}
            style={styles.logo}
          />
          {Object.keys(pubkys).map((pubky, index) => (
            <PubkyBox
              key={index}
              index={index}
              pubky={pubky}
              pubkyData={pubkys[pubky]}
              sessionsCount={pubkys[pubky].sessions.length}
              onQRPress={showQRScanner}
              onCopyClipboard={handleClipboardData}
              onPress={handlePubkyPress}
            />
          ))}
        </ScrollView>
      ) : (
        <View style={styles.emptyContainer}>
          <EmptyState />
        </View>
      )}
      {hasPubkys && (
        <View style={styles.absoluteButton}>
          <TouchableOpacity
            style={styles.buttonSecondary}
            onPress={importPubky}>
            <Text style={styles.buttonText}>Import pubky</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.buttonPrimary} onPress={createPubky}>
            <Plus size={16} color="white" />
            <Text style={styles.buttonText}>New pubky</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  logo: {
    width: 171,
    height: 36,
    resizeMode: 'contain',
    display: 'flex',
    alignSelf: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  absoluteButton: {
    position: 'absolute',
    backgroundColor: 'black',
    bottom: 0,
    borderBottomWidth: 0,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.20)',
    paddingVertical: 15,
    borderTopLeftRadius: 50,
    borderTopRightRadius: 50,
    width: '100%',
    display: 'flex',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
  },
  buttonSecondary: {
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
    borderRadius: 64,
    paddingVertical: 20,
    paddingHorizontal: 24,
    alignItems: 'center',
    display: 'flex',
    flexDirection: 'row',
    gap: 4,
  },
  buttonPrimary: {
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
    borderColor: 'white',
    borderWidth: 1,
    borderRadius: 64,
    paddingVertical: 20,
    paddingHorizontal: 24,
    alignItems: 'center',
    display: 'flex',
    flexDirection: 'row',
    gap: 4,
  },
  buttonText: {
    color: 'white',
    fontSize: 15,
    fontWeight: 600,
    lineHeight: 18,
    letterSpacing: 0.2,
  },
  scrollView: {
    flex: 1,
    paddingVertical: 8,
    backgroundColor: 'black',
  },
});

export default memo(HomeScreen);

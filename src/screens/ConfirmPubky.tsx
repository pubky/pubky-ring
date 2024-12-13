import React, {ReactElement, useCallback} from 'react';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import {RootStackParamList} from '../navigation/types';
import {useSelector} from 'react-redux';
import {RootState} from '../store';
import {PubkyState} from '../types/pubky';
import {JdenticonConfig} from 'jdenticon';
import jdenticon from 'jdenticon/standalone';
import {SvgXml} from 'react-native-svg';
import {NavView} from '../theme/components';

type NavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'ConfirmPubky'
>;

const Jdenticon = ({
  value,
  size = 32,
  config,
}: {
  value: string;
  size?: number;
  config?: JdenticonConfig;
}): ReactElement => {
  const svg = jdenticon.toSvg(value, size, config);
  return <SvgXml xml={svg} />;
};

const ConfirmPubkyScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const {pubkys = {}} = useSelector(
    (state: RootState): PubkyState => state.pubky,
  );
  const pubky = Object.values(pubkys)[0];

  const completeOnboarding = useCallback(async () => {
    navigation.replace('Home');
  }, [navigation]);

  return (
    <SafeAreaView style={styles.container}>
      {/* Background image */}
      <Image
        source={require('../images/circle.png')}
        style={styles.backgroundImage}
      />

      {/* Logo */}
      <View style={styles.logoContainer}>
        <Image
          source={require('../images/pubky-ring-logo.png')}
          style={styles.logo}
        />
      </View>

      {/* Keys Image */}
      <View style={styles.keysImageContainer}>
        <Image source={require('../images/key.png')} style={styles.keysImage} />
      </View>

      {/* Content Block: Text and Buttons */}
      <View style={styles.contentBlock}>
        {/* Text */}
        <View style={styles.textContainer}>
          <Text style={styles.title}>Your pubky.</Text>
          <Text style={styles.subtitle}>
            This is your first unique identifier, your pubky. Create as many as
            you need for different purposes. You are your keys.
          </Text>
        </View>

        {/* Show created Pubky */}
        <View style={styles.cardPubky}>
          <View style={styles.detailsPubkyContainer}>
            <NavView style={styles.profileImage}>
              <Jdenticon value={pubky.homeserver} size={60} />
            </NavView>
            <Text style={styles.textPubky}>pk:{pubky.homeserver}</Text>
          </View>
        </View>

        {/* Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.buttonPrimary}
            onPress={completeOnboarding}>
            <Text style={styles.buttonText}>Get started</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
    alignItems: 'center',
  },
  backgroundImage: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 150,
    right: 0,
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  logoContainer: {
    position: 'absolute',
    top: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  logo: {
    width: 171,
    height: 36,
    resizeMode: 'contain',
  },
  keysImageContainer: {
    position: 'absolute',
    top: 40,
    left: 0,
    right: 30,
    alignItems: 'center',
  },
  keysImage: {
    width: 443,
    height: 443,
    resizeMode: 'contain',
  },
  contentBlock: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingBottom: 35,
    width: '100%',
  },
  textContainer: {
    paddingHorizontal: 32,
  },
  title: {
    color: 'white',
    fontSize: 48,
    fontWeight: 700,
    lineHeight: 48,
  },
  subtitle: {
    color: 'rgba(255, 255, 255, 0.80)',
    fontSize: 17,
    fontWeight: 400,
    lineHeight: 22,
    letterSpacing: 0.4,
  },
  cardPubky: {
    padding: 24,
    justifyContent: 'center',
    alignItems: 'flex-start',
    borderRadius: 16,
    backgroundColor: '#262626',
    marginTop: 20,
    marginHorizontal: 32,
  },
  detailsPubkyContainer: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  profileImage: {
    width: 32,
    height: 32,
    borderRadius: 30,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
  },
  textPubky: {
    color: 'white',
    fontSize: 15,
    fontWeight: 600,
    lineHeight: 20,
    letterSpacing: 0.4,
    paddingRight: 32,
  },
  buttonContainer: {
    flexDirection: 'row',
    marginTop: 20,
    justifyContent: 'space-between',
    width: '100%',
    gap: 12,
    paddingHorizontal: 32,
  },
  buttonSecondary: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
    borderRadius: 64,
    paddingVertical: 20,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  buttonPrimary: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
    borderColor: 'white',
    borderWidth: 1,
    borderRadius: 64,
    paddingVertical: 20,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 15,
    fontWeight: 600,
    lineHeight: 18,
    letterSpacing: 0.2,
  },
});

export default ConfirmPubkyScreen;

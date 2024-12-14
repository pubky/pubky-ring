import React from 'react';
import {StyleSheet, View, Image} from 'react-native';

const LoadingScreen = () => {
  return (
    <View style={styles.container}>
      <Image source={require('../images/circle.png')} style={styles.circle} />
      <Image
        source={require('../images/pubky-ring-logo.png')}
        style={styles.logo}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  circle: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  logo: {
    resizeMode: 'contain',
    width: 228,
    height: 48,
    zIndex: 1,
  },
});

export default LoadingScreen;

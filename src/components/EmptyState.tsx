import React, {ReactElement, useCallback} from 'react';
import {StyleSheet, Image, TouchableOpacity} from 'react-native';
import {View, Text} from '../theme/components.ts';
import {ArrowRight, Plus} from 'lucide-react-native';
import {createNewPubky} from '../utils/pubky.ts';
import {useDispatch} from 'react-redux';

const EmptyState = (): ReactElement => {
  const dispatch = useDispatch();

  const createPubky = useCallback(async () => {
    await createNewPubky(dispatch);
  }, [dispatch]);

  return (
    <View style={styles.container}>
      <Image
        source={require('../images/pubky-ring-logo.png')}
        style={styles.logo}
      />
      <View style={styles.cardEmpty}>
        <View style={styles.emptyUser}>
          <View style={styles.image} />
          <View style={styles.textContainer}>
            <Text style={styles.name}>pubky</Text>
            <Text style={styles.pubky}>pk:xxxxx..xxxxx</Text>
          </View>
          <View style={styles.buttonArrow}>
            <ArrowRight size={24} color={'white'} />
          </View>
        </View>
        <TouchableOpacity style={styles.buttonSecondary} onPress={createPubky}>
          <Plus size={16} color={'white'} />
          <Text style={styles.buttonText}>Create pubky</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
    alignItems: 'center',
  },
  logo: {
    width: 171,
    height: 36,
    resizeMode: 'contain',
    marginTop: 20,
  },
  cardEmpty: {
    display: 'flex',
    padding: 24,
    marginTop: 40,
    marginHorizontal: 20,
    flexDirection: 'column',
    alignItems: 'flex-start',
    backgroundColor: 'black',
    gap: '24',
    alignSelf: 'stretch',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FFF',
    borderStyle: 'dashed',
  },
  emptyUser: {
    display: 'flex',
    flexDirection: 'row',
    gap: 18,
    alignSelf: 'stretch',
    backgroundColor: 'black',
  },
  image: {
    width: 48,
    height: 48,
    backgroundColor: 'black',
    borderRadius: '100%',
    borderWidth: 1,
    borderColor: '#FFF',
    borderStyle: 'dashed',
  },
  textContainer: {
    backgroundColor: 'black',
  },
  name: {
    color: '#fff',
    fontSize: 26,
    fontWeight: 300,
    lineHeight: 26,
  },
  pubky: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 600,
    lineHeight: 20,
    letterSpacing: 0.4,
  },
  buttonArrow: {
    backgroundColor: 'black',
    display: 'flex',
    justifyContent: 'center',
    marginLeft: 'auto',
  },
  buttonSecondary: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
    borderRadius: 64,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    display: 'flex',
    flexDirection: 'row',
    gap: 4,
    justifyContent: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 15,
    fontWeight: 600,
    lineHeight: 18,
    letterSpacing: 0.2,
  },
});

export default EmptyState;

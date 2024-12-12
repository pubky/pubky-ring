import React, {memo, ReactElement, useCallback, useMemo, useState} from 'react';
import {StyleSheet, View, Text} from 'react-native';
import {SvgXml} from 'react-native-svg';
import jdenticon, {JdenticonConfig} from 'jdenticon';
import {Pubky} from '../types/pubky.ts';
import {Dispatch} from 'redux';
import {useDispatch} from 'react-redux';
import {
  SessionText,
  TouchableOpacity,
  Box,
  ForegroundView,
  ActivityIndicator,
  QrCode,
  Clipboard,
  NavView,
} from '../theme/components.ts';
import {ArrowRight} from 'lucide-react-native';

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

interface PubkyBoxProps {
  pubky: string;
  pubkyData: Pubky;
  sessionsCount?: number;
  onQRPress: (
    pubky: string,
    pubkyData: Pubky,
    dispatch: Dispatch,
    onComplete?: () => void,
  ) => Promise<string>;
  onCopyClipboard: (
    pubky: string,
    pubkyData: Pubky,
    dispatch: Dispatch,
  ) => void;
  onPress: (data: string) => void;
  index: number;
}

const truncatePubky = (pubky: string): string => {
  if (pubky.length <= 16) {
    return pubky;
  }
  return `${pubky.substring(0, 5)}...${pubky.substring(pubky.length - 5)}`;
};

const PubkyBox = ({
  pubky,
  pubkyData,
  sessionsCount = 0,
  onQRPress,
  onCopyClipboard,
  onPress,
  index,
}: PubkyBoxProps): ReactElement => {
  const [isQRLoading, setIsQRLoading] = useState(false);
  const [isClipboardLoading, setIsClipboardLoading] = useState(false);
  const dispatch = useDispatch();

  const handleQRPress = useCallback(async () => {
    setIsQRLoading(true);
    try {
      await onQRPress(pubky, pubkyData, dispatch);
    } finally {
      setIsQRLoading(false);
    }
  }, [dispatch, onQRPress, pubky, pubkyData]);

  const handleCopyClipboard = useCallback(async () => {
    setIsClipboardLoading(true);
    try {
      onCopyClipboard(pubky, pubkyData, dispatch);
    } finally {
      setIsClipboardLoading(false);
    }
  }, [dispatch, onCopyClipboard, pubky, pubkyData]);

  const handleOnPress = useCallback(() => {
    onPress(pubky);
  }, [onPress, pubky]);

  const publicKey = useMemo(
    () => (pubky.startsWith('pk:') ? pubky.slice(3) : pubky),
    [pubky],
  );

  return (
    <View style={styles.container}>
      <Box onPress={handleOnPress} style={styles.box} activeOpacity={0.7}>
        <ForegroundView style={styles.profileImageContainer}>
          <NavView style={styles.profileImage}>
            <Jdenticon value={publicKey} size={60} />
          </NavView>
        </ForegroundView>

        <ForegroundView style={styles.contentContainer}>
          <Text style={styles.nameText} numberOfLines={1}>
            {pubkyData.name || `pubky #${index + 1}`}
          </Text>
          <SessionText style={styles.pubkyText}>
            pk:{truncatePubky(pubky)} {sessionsCount}
          </SessionText>
        </ForegroundView>

        <ForegroundView style={styles.buttonArrow}>
          <ArrowRight size={24} color={'white'} />
        </ForegroundView>
      </Box>
      <ForegroundView style={styles.buttonsContainer}>
        <TouchableOpacity
          style={[
            styles.actionButton2,
            isClipboardLoading && styles.actionButtonDisabled,
          ]}
          onPressIn={handleCopyClipboard}
          disabled={isClipboardLoading}>
          {isClipboardLoading ? (
            <ActivityIndicator size="small" />
          ) : (
            <Clipboard size={16} color={'white'} />
          )}
          <Text style={styles.buttonText}>Copy</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.actionButton,
            isQRLoading && styles.actionButtonDisabled,
          ]}
          onPressIn={handleQRPress}
          disabled={isQRLoading}>
          {isQRLoading ? (
            <ActivityIndicator size="small" />
          ) : (
            <QrCode size={16} color={'white'} />
          )}
          <Text style={styles.buttonText}>Authorize</Text>
        </TouchableOpacity>
      </ForegroundView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '90%',
    borderRadius: 16,
    alignSelf: 'center',
    padding: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.20)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    marginBottom: 20,
  },
  box: {
    backgroundColor: 'transparent',
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileImageContainer: {
    marginRight: 12,
    backgroundColor: 'transparent',
  },
  profileImage: {
    width: 48,
    height: 48,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: '#ccc',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  nameText: {
    color: 'white',
    fontSize: 26,
    fontWeight: 300,
    lineHeight: 26,
  },
  buttonArrow: {
    backgroundColor: 'transparent',
    display: 'flex',
    justifyContent: 'center',
    marginLeft: 'auto',
  },
  pubkyText: {
    color: 'white',
    fontSize: 15,
    fontWeight: 600,
    lineHeight: 20,
    letterSpacing: 0.4,
  },
  buttonsContainer: {
    marginTop: 20,
    justifyContent: 'center',
    backgroundColor: 'transparent',
    display: 'flex',
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  actionButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
    borderColor: 'white',
    borderWidth: 1,
    borderRadius: 64,
    paddingVertical: 15,
    paddingHorizontal: 24,
    alignItems: 'center',
    display: 'flex',
    flexDirection: 'row',
    gap: 4,
  },
  actionButton2: {
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
    borderRadius: 64,
    paddingVertical: 15,
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
  actionButtonDisabled: {
    opacity: 0.7,
  },
});

export default memo(PubkyBox);

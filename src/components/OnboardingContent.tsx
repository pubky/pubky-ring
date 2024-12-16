import React, { ReactElement } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
} from 'react-native';

type OnboardingContentProps = {
    importPubky: () => void;
    createPubky: () => void;
};

const OnboardingContent = ({ importPubky, createPubky }: OnboardingContentProps): ReactElement => {
    return (
        <View style={styles.container}>
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
                <Image
                    source={require('../images/keyring.png')}
                    style={styles.keysImage}
                />
            </View>

            {/* Content Block: Text and Buttons */}
            <View style={styles.contentBlock}>
                {/* Text */}
                <View style={styles.textContainer}>
                    <Text style={styles.title}>Keychain for the next web.</Text>
                    <Text style={styles.subtitle}>
                        Pubky Ring enables you to securely authorize services and manage
                        your pubkys, devices, and sessions.
                    </Text>
                </View>

                {/* Buttons */}
                <View style={styles.buttonContainer}>
                    <TouchableOpacity
                        style={styles.buttonSecondary}
                        onPress={importPubky}>
                        <Text style={styles.buttonText}>Import pubky</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.buttonPrimary} onPress={createPubky}>
                        <Text style={styles.buttonText}>New pubky</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
};

// Move your existing styles here
const styles = StyleSheet.create({
    container: {
        flex: 1,
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
        top: 90,
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
    buttonContainer: {
        flexDirection: 'row',
        marginTop: 20, // Spazio tra il testo e i bottoni
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

export default OnboardingContent;

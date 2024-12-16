import React, {
    memo,
    ReactElement,
    useCallback,
} from 'react';
import {
    Alert,
    StyleSheet,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { PubkyState } from '../types/pubky';
import { createNewPubky } from '../utils/pubky';
import { importFile } from '../utils/rnfs';
import {
    ActionButton,
    Text,
    Plus,
} from '../theme/components.ts';
import { RootState } from '../store';

const CreatePubkyButton = (): ReactElement => {
    const dispatch = useDispatch();
    const { pubkys = {} } = useSelector(
        (state: RootState): PubkyState => state.pubky,
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
        <ActionButton
            style={styles.buttonPrimary}
            onPress={createPubky}
            onLongPress={importPubky}
        >
            <Plus size={16} />
            <Text style={styles.buttonText}>Create another pubky</Text>
        </ActionButton>
    );
};

const styles = StyleSheet.create({
    buttonPrimary: {
        width: '90%',
        borderRadius: 64,
        paddingVertical: 20,
        paddingHorizontal: 24,
        alignItems: 'center',
        display: 'flex',
        flexDirection: 'row',
        gap: 4,
        alignSelf: 'center',
        alignContent: 'center',
        justifyContent: 'center',
    },
    buttonText: {
        fontSize: 15,
        fontWeight: 600,
        lineHeight: 18,
        letterSpacing: 0.2,
    },
});

export default memo(CreatePubkyButton);

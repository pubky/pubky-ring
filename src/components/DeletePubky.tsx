import React, {
	memo,
	ReactElement,
	useCallback,
	useMemo,
} from 'react';
import { SheetManager } from 'react-native-actions-sheet';
import PubkyCard from './PubkyCard.tsx';
import {
	ModalWrapper,
	ModalTitle,
	ModalMessage,
	ModalButton,
	ModalButtonContainer
} from './shared';

const DeletePubky = ({ payload }: {
	payload: {
		publicKey?: string;
		onDelete: () => void;
	};
}): ReactElement => {
	const { onDelete } = useMemo(() => payload, [payload]);
	const publicKey = useMemo(() => payload?.publicKey ?? '', [payload]);

	const closeSheet = useCallback((): void => {
		SheetManager.hide('delete-pubky').then();
	}, []);

	return (
		<ModalWrapper
			id="delete-pubky"
			onClose={closeSheet}
			keyboardHandlerEnabled={false}
			showToast={false}
		>
			<ModalTitle>Delete Pubky</ModalTitle>
			<ModalMessage>
				Are you sure you want to delete pubky:
			</ModalMessage>
			<PubkyCard publicKey={publicKey} />
			<ModalButtonContainer>
				<ModalButton
					text="Cancel"
					variant="secondary"
					onPress={closeSheet}
				/>
				<ModalButton
					text="Delete"
					variant="danger"
					onPress={onDelete}
				/>
			</ModalButtonContainer>
		</ModalWrapper>
	);
};

export default memo(DeletePubky);

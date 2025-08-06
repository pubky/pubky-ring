import { SheetManager } from 'react-native-actions-sheet';

export const showAddPubkySheet = (
	createPubky: () => void,
	importPubky: (mnemonic?: string) => Promise<any>,
): void => {
	SheetManager.show('add-pubky', {
		payload: { createPubky, importPubky },
		onClose: () => SheetManager.hide('add-pubky'),
	});
};

export const hideAllSheets = async (): Promise<void> => {
	await SheetManager.hideAll();
};

import { lazy } from 'react';
import { registerSheet, SheetDefinition } from 'react-native-actions-sheet';

const QRScanner = lazy(() => import('../components/QRScanner.tsx'));
const BackupPrompt = lazy(() => import('../components/BackupPrompt.tsx'));
const ConfirmAuth = lazy(() => import('../components/ConfirmAuth.tsx'));
const DeletePubky = lazy(() => import('../components/DeletePubky.tsx'));
const AddPubky = lazy(() => import('../components/AddPubky.tsx'));
const NewPubkySetup = lazy(() => import('../components/PubkySetup/NewPubkySetup.tsx'));
const SelectBackupPreference = lazy(() => import('../components/SelectBackupPreference.tsx'));
const EditPubky = lazy(() => import('../components/EditPubky.tsx'));
const SelectPubky = lazy(() => import('../components/SelectPubky.tsx'));
const RecoveryPhrasePrompt = lazy(() => import('../components/RecoveryPhrasePrompt.tsx'));

registerSheet('camera', QRScanner as any);
registerSheet('backup-prompt', BackupPrompt as any);
registerSheet('recovery-phrase-prompt', RecoveryPhrasePrompt as any);
registerSheet('confirm-auth', ConfirmAuth as any);
registerSheet('delete-pubky', DeletePubky as any);
registerSheet('new-pubky-setup', NewPubkySetup as any);
registerSheet('select-backup-preference', SelectBackupPreference as any);
registerSheet('edit-pubky', EditPubky as any);
registerSheet('add-pubky', AddPubky as any);
registerSheet('select-pubky', SelectPubky as any);

declare module 'react-native-actions-sheet' {
	interface Sheets {
		'camera': SheetDefinition;
		'backup-prompt': SheetDefinition;
		'recovery-phrase-prompt': SheetDefinition<{
			payload: {
				pubky: string;
				mnemonic: string;
				onClose: () => void;
			};
		}>;
		'confirm-auth': SheetDefinition;
		'delete-pubky': SheetDefinition;
		'new-pubky-setup': SheetDefinition;
		'select-backup-preference': SheetDefinition;
		'edit-pubky': SheetDefinition;
		'add-pubky': SheetDefinition;
		'select-pubky': SheetDefinition;
	}
}

export {};

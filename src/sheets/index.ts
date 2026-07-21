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
const ImportSuccessSheet = lazy(() => import('../components/ImportSuccessSheet.tsx'));
const MigrateModal = lazy(() => import('../components/MigrateModal.tsx'));
const LoadingModal = lazy(() => import('../components/LoadingModal.tsx'));
const LegacySunsetSheet = lazy(() => import('../components/LegacySunsetSheet.tsx'));

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
registerSheet('import-success', ImportSuccessSheet as any);
registerSheet('migrate-modal', MigrateModal as any);
registerSheet('loading', LoadingModal as any);
registerSheet('legacy-sunset', LegacySunsetSheet as any);

declare module 'react-native-actions-sheet' {
	interface Sheets {
		camera: SheetDefinition;
		'backup-prompt': SheetDefinition;
		'recovery-phrase-prompt': SheetDefinition<{
			payload: {
				pubky: string;
				mnemonic: string;
			};
		}>;
		'confirm-auth': SheetDefinition;
		'delete-pubky': SheetDefinition;
		'new-pubky-setup': SheetDefinition;
		'select-backup-preference': SheetDefinition;
		'edit-pubky': SheetDefinition;
		'add-pubky': SheetDefinition;
		'select-pubky': SheetDefinition;
		'import-success': SheetDefinition;
		'migrate-modal': SheetDefinition;
		loading: SheetDefinition<{
			payload?: {
				modalTitle?: string;
				title?: string;
				description?: string;
				waitText?: string;
				onClose?: () => void;
			};
		}>;
		'legacy-sunset': SheetDefinition<{
			payload: import('../components/LegacySunsetSheet.tsx').LegacySunsetSheetPayload;
		}>;
	}
}

export {};

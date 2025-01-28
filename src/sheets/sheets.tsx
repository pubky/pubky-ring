import { registerSheet, SheetDefinition } from 'react-native-actions-sheet';
import QRScanner from '../components/QRScanner.tsx';
import BackupPrompt from '../components/BackupPrompt.tsx';
import ConfirmAuth from '../components/ConfirmAuth.tsx';
import DeletePubky from '../components/DeletePubky.tsx';
import NamePubkyPrompt from '../components/NamePubkyPrompt.tsx';
registerSheet('camera', QRScanner);
registerSheet('backup-prompt', BackupPrompt);
registerSheet('confirm-auth', ConfirmAuth);
registerSheet('delete-pubky', DeletePubky);
registerSheet('name-pubky-prompt', NamePubkyPrompt);

declare module 'react-native-actions-sheet' {
    interface Sheets {
        'camera': SheetDefinition;
        'backup-prompt': SheetDefinition;
        'confirm-auth': SheetDefinition;
        'delete-pubky': SheetDefinition;
        'name-pubky-prompt': SheetDefinition;
    }
}

export {};

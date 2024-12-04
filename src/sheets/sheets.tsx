import { registerSheet, SheetDefinition } from 'react-native-actions-sheet';
import QRScanner from '../components/QRScanner.tsx';
import BackupPrompt from '../components/BackupPrompt.tsx';
import ConfirmAuth from '../components/ConfirmAuth.tsx';
registerSheet('camera', QRScanner);
registerSheet('backup-prompt', BackupPrompt);
registerSheet('confirm-auth', ConfirmAuth);

declare module 'react-native-actions-sheet' {
    interface Sheets {
        'camera': SheetDefinition;
        'backup-prompt': SheetDefinition;
        'confirm-auth': SheetDefinition
    }
}

export {};

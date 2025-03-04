import { registerSheet, SheetDefinition } from 'react-native-actions-sheet';
import QRScanner from '../components/QRScanner.tsx';
import BackupPrompt from '../components/BackupPrompt.tsx';
import ConfirmAuth from '../components/ConfirmAuth.tsx';
import DeletePubky from '../components/DeletePubky.tsx';
import AddPubky from '../components/AddPubky.tsx';
import NamePubkyPrompt from '../components/NamePubkyPrompt.tsx';
import SelectPubky from '../components/SelectPubky.tsx';

registerSheet('camera', QRScanner);
registerSheet('backup-prompt', BackupPrompt);
registerSheet('confirm-auth', ConfirmAuth);
registerSheet('delete-pubky', DeletePubky);
registerSheet('name-pubky-prompt', NamePubkyPrompt);
registerSheet('add-pubky', AddPubky);
registerSheet('select-pubky', SelectPubky);

declare module 'react-native-actions-sheet' {
    interface Sheets {
        'camera': SheetDefinition;
        'backup-prompt': SheetDefinition;
        'confirm-auth': SheetDefinition;
        'delete-pubky': SheetDefinition;
        'name-pubky-prompt': SheetDefinition;
        'add-pubky': SheetDefinition;
        'select-pubky': SheetDefinition;
    }
}

export {};

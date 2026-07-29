import type { PubkyAuthDetails } from '@synonymdev/react-native-pubky';
import type { InputSource, XCallbackParams } from '../utils/inputParser.ts';

export type SheetId =
	| 'backup'
	| 'auth'
	| 'delete-pubky'
	| 'edit-pubky'
	| 'add-pubky'
	| 'migrate'
	| 'legacy-sunset';

export type BackupFileScreenParams = {
	pubky: string;
};

export type ImportFileScreenParams = {
	fileName: string;
	fileDate?: number;
	content: string;
};

export interface RecoveryPhraseScreenPayload {
	pubky: string;
	mnemonic: string;
}

export interface ConfirmAuthPayload {
	pubky: string;
	authUrl: string;
	authDetails: PubkyAuthDetails;
	xCallback?: XCallbackParams;
}

export interface DeletePubkySheetParams {
	pubky: string;
}

export interface BackupPreferenceScreenPayload {
	pubky: string;
}

export type BackupStackParamList = {
	BackupPreferenceScreen: BackupPreferenceScreenPayload;
	BackupFileScreen: BackupFileScreenParams;
	RecoveryPhraseScreen: RecoveryPhraseScreenPayload;
};

export type BackupSheetScreenParams = {
	[TRouteName in keyof BackupStackParamList]: {
		screen: TRouteName;
		params: BackupStackParamList[TRouteName];
	};
}[keyof BackupStackParamList];

export type BackupSheetParams = BackupSheetScreenParams;

export interface EditPubkySheetParams {
	pubky: string;
}

export type AddPubkyImportSuccessParams = {
	pubky: string;
	isNewPubky: boolean;
};

export type AddPubkyScannerParams = {
	mode: 'signup' | 'import';
};

export type AddPubkyStackParamList = {
	Main: undefined;
	Loading: undefined;
	Scanner: AddPubkyScannerParams;
	PubkyReview: {
		pubky: string;
	};
	Homeserver: {
		pubky: string;
	};
	InviteCode: {
		pubky: string;
	};
	RequestInvite: {
		pubky: string;
	};
	Welcome: {
		pubky: string;
		isInvite?: boolean;
	};
	ImportOptions: undefined;
	ImportFileScreen: ImportFileScreenParams;
	ImportMnemonic: undefined;
	ImportSuccess: AddPubkyImportSuccessParams;
};

export type AddPubkySheetScreenParams = {
	[TRouteName in keyof AddPubkyStackParamList]: undefined extends AddPubkyStackParamList[TRouteName]
		? {
				screen: TRouteName;
				params?: AddPubkyStackParamList[TRouteName];
			}
		: {
				screen: TRouteName;
				params: AddPubkyStackParamList[TRouteName];
			};
}[keyof AddPubkyStackParamList];

export type AddPubkySheetParams = AddPubkySheetScreenParams | undefined;

export interface SelectPubkyPayload {
	deepLink: string;
	source: InputSource;
}

export type AuthScannerParams = {
	pubky: string;
};

export type AuthStackParamList = {
	SelectPubky: SelectPubkyPayload;
	ConfirmAuth: ConfirmAuthPayload;
	Scanner: AuthScannerParams;
};

export type AuthSheetScreenParams = {
	[TRouteName in keyof AuthStackParamList]: {
		screen: TRouteName;
		params: AuthStackParamList[TRouteName];
	};
}[keyof AuthStackParamList];

export type AuthSheetParams = AuthSheetScreenParams;

export type MigrateStackParamList = {
	QRCode: undefined;
	Scanner: undefined;
};

export type MigrateSheetScreenParams = {
	screen: keyof MigrateStackParamList;
};

export type MigrateSheetParams = MigrateSheetScreenParams | undefined;

export type LegacySunsetSheetParams = {
	apkUrl: string;
};

export type SheetParamsById = {
	backup: BackupSheetParams;
	auth: AuthSheetParams;
	'delete-pubky': DeletePubkySheetParams;
	'edit-pubky': EditPubkySheetParams;
	'add-pubky': AddPubkySheetParams;
	migrate: MigrateSheetParams;
	'legacy-sunset': LegacySunsetSheetParams;
};

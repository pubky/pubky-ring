import { Pubky } from '../types/pubky.ts';
import type {
	AddPubkySheetParams,
	AuthSheetParams,
	BackupSheetParams,
	DeletePubkySheetParams,
	EditPubkySheetParams,
	LegacySunsetSheetParams,
	MigrateSheetParams,
} from '../sheets/types.ts';

export interface PubkyData extends Pubky {
	pubky: string;
}

export type RootStackParamList = {
	TermsOfUse?: undefined;
	Onboarding: undefined;
	Home: undefined;
	About: undefined;
	Settings:
		| {
				showSecretSettings?: boolean;
		  }
		| undefined;
	PubkyDetail: {
		pubky: string;
		index: number;
	};
	BackupSheet: BackupSheetParams;
	AuthSheet: AuthSheetParams;
	DeletePubkySheet: DeletePubkySheetParams;
	EditPubkySheet: EditPubkySheetParams;
	AddPubkySheet: AddPubkySheetParams;
	MigrateSheet: MigrateSheetParams;
	LegacySunsetSheet: LegacySunsetSheetParams;
};

import { GrantInfo, Pubky } from '../types/pubky.ts';
import type {
	AddPubkySheetParams,
	AuthSheetParams,
	BackupSheetParams,
	DeletePubkySheetParams,
	EditPubkySheetParams,
	LegacySunsetSheetParams,
	MigrateSheetParams,
	RevokeGrantSheetParams,
	UseExternalPubkySheetParams,
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
	AuthorizedGrant: {
		pubky: string;
		sessionId: string;
		grant: GrantInfo;
	};
	BackupSheet: BackupSheetParams;
	AuthSheet: AuthSheetParams;
	DeletePubkySheet: DeletePubkySheetParams;
	EditPubkySheet: EditPubkySheetParams;
	AddPubkySheet: AddPubkySheetParams;
	MigrateSheet: MigrateSheetParams;
	RevokeGrantSheet: RevokeGrantSheetParams;
	LegacySunsetSheet: LegacySunsetSheetParams;
	UseExternalPubkySheet: UseExternalPubkySheetParams;
};

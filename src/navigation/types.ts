import { Pubky } from '../types/pubky.ts';

export interface PubkyData extends Pubky {
  pubky: string;
}

export type RootStackParamList = {
  TermsOfUse?: undefined;
  Onboarding: undefined;
  ConfirmPubky: undefined;
  Home: undefined;
  Settings: undefined;
  PubkyDetail: {
    pubky: string;
    index: number;
  };
  EditPubky: {
    pubkyData: PubkyData;
  };
};

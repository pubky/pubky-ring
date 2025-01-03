import { Pubky } from '../types/pubky.ts';

export interface PubkyData extends Pubky {
  pubky: string;
}

export type RootStackParamList = {
  Onboarding: undefined;
  ConfirmPubky: undefined;
  Home: undefined;
  Settings: undefined;
  PubkyDetail: {
    pubky: string;
  };
  EditPubky: {
    pubkyData: PubkyData;
  };
};

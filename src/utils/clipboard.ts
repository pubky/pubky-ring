import Clipboard from '@react-native-clipboard/clipboard';

export const copyToClipboard = (data: string): void => Clipboard.setString(data);

export const readFromClipboard = async (): Promise<string> => Clipboard.getString();

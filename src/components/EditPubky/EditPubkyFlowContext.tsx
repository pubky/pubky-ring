import React, { createContext, ReactElement, ReactNode, useCallback, useContext, useMemo, useState } from 'react';
interface EditPubkyFlowContextValue {
	selectedHomeserver: string;
	setSelectedHomeserver: (homeserver: string) => void;
	signupTokensByHomeserver: Record<string, string>;
	setSignupTokenForHomeserver: (homeserver: string, signupToken: string) => void;
	resetVersion: number;
	resetFlow: () => void;
}

const EditPubkyFlowContext = createContext<EditPubkyFlowContextValue | undefined>(undefined);

export const EditPubkyFlowProvider = ({ children }: { children: ReactNode }): ReactElement => {
	const [selectedHomeserver, setSelectedHomeserver] = useState('');
	const [signupTokensByHomeserver, setSignupTokensByHomeserver] = useState<Record<string, string>>({});
	const [resetVersion, setResetVersion] = useState(0);

	const setSignupTokenForHomeserver = useCallback((homeserver: string, signupToken: string): void => {
		setSignupTokensByHomeserver(currentTokens => {
			const nextTokens = { ...currentTokens };
			if (signupToken) {
				nextTokens[homeserver] = signupToken;
			} else {
				delete nextTokens[homeserver];
			}
			return nextTokens;
		});
	}, []);

	const resetFlow = useCallback((): void => {
		setSelectedHomeserver('');
		setSignupTokensByHomeserver({});
		setResetVersion(version => version + 1);
	}, []);

	const value = useMemo(
		() => ({
			selectedHomeserver,
			setSelectedHomeserver,
			signupTokensByHomeserver,
			setSignupTokenForHomeserver,
			resetVersion,
			resetFlow,
		}),
		[resetFlow, resetVersion, selectedHomeserver, setSignupTokenForHomeserver, signupTokensByHomeserver],
	);

	return <EditPubkyFlowContext.Provider value={value}>{children}</EditPubkyFlowContext.Provider>;
};

export const useEditPubkyFlow = (): EditPubkyFlowContextValue => {
	const context = useContext(EditPubkyFlowContext);

	if (!context) {
		throw new Error('useEditPubkyFlow must be used within EditPubkyFlowProvider');
	}

	return context;
};

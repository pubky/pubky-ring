import React, {
	createContext,
	ReactElement,
	ReactNode,
	useCallback,
	useContext,
	useMemo,
	useState,
} from 'react';
interface EditPubkyFlowContextValue {
	selectedHomeserver: string;
	setSelectedHomeserver: (homeserver: string) => void;
	signupTokensByHomeserver: Record<string, string>;
	setSignupTokenForHomeserver: (homeserver: string, signupToken: string) => void;
	error: string;
	setError: (error: string) => void;
	errorHomeserver: string;
	setErrorHomeserver: (homeserver: string) => void;
	inviteRejected: boolean;
	setInviteRejected: (rejected: boolean) => void;
}

const EditPubkyFlowContext = createContext<EditPubkyFlowContextValue | undefined>(undefined);

export const EditPubkyFlowProvider = ({
	children,
	initialHomeserver = '',
}: {
	children: ReactNode;
	initialHomeserver?: string;
}): ReactElement => {
	const [selectedHomeserver, setSelectedHomeserver] = useState(initialHomeserver);
	const [signupTokensByHomeserver, setSignupTokensByHomeserver] = useState<Record<string, string>>({});
	const [error, setError] = useState('');
	const [errorHomeserver, setErrorHomeserver] = useState('');
	const [inviteRejected, setInviteRejected] = useState(false);

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
		// All accepted draft input, including scans of the same code, clears previous validation.
		setError('');
		setErrorHomeserver('');
		setInviteRejected(false);
	}, []);

	const value = useMemo(
		() => ({
			selectedHomeserver,
			setSelectedHomeserver,
			signupTokensByHomeserver,
			setSignupTokenForHomeserver,
			error,
			setError,
			errorHomeserver,
			setErrorHomeserver,
			inviteRejected,
			setInviteRejected,
		}),
		[
			selectedHomeserver,
			setSignupTokenForHomeserver,
			signupTokensByHomeserver,
			error,
			errorHomeserver,
			inviteRejected,
		],
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

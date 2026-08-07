import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Keyboard } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../types';
import { getHomeservers, getPubky } from '../../store/selectors/pubkySelectors.ts';
import { truncatePubky } from '../../utils/pubky.ts';
import { defaultHomeserver } from '../../store/shapes/pubky.ts';
import { useEditPubkyFlow } from './EditPubkyFlowContext.tsx';
import { submitEditPubky } from '../../utils/actions/editPubkyAction.ts';
import { getSignupTokenErrorDescription } from '../../utils/signupErrors.ts';

const MAX_NAME_LENGTH = 50;

interface EditPubkyFormState {
	title: string;
	newPubkyName: string;
	nameError: string;
	haveFieldsChanged: boolean;
	selectedHomeserverName: string;
	signedUp: boolean;
	error: string;
	loading: boolean;
	handleNameChange: (text: string) => void;
	handleNameSubmit: () => void;
	handleSubmit: () => void;
	handleRemoveHomeserver: () => void;
	clearErrorState: () => void;
}

export const useEditPubkyForm = (pubky: string, onClose: () => void): EditPubkyFormState => {
	const { t } = useTranslation();
	const storedPubkyData = useSelector((state: RootState) => getPubky(state, pubky));
	const storedName = storedPubkyData?.name ?? '';
	const storedHomeserver = storedPubkyData?.homeserver ?? '';
	const storedSignedUp = storedPubkyData?.signedUp ?? false;
	const homeservers = useSelector(getHomeservers);
	const {
		selectedHomeserver: homeServer,
		setSelectedHomeserver,
		signupTokensByHomeserver,
		setSignupTokenForHomeserver,
		resetVersion,
	} = useEditPubkyFlow();
	const signupToken = signupTokensByHomeserver[homeServer] ?? '';
	const [loading, setLoading] = useState(false);
	const [newPubkyName, setNewPubkyName] = useState(storedName);
	const [nameError, setNameError] = useState<string>(
		newPubkyName.length > 20 ? `${MAX_NAME_LENGTH - newPubkyName.length} / ${MAX_NAME_LENGTH}` : '',
	);
	const dispatch = useDispatch();
	const [error, setError] = useState('');
	const initializedPubkyRef = useRef('');

	useEffect(() => {
		if (initializedPubkyRef.current === `${pubky}:${resetVersion}`) {
			return;
		}

		setSelectedHomeserver(storedHomeserver);
		initializedPubkyRef.current = `${pubky}:${resetVersion}`;
	}, [pubky, resetVersion, setSelectedHomeserver, storedHomeserver]);

	const clearErrorState = useCallback(() => {
		if (error) {
			setError('');
		}
	}, [error]);

	const handleSubmit = useCallback(async () => {
		try {
			Keyboard.dismiss();
			setLoading(true);

			const res = await submitEditPubky({
				pubky,
				storedPubkyData,
				name: newPubkyName.trim(),
				homeserver: homeServer,
				signupToken,
				dispatch,
			});
			if (!res.success) {
				if (res.type === 'signup') {
					setError(
						(res.message ? getSignupTokenErrorDescription(res.message) : undefined) ??
							t('editPubkySheet.unableToSignUp'),
					);
				} else if (res.type === 'signin') {
					setError(t('editPubkySheet.unableToSignIn', { error: res.message }));
				} else {
					setError(res.message ?? t('pubkyErrors.unableToGetSecretKey'));
				}
				return;
			}

			setError('');
			onClose();
		} finally {
			setLoading(false);
		}
	}, [pubky, newPubkyName, homeServer, storedPubkyData, signupToken, dispatch, onClose, t]);

	const handleNameChange = useCallback((text: string) => {
		if (text.length > MAX_NAME_LENGTH) {
			return;
		}
		setNewPubkyName(text);
		setNameError(text.length > 20 ? `${MAX_NAME_LENGTH - text.length} / ${MAX_NAME_LENGTH}` : '');
	}, []);

	const haveFieldsChanged = useMemo(() => {
		const selectedHomeserver = homeServer.trim();
		const homeserverChanged = selectedHomeserver !== storedHomeserver;
		const inviteCodeCanAffectSubmit = Boolean(selectedHomeserver) && (!storedSignedUp || homeserverChanged);

		return (
			newPubkyName.trim() !== storedName ||
			homeserverChanged ||
			(inviteCodeCanAffectSubmit && signupToken.trim() !== '')
		);
	}, [newPubkyName, homeServer, signupToken, storedName, storedHomeserver, storedSignedUp]);

	const handleNameSubmit = useCallback(() => {
		if (storedSignedUp) {
			if (haveFieldsChanged) {
				handleSubmit();
			} else {
				clearErrorState();
			}
		}
	}, [storedSignedUp, haveFieldsChanged, handleSubmit, clearErrorState]);

	const title = useMemo(() => {
		const titlePrefix = storedSignedUp ? t('common.edit') : t('pubky.setup');
		return [titlePrefix, truncatePubky(pubky)].join(' ');
	}, [pubky, storedSignedUp, t]);

	const selectedHomeserverName = useMemo(() => {
		if (!homeServer.trim()) {
			return '';
		}

		const homeserver = homeservers.find(server => server.publicKey === homeServer.trim());
		if (!homeserver) {
			return homeServer.trim();
		}

		if (homeserver.publicKey === defaultHomeserver.publicKey) {
			return t('selectServer.defaultName', { name: homeserver.name });
		}

		return homeserver.name;
	}, [homeServer, homeservers, t]);

	const handleRemoveHomeserver = useCallback(() => {
		setSignupTokenForHomeserver(homeServer, '');
		setSelectedHomeserver('');
		setError('');
	}, [homeServer, setSelectedHomeserver, setSignupTokenForHomeserver]);

	return {
		title,
		newPubkyName,
		nameError,
		haveFieldsChanged,
		selectedHomeserverName,
		signedUp: storedSignedUp,
		error,
		loading,
		handleNameChange,
		handleNameSubmit,
		handleSubmit,
		handleRemoveHomeserver,
		clearErrorState,
	};
};

import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import { Alert, Keyboard, type TextInputInstance } from 'react-native';
import { useTranslation } from 'react-i18next';
import { showToast } from '@synonymdev/react-native-toast';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '../../types';
import { getHomeservers, getPreferredHomeserver, getPubky } from '../../store/selectors/pubkySelectors';
import { setPubkyData } from '../../store/slices/pubkysSlice';
import { signOutRingFromHomeserver, truncatePubky } from '../../utils/pubky';
import { useEditPubkyFlow } from './EditPubkyFlowContext';
import { submitEditPubky } from '../../utils/actions/editPubkyAction';
import { classifySignupTokenError } from '../../utils/signupTokenErrors';
import { getSignupTokenErrorDescription } from '../../utils/signupErrors';
import { formatSignupToken, isValidSignupTokenFormat } from '../../utils/helpers';
import { isSynonymHomeserver, normalizeHomeserver } from '../../utils/homeservers';
import { parseHomeserverSignupInput } from '../../utils/homeserverSignupInput';
import { readFromClipboard } from '../../utils/clipboard';
import { resolveHomeserver } from '../../utils/resolveHomeserver';

const MAX_NAME_LENGTH = 50;

export const useEditPubkyForm = (
	pubky: string,
	onClose: () => void,
	inviteInputRef: RefObject<TextInputInstance | null>,
	justCreated = false,
) => {
	const { t } = useTranslation();
	const dispatch = useDispatch();
	const storedPubkyData = useSelector((state: RootState) => getPubky(state, pubky));
	const storedName = storedPubkyData?.name ?? '';
	const storedHomeserver =
		normalizeHomeserver(storedPubkyData?.homeserver ?? '') ?? storedPubkyData?.homeserver ?? '';
	const storedSignedUp = storedPubkyData?.signedUp ?? false;
	const isExternal = !!storedPubkyData?.sourceApp;
	const homeservers = useSelector(getHomeservers);
	const preferredHomeserver = useSelector(getPreferredHomeserver);
	const {
		selectedHomeserver: homeServer,
		setSelectedHomeserver,
		signupTokensByHomeserver,
		setSignupTokenForHomeserver,
		error,
		setError,
		errorHomeserver,
		setErrorHomeserver,
		inviteRejected,
		setInviteRejected,
	} = useEditPubkyFlow();
	const signupToken = signupTokensByHomeserver[homeServer] ?? '';
	const isConfigured =
		storedSignedUp || Boolean(storedPubkyData?.sessions?.some(session => !session.cleanupOnly));
	const [knownHomeserverAtOpen] = useState(
		isConfigured || normalizeHomeserver(storedPubkyData?.lastKnownHomeserver ?? '') === storedHomeserver
			? storedHomeserver
			: '',
	);
	const [initialSelection] = useState(homeServer);
	const [baselineHomeserver, setBaselineHomeserver] = useState(homeServer);
	const [linkedHomeserver, setLinkedHomeserver] = useState(knownHomeserverAtOpen);
	const [lookupStatus, setLookupStatus] = useState<'checking' | 'ready' | 'error'>(
		knownHomeserverAtOpen || isExternal || justCreated ? 'ready' : 'checking',
	);
	const [lookupAttempt, setLookupAttempt] = useState(0);
	const [loading, setLoading] = useState(false);
	const [signingOut, setSigningOut] = useState(false);
	const [newPubkyName, setNewPubkyName] = useState(storedName);
	const [expandedHomeserver, setExpandedHomeserver] = useState('');
	const [requiredHomeserver, setRequiredHomeserver] = useState('');
	const submittingRef = useRef(false);
	const confirmationOpenRef = useRef(false);
	const isSelectedConfiguredServer = isConfigured && homeServer === storedHomeserver;
	useEffect(() => {
		if (knownHomeserverAtOpen || isExternal || justCreated) return;
		let active = true;
		resolveHomeserver(pubky).then(result => {
			if (!active) return;
			if (result.isErr()) {
				setLookupStatus('error');
				return;
			}
			const linked = result.value ?? '';
			setLinkedHomeserver(linked);
			if (linked) dispatch(setPubkyData({ pubky, data: { homeserver: linked } }));
			const selected = linked || initialSelection || preferredHomeserver;
			setSelectedHomeserver(selected);
			setBaselineHomeserver(selected);
			setLookupStatus('ready');
		});
		return () => {
			active = false;
		};
	}, [
		knownHomeserverAtOpen,
		isExternal,
		justCreated,
		pubky,
		lookupAttempt,
		dispatch,
		setSelectedHomeserver,
		initialSelection,
		preferredHomeserver,
	]);

	const needsSignup =
		lookupStatus === 'ready' && !isExternal && Boolean(homeServer) && homeServer !== linkedHomeserver;
	const needsSignin =
		lookupStatus === 'ready' &&
		!isExternal &&
		Boolean(homeServer) &&
		homeServer === linkedHomeserver &&
		!isConfigured;
	const isSynonym = isSynonymHomeserver(homeServer);
	const inviteRequired = needsSignup && (isSynonym || requiredHomeserver === homeServer);
	const isSignupTokenValid =
		!needsSignup ||
		((!inviteRequired || Boolean(signupToken)) &&
			(!signupToken || !isSynonym || isValidSignupTokenFormat(signupToken)));
	const inviteVisible =
		needsSignup && (inviteRequired || expandedHomeserver === homeServer || Boolean(signupToken));
	const nameChanged = newPubkyName.trim() !== storedName;
	const connectionFieldsChanged = homeServer !== baselineHomeserver || Boolean(signupToken);
	const saveNameOnly = nameChanged && (!connectionFieldsChanged || (!needsSignup && !needsSignin));
	const canConnect =
		!loading && lookupStatus === 'ready' && isSignupTokenValid && (needsSignup || needsSignin);
	const canSubmit = saveNameOnly ? !loading : canConnect;
	const submitLabel =
		saveNameOnly || isExternal || (lookupStatus === 'ready' && !needsSignup && !needsSignin)
			? t('common.save')
			: t(needsSignin ? 'homeservers.signIn' : 'homeservers.signUp');

	const handleSubmit = useCallback(async () => {
		Keyboard.dismiss();
		if (submittingRef.current || !canSubmit) return;
		if (saveNameOnly) {
			dispatch(setPubkyData({ pubky, data: { name: newPubkyName.trim() } }));
			onClose();
			return;
		}
		submittingRef.current = true;
		try {
			setError('');
			setInviteRejected(false);
			setLoading(true);
			const result = await submitEditPubky({
				pubky,
				storedPubkyData,
				name: newPubkyName,
				homeserver: homeServer,
				signupToken,
				linkedHomeserver,
				dispatch,
			});
			if (!result.success) {
				if (result.type === 'homeserverChanged') {
					const homeserver = result.homeserver;
					dispatch(
						setPubkyData({ pubky, data: { homeserver, lastKnownHomeserver: homeserver, signupToken: '' } }),
					);
					setLinkedHomeserver(homeserver);
					setSelectedHomeserver(homeserver);
					setBaselineHomeserver(homeserver);
					setSignupTokenForHomeserver(homeserver, '');
					showToast({ type: 'info', title: t('homeservers.changedNotice') });
					return;
				}
				setErrorHomeserver(homeServer);
				if (result.type === 'signup') {
					if (result.message && getSignupTokenErrorDescription(result.message)) {
						setExpandedHomeserver(homeServer);
						setInviteRejected(true);
						if (classifySignupTokenError(result.message) === 'required') setRequiredHomeserver(homeServer);
						inviteInputRef.current?.focus();
					}
					setError(
						(result.message ? getSignupTokenErrorDescription(result.message) : undefined) ??
							t('editPubkySheet.unableToSignUp'),
					);
				} else if (result.type === 'signin') {
					setError(t('editPubkySheet.unableToSignIn', { error: result.message }));
				} else setError(result.message ?? t('pubkyErrors.unableToGetSecretKey'));
				return;
			}
			onClose();
		} catch {
			setErrorHomeserver(homeServer);
			setError(t(needsSignin ? 'homeservers.signInFailed' : 'editPubkySheet.unableToSignUp'));
		} finally {
			submittingRef.current = false;
			setLoading(false);
		}
	}, [
		canSubmit,
		saveNameOnly,
		pubky,
		storedPubkyData,
		newPubkyName,
		homeServer,
		signupToken,
		linkedHomeserver,
		needsSignin,
		dispatch,
		onClose,
		t,
		inviteInputRef,
		setError,
		setErrorHomeserver,
		setInviteRejected,
		setSelectedHomeserver,
		setSignupTokenForHomeserver,
	]);

	const handleSignOut = async (): Promise<void> => {
		if (submittingRef.current || isExternal || !isSelectedConfiguredServer) return;
		submittingRef.current = true;
		try {
			setLoading(true);
			setSigningOut(true);
			setError('');
			setInviteRejected(false);
			const result = await signOutRingFromHomeserver({ pubky, homeserver: storedHomeserver, dispatch });
			if (result.isErr()) {
				setErrorHomeserver(homeServer);
				setError(t('homeservers.signOutFailed', { error: result.error.message }));
				return;
			}
			const homeserver = result.value.homeserver;
			setLinkedHomeserver(homeserver);
			setSelectedHomeserver(homeserver);
			setBaselineHomeserver(homeserver);
			setSignupTokenForHomeserver(homeserver, '');
			if (homeserver !== storedHomeserver || result.value.cleanupPending) {
				showToast({
					type: 'info',
					title: t(homeserver !== storedHomeserver ? 'homeservers.changedNotice' : 'homeservers.signedOut'),
					...(result.value.cleanupPending ? { description: t('homeservers.cleanupPending') } : {}),
				});
			}
		} catch {
			setErrorHomeserver(homeServer);
			setError(t('homeservers.signOutFailed', { error: t('errors.unknownError') }));
		} finally {
			submittingRef.current = false;
			setLoading(false);
			setSigningOut(false);
		}
	};

	const handleSignOutPress = (): void => {
		if (submittingRef.current || confirmationOpenRef.current || isExternal || !isSelectedConfiguredServer)
			return;
		Keyboard.dismiss();
		confirmationOpenRef.current = true;
		Alert.alert(
			t('homeservers.signOutTitle'),
			t('homeservers.signOutDescription'),
			[
				{
					text: t('common.cancel'),
					style: 'cancel',
					onPress: () => {
						confirmationOpenRef.current = false;
					},
				},
				{
					text: t('homeservers.signOutAction'),
					style: 'destructive',
					onPress: () => {
						confirmationOpenRef.current = false;
						return handleSignOut();
					},
				},
			],
			{
				cancelable: true,
				onDismiss: () => {
					confirmationOpenRef.current = false;
				},
			},
		);
	};

	const handleSignupTokenChange = (text: string): void => {
		setSignupTokenForHomeserver(homeServer, isSynonym ? formatSignupToken(text) : text);
	};
	const handlePaste = async (): Promise<void> => {
		try {
			const input = await readFromClipboard();
			if (!input) {
				setErrorHomeserver(homeServer);
				setError(t('errors.emptyClipboard'));
				return;
			}
			const result = await parseHomeserverSignupInput(input, 'clipboard', homeServer);
			if (!result.success) {
				setErrorHomeserver(homeServer);
				setError(t(`homeservers.inputError.${result.reason}`));
				return;
			}
			setSelectedHomeserver(result.draft.homeserver);
			setSignupTokenForHomeserver(
				result.draft.homeserver,
				isSynonymHomeserver(result.draft.homeserver)
					? formatSignupToken(result.draft.inviteCode)
					: result.draft.inviteCode,
			);
		} catch {
			setErrorHomeserver(homeServer);
			setError(t('scanInvite.failedToReadClipboard'));
		}
	};
	const selectedHomeserverName = useMemo(() => {
		const name =
			homeservers.find(server => server.publicKey === homeServer)?.name ||
			`${homeServer.slice(0, 6)}…${homeServer.slice(-4)}`;
		return homeServer === preferredHomeserver ? t('selectServer.defaultName', { name }) : name;
	}, [homeservers, homeServer, preferredHomeserver, t]);
	return {
		title: [storedSignedUp || isExternal ? t('common.edit') : t('pubky.setup'), truncatePubky(pubky)].join(
			' ',
		),
		newPubkyName,
		nameError:
			newPubkyName.length > 20 ? `${MAX_NAME_LENGTH - newPubkyName.length} / ${MAX_NAME_LENGTH}` : '',
		handleNameChange: (text: string) => {
			if (text.length <= MAX_NAME_LENGTH) setNewPubkyName(text);
		},
		selectedHomeserverName,
		homeServer,
		signupToken,
		isSynonym,
		isExternal,
		needsSignup,
		needsSignin,
		checkingHomeserver: lookupStatus === 'checking',
		lookupFailed: lookupStatus === 'error',
		retryHomeserverLookup: () => {
			setLookupStatus('checking');
			setLookupAttempt(attempt => attempt + 1);
		},
		inviteVisible,
		inviteHasError: inviteRejected && homeServer === errorHomeserver,
		inviteRequired,
		isSignupTokenValid,
		canSubmit,
		submitLabel,
		loading,
		signingOut,
		connecting: loading && !signingOut,
		error: homeServer === errorHomeserver ? error : '',
		inviteError: needsSignup && inviteRejected && homeServer === errorHomeserver ? error : '',
		handleSignupTokenChange,
		handleSubmit,
		handlePaste,
		showInvite: () => setExpandedHomeserver(homeServer),
		handleSignOutPress,
		isSelectedConfiguredServer,
	};
};

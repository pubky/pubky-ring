import React, {
	createContext,
	ReactElement,
	ReactNode,
	useCallback,
	useContext,
	useMemo,
	useRef,
	useState,
} from 'react';
import { Result, err, ok } from '@synonymdev/result';
import { loadPkdnsRecords, PkdnsError, PkdnsSnapshot, publishPkdnsChanges } from '../../utils/pkdns';
import { isSameRecord, PkdnsRecord } from '../../utils/pkdnsRecords';

type PkdnsStatus = 'idle' | 'loading' | 'ready' | 'error';

type PkdnsRecordsContextValue = {
	status: PkdnsStatus;
	snapshot?: PkdnsSnapshot;
	loadError?: PkdnsError;
	/** The record being deleted, if any. */
	deleting?: PkdnsRecord;
	load: () => Promise<void>;
	addRecord: (record: PkdnsRecord) => Promise<Result<PkdnsSnapshot>>;
	deleteRecord: (record: PkdnsRecord) => Promise<Result<PkdnsSnapshot>>;
};

const PkdnsRecordsContext = createContext<PkdnsRecordsContextValue | null>(null);

/**
 * Holds a pubky's PKDNS records for the records list and the add form, so a
 * published change shows up without re-reading the DHT.
 */
export const PkdnsRecordsProvider = ({
	pubky,
	children,
}: {
	pubky: string;
	children: ReactNode;
}): ReactElement => {
	const [status, setStatus] = useState<PkdnsStatus>('idle');
	const [snapshot, setSnapshot] = useState<PkdnsSnapshot>();
	const [loadError, setLoadError] = useState<PkdnsError>();
	const [deleting, setDeleting] = useState<PkdnsRecord>();
	const busy = useRef(false);

	const load = useCallback(async () => {
		setStatus('loading');
		setLoadError(undefined);
		const res = await loadPkdnsRecords(pubky);
		if (res.isErr()) {
			setLoadError(res.error as PkdnsError);
			setStatus('error');
			return;
		}
		setSnapshot(res.value);
		setStatus('ready');
	}, [pubky]);

	const publish = useCallback(
		async (changes: { add?: PkdnsRecord[]; remove?: PkdnsRecord[] }): Promise<Result<PkdnsSnapshot>> => {
			// One publish at a time: each one starts from the packet the last one produced.
			if (busy.current) return err(new PkdnsError('conflict'));
			busy.current = true;
			try {
				const res = await publishPkdnsChanges({ pubky, ...changes });
				if (res.isErr()) return err(res.error);
				setSnapshot(res.value);
				setStatus('ready');
				return ok(res.value);
			} finally {
				busy.current = false;
			}
		},
		[pubky],
	);

	const addRecord = useCallback((record: PkdnsRecord) => publish({ add: [record] }), [publish]);

	const deleteRecord = useCallback(
		async (record: PkdnsRecord) => {
			setDeleting(record);
			try {
				return await publish({ remove: [record] });
			} finally {
				setDeleting(current => (current && isSameRecord(current, record) ? undefined : current));
			}
		},
		[publish],
	);

	const value = useMemo(
		() => ({ status, snapshot, loadError, deleting, load, addRecord, deleteRecord }),
		[status, snapshot, loadError, deleting, load, addRecord, deleteRecord],
	);
	return <PkdnsRecordsContext.Provider value={value}>{children}</PkdnsRecordsContext.Provider>;
};

export const usePkdnsRecords = (): PkdnsRecordsContextValue => {
	const context = useContext(PkdnsRecordsContext);
	if (!context) throw new Error('usePkdnsRecords must be used inside PkdnsRecordsProvider');
	return context;
};

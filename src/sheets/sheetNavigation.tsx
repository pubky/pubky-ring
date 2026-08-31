import { CommonActions, createNavigationContainerRef, StackActions } from '@react-navigation/native';
import type { RootStackParamList } from '../navigation/types.ts';
import type { SheetId, SheetParamsById } from './types.ts';

type SheetRouteName = keyof {
	[TRouteName in keyof RootStackParamList as TRouteName extends `${string}Sheet` ? TRouteName : never]: true;
};

type OptionalSheetId = {
	[TSheetId in SheetId]: undefined extends RootStackParamList[(typeof sheetRouteById)[TSheetId]]
		? TSheetId
		: never;
}[SheetId];

type ShowSheetArgs<TSheetId extends SheetId> = TSheetId extends OptionalSheetId
	? [id: TSheetId, params?: SheetParamsById[TSheetId]]
	: [id: TSheetId, params: SheetParamsById[TSheetId]];

const sheetRouteById: Record<SheetId, SheetRouteName> = {
	backup: 'BackupSheet',
	auth: 'AuthSheet',
	'delete-pubky': 'DeletePubkySheet',
	'edit-pubky': 'EditPubkySheet',
	'add-pubky': 'AddPubkySheet',
	migrate: 'MigrateSheet',
	'legacy-sunset': 'LegacySunsetSheet',
};

let pendingSheetNavigation: Array<{
	routeName: SheetRouteName;
	params?: SheetParamsById[SheetId];
}> = [];
const noPendingSheet = Promise.resolve();
let latestSheetCompletion: Promise<void> = noPendingSheet;
const resetSheetWaiters = new Set<() => void>();
const activeSheetWork = new Map<SheetRouteName, number>();
const sheetWorkListeners = new Set<() => void>();

export class SheetNavigationResetError extends Error {
	constructor() {
		super('Sheet navigation was reset');
		this.name = 'SheetNavigationResetError';
	}
}

export const isSheetNavigationResetError = (error: unknown): error is SheetNavigationResetError =>
	error instanceof SheetNavigationResetError;

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

const navigateToSheet = (routeName: SheetRouteName, params?: SheetParamsById[SheetId]): void => {
	if (navigationRef.isReady()) {
		const rootState = navigationRef.getRootState();
		const sheetRouteNames = new Set<string>(Object.values(sheetRouteById));
		const routes = [
			...rootState.routes.filter(route => !sheetRouteNames.has(route.name)),
			{
				name: routeName,
				params,
			},
		];

		navigationRef.dispatch(
			CommonActions.reset({
				...rootState,
				routes,
				index: routes.length - 1,
			}),
		);
		return;
	}

	pendingSheetNavigation = [...pendingSheetNavigation, { routeName, params }];
};

export const flushPendingSheetNavigation = (): void => {
	const pending = pendingSheetNavigation;
	pendingSheetNavigation = [];
	pending.forEach(({ routeName, params }) => navigateToSheet(routeName, params));
};

const getRootSheetRouteIndex = (routeName: SheetRouteName): number => {
	if (!navigationRef.isReady()) {
		return -1;
	}

	const rootState = navigationRef.getRootState();
	for (let index = rootState.routes.length - 1; index >= 0; index -= 1) {
		if (rootState.routes[index].name === routeName) {
			return index;
		}
	}

	return -1;
};

const waitForSheetRouteToClose = (routeName: SheetRouteName): Promise<void> =>
	new Promise((resolve, reject) => {
		let observedRoute = pendingSheetNavigation.some(item => item.routeName === routeName);
		let settled = false;
		let navigationWasReset = false;
		let unsubscribe = (): void => {};
		const cleanup = (): void => {
			unsubscribe();
			resetSheetWaiters.delete(resetWaiter);
			sheetWorkListeners.delete(checkRoute);
		};
		const resetWaiter = (): void => {
			if (settled) return;
			navigationWasReset = true;
			checkRoute(false);
		};

		const checkRoute = (fromStateEvent = false): void => {
			if (settled) return;
			const isPending = pendingSheetNavigation.some(item => item.routeName === routeName);
			const isVisible = navigationRef.isReady() && getRootSheetRouteIndex(routeName) !== -1;

			if (isPending || isVisible) {
				observedRoute = true;
			}
			if ((activeSheetWork.get(routeName) ?? 0) > 0) return;

			if (navigationWasReset) {
				settled = true;
				cleanup();
				reject(new SheetNavigationResetError());
				return;
			}

			if (isPending || isVisible) {
				return;
			}

			if (observedRoute || fromStateEvent) {
				settled = true;
				cleanup();
				resolve();
			}
		};

		resetSheetWaiters.add(resetWaiter);
		sheetWorkListeners.add(checkRoute);

		unsubscribe = navigationRef.addListener('state', () => {
			Promise.resolve().then(() => checkRoute(true));
		});
		checkRoute(false);
	});

export const beginSheetWork = (id: SheetId): (() => void) => {
	const routeName = sheetRouteById[id];
	activeSheetWork.set(routeName, (activeSheetWork.get(routeName) ?? 0) + 1);
	sheetWorkListeners.forEach(listener => listener());

	let finished = false;
	return () => {
		if (finished) return;
		finished = true;
		const remainingWork = (activeSheetWork.get(routeName) ?? 1) - 1;
		if (remainingWork > 0) {
			activeSheetWork.set(routeName, remainingWork);
		} else {
			activeSheetWork.delete(routeName);
		}
		sheetWorkListeners.forEach(listener => listener());
	};
};

export const resetSheetNavigationState = (): void => {
	pendingSheetNavigation = [];
	latestSheetCompletion = noPendingSheet;
	const waiters = [...resetSheetWaiters];
	waiters.forEach(reset => reset());
};

export const waitForPendingSheetNavigation = async (): Promise<void> => {
	let pending = latestSheetCompletion;
	while (pending !== noPendingSheet) {
		await pending;
		if (pending === latestSheetCompletion) return;
		pending = latestSheetCompletion;
	}
};

const closeRootSheetRoute = (routeName: SheetRouteName): boolean => {
	if (!navigationRef.isReady()) {
		return false;
	}

	const rootState = navigationRef.getRootState();
	const routeIndex = getRootSheetRouteIndex(routeName);

	if (routeIndex === -1 || rootState.routes.length <= 1) {
		return false;
	}

	if (routeIndex === rootState.index) {
		navigationRef.dispatch({
			...StackActions.pop(1),
			target: rootState.key,
		});
		return true;
	}

	const routes = rootState.routes.filter((_, index) => index !== routeIndex);
	navigationRef.dispatch(
		CommonActions.reset({
			...rootState,
			routes,
			index: Math.min(rootState.index, routes.length - 1),
		}),
	);
	return true;
};

export const showSheet = <TSheetId extends SheetId>(...args: ShowSheetArgs<TSheetId>): Promise<void> => {
	const [id, params] = args;
	const routeName = sheetRouteById[id];
	navigateToSheet(routeName, params);

	const completion = waitForSheetRouteToClose(routeName);
	latestSheetCompletion = completion;
	const clearLatestCompletion = (): void => {
		if (latestSheetCompletion === completion) {
			latestSheetCompletion = noPendingSheet;
		}
	};
	completion.then(clearLatestCompletion, clearLatestCompletion);
	return completion;
};

export const hideSheet = (id: SheetId): void => {
	closeRootSheetRoute(sheetRouteById[id]);
};

const resetRootRoutes = (
	routes: Array<{
		name: keyof RootStackParamList;
		params?: RootStackParamList[keyof RootStackParamList];
	}>,
): void => {
	if (!navigationRef.isReady()) {
		return;
	}

	navigationRef.dispatch(
		CommonActions.reset({
			index: routes.length - 1,
			routes,
		}),
	);
};

export const resetRootToHome = (): void => {
	resetRootRoutes([{ name: 'Home' }]);
};

export const resetRootToHomeWithSheet = <TSheetId extends SheetId>(
	...args: ShowSheetArgs<TSheetId>
): void => {
	const [id, params] = args;
	resetRootRoutes([
		{ name: 'Home' },
		{
			name: sheetRouteById[id],
			params,
		},
	]);
};

const sheetRouteNameSet = new Set<string>(Object.values(sheetRouteById));

/** Closes whichever sheet is currently on top of the root stack, if any. */
export const hideActiveSheet = (): void => {
	if (!navigationRef.isReady()) {
		return;
	}
	const rootState = navigationRef.getRootState();
	const top = rootState.routes[rootState.routes.length - 1];
	if (top && sheetRouteNameSet.has(top.name)) {
		closeRootSheetRoute(top.name as SheetRouteName);
	}
};

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
	'reuse-shared-pubky': 'ReuseSharedPubkySheet',
};

const sheetRouteNameSet = new Set<string>(Object.values(sheetRouteById));
const identitySheetRouteNameSet = new Set<string>([
	'BackupSheet',
	'AuthSheet',
	'DeletePubkySheet',
	'EditPubkySheet',
	'ReuseSharedPubkySheet',
]);

const getRoutePubky = (params: unknown): string | undefined => {
	if (!params || typeof params !== 'object') return undefined;

	const values = params as {
		pubky?: unknown;
		params?: { pubky?: unknown };
		identity?: { pubky?: unknown };
	};
	const pubky = values.pubky ?? values.params?.pubky ?? values.identity?.pubky;
	return typeof pubky === 'string' ? pubky : undefined;
};

let pendingSheetNavigation: Array<{
	routeName: SheetRouteName;
	params?: SheetParamsById[SheetId];
}> = [];

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

export const showSheet = <TSheetId extends SheetId>(...args: ShowSheetArgs<TSheetId>): void => {
	const [id, params] = args;
	navigateToSheet(sheetRouteById[id], params);
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

export const removeDisconnectedPubkyDetail = (pubky: string): void => {
	if (!navigationRef.isReady()) return;

	const rootState = navigationRef.getRootState();
	let displayedContentIndex = rootState.index;
	while (
		displayedContentIndex >= 0 &&
		sheetRouteNameSet.has(rootState.routes[displayedContentIndex]?.name ?? '')
	) {
		displayedContentIndex -= 1;
	}

	const displayedContent = rootState.routes[displayedContentIndex];
	const hasMatchingDetail =
		displayedContent?.name === 'PubkyDetail' && getRoutePubky(displayedContent.params) === pubky;
	const hasMatchingIdentitySheet = rootState.routes.some(
		route => identitySheetRouteNameSet.has(route.name) && getRoutePubky(route.params) === pubky,
	);
	if (!hasMatchingDetail && !hasMatchingIdentitySheet) return;

	const activeRouteKey = rootState.routes[rootState.index]?.key;
	const routes = rootState.routes.filter((route, index) => {
		if (hasMatchingDetail && index === displayedContentIndex) return false;
		return !(identitySheetRouteNameSet.has(route.name) && getRoutePubky(route.params) === pubky);
	});

	if (!routes.some(route => route.name === 'Home')) {
		resetRootToHome();
		return;
	}

	const preservedActiveIndex = routes.findIndex(route => route.key === activeRouteKey);
	navigationRef.dispatch(
		CommonActions.reset({
			...rootState,
			routes,
			index: preservedActiveIndex >= 0 ? preservedActiveIndex : routes.length - 1,
		}),
	);
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

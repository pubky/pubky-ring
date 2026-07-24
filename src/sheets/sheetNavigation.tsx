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

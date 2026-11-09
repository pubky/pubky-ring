export class HomeserverChangedError extends Error {
	constructor(
		readonly homeserver: string,
		message: string,
	) {
		super(message);
		this.name = 'HomeserverChangedError';
	}
}

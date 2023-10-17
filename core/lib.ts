import type {
	Transport,
	OnErrorCallback,
	Opts,
	LogEntry,
	DefaultMeta,
} from './types';

export class Notera<LevelsT extends string, MetaT extends DefaultMeta> {
	protected onErrorListeners: OnErrorCallback<LevelsT, MetaT>[] = [];
	protected transports: Transport<LevelsT, MetaT>[] = [];
	protected tmpCtx: string | undefined;

	constructor(protected opts: Opts<LevelsT>) {}

	addTransport(transport: Transport<LevelsT, MetaT>): void {
		this.transports.push(transport);
	}

	reconfigureTransport(
		name: string,
		newConfig: Partial<Transport<LevelsT, MetaT>>,
	): void {
		const idx = this.transports.findIndex((t) => t.name === name);
		const transport = this.transports[idx];

		if (!transport) {
			throw new Error(`No transport named '${name}'`);
		}

		this.transports[idx] = {
			...transport,
			...newConfig,
		};
	}

	removeTransport(name: string): void {
		this.transports = this.transports.filter(
			(transport) => transport.name !== name,
		);
	}

	ctx(name: string): this {
		this.tmpCtx = name;
		return this;
	}

	log(level: LevelsT, msg?: string, ...meta: MetaT): Promise<unknown[]> | void {
		if (!(level in this.opts.levels)) {
			throw new TypeError(
				`Unsupported log level '${level}'. Valid levels are: ` +
					`${Object.keys(this.opts.levels).join(', ')}`,
			);
		}

		const ctx = this.tmpCtx || this.opts.ctx;
		this.tmpCtx = undefined;

		const results = this.transports
			.filter((transport) => {
				return (
					!transport.levels ||
					transport.levels.indexOf(level) !== -1
				);
			})
			.map((transport) => {
				const entry = { date: new Date(), ctx, level, msg, meta };
				let res;

				try {
					res = transport.callback(entry);
				} catch (err) {
					this.emitErrorEvent(err, entry, transport);
				}

				if (res instanceof Promise) {
					return res.catch((err) => this.emitErrorEvent(err, entry, transport));
				}
			});

		const promises = results.filter((r) => r);

		if (promises.length) {
			return Promise.all(promises);
		}
	}

	onError(callback: OnErrorCallback<LevelsT, MetaT>): void {
		this.onErrorListeners.push(callback);
	}

	protected emitErrorEvent(
		err: unknown,
		entry: LogEntry<LevelsT, MetaT>,
		transport: Transport<LevelsT, MetaT>,
	): void {
		this.onErrorListeners.forEach((listener) =>
			listener(err, entry, transport),
		);

		if (!this.onErrorListeners.length) {
			throw err;
		}
	}
}

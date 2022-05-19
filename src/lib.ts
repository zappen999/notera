import type {
	Transport,
	TransportFn,
	TransportOpts,
	OnErrorCallback,
	Opts,
	LogEntry,
	Meta,
} from './types';

export class Notera<LevelsT extends string> {
	protected onErrorListeners: OnErrorCallback<LevelsT>[] = [];
	protected transports: Transport<LevelsT>[] = [];
	protected tmpCtx: string | undefined;

	constructor(protected opts: Opts<LevelsT>) {}

	addTransport(callback: TransportFn, opts?: TransportOpts<LevelsT>): void {
		this.transports.push({ callback, opts });
	}

	reconfigureTransport(name: string, newOpts: TransportOpts<LevelsT>): void {
		const transport = this.transports.find((t) => t.opts?.name === name);

		if (!transport) {
			throw new Error(`No transport named '${name}'`);
		}

		transport.opts = {
			...transport.opts,
			...newOpts,
		};
	}

	removeTransport(name: string): void {
		this.transports = this.transports.filter(
			(transport) => transport.opts?.name !== name,
		);
	}

	ctx(name: string): this {
		this.tmpCtx = name;
		return this;
	}

	log(level: LevelsT, msg?: string, ...meta: Meta[]): void {
		if (!(level in this.opts.levels)) {
			throw new TypeError(
				`Unsupported log level '${level}'. Valid levels are: ` +
					`${Object.keys(this.opts.levels).join(', ')}`,
			);
		}

		const ctx = this.tmpCtx || this.opts.ctx;
		this.tmpCtx = undefined;

		this.transports
			.filter((transport) => {
				return (
					!transport.opts?.levels ||
					transport.opts?.levels.length === 0 ||
					transport.opts?.levels.indexOf(level) !== -1
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
					// TODO, we should save the promise so that we can handle a graceful
					// shutdown
					res.catch((err) => this.emitErrorEvent(err, entry, transport));
				}
			});
	}

	onError(callback: OnErrorCallback<LevelsT>): void {
		this.onErrorListeners.push(callback);
	}

	protected emitErrorEvent(
		err: unknown,
		entry: LogEntry,
		transport: Transport<LevelsT>,
	): void {
		this.onErrorListeners.forEach((listener) =>
			listener(err, entry, transport),
		);
	}
}

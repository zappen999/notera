export type Opts<LevelsT extends string> = {
	levels: {
		[Name in LevelsT]: number;
	};
	ctx?: string;
};

export type LogEntry<LevelsT extends string> = {
	date: Date;
	ctx?: string;
	level: LevelsT;
	msg?: string;
	meta: Meta[];
};

export type TransportFn<LevelsT extends string> = (
	entry: LogEntry<LevelsT>,
) => void | Promise<void>;
export type TransportOpts<LevelsT> = {
	name?: string;
	levels?: LevelsT[];
};
export type Transport<LevelsT extends string> = {
	callback: TransportFn<LevelsT>;
	opts?: TransportOpts<LevelsT>;
};

export type OnErrorCallback<LevelsT extends string> = (
	err: unknown,
	entry: LogEntry<LevelsT>,
	transport: Transport<LevelsT>,
) => void;

export type Meta = unknown;

export type LogFn = (msg?: string, ...meta: Meta[]) => Promise<unknown> | void;
export type LoggingInterface<LevelsT extends string> = {
	[K in LevelsT]: LogFn;
} & {
	log: (
		level: LevelsT,
		msg?: string,
		...meta: Meta[]
	) => Promise<unknown> | void;
};

export type Opts<LevelsT extends string> = {
	levels: {
		[Name in LevelsT]: number;
	};
	ctx?: string;
};

export type LinuxKernelLevels =
	| 'emerg'
	| 'alert'
	| 'crit'
	| 'err'
	| 'warning'
	| 'notice'
	| 'info'
	| 'debug';

export type LogEntry = {
	date: Date;
	ctx?: string;
	level: string;
	msg?: string;
	meta: Meta[];
};

export type TransportFn = (entry: LogEntry) => void | Promise<void>;
export type TransportOpts<LevelsT> = {
	name?: string;
	levels?: LevelsT[];
};
export type Transport<LevelsT> = {
	callback: TransportFn;
	opts?: TransportOpts<LevelsT>;
};

export type OnErrorCallback<LevelsT> = (
	err: unknown,
	entry: LogEntry,
	transport: Transport<LevelsT>,
) => void;

export type Meta = unknown;

export type LogFn = (msg?: string, ...meta: Meta[]) => void;
export type LoggingInterface<LevelsT extends string> = {
	[K in LevelsT]: LogFn;
} & {
	log: (level: LevelsT, msg?: string, ...meta: Meta[]) => void;
};

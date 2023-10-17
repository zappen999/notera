export type Opts<LevelsT extends string> = {
	levels: {
		[Name in LevelsT]: number;
	};
	ctx?: string;
};

export type DefaultMeta = unknown[];

export type LogEntry<LevelsT extends string, MetaT extends DefaultMeta> = {
	date: Date;
	ctx?: string;
	level: LevelsT;
	msg?: string;
	meta: MetaT;
};

export type TransportFn<LevelsT extends string, MetaT extends DefaultMeta> = (
	entry: LogEntry<LevelsT, MetaT>,
) => void | Promise<void>;

export type Transport<LevelsT extends string, MetaT extends DefaultMeta> = {
	callback: TransportFn<LevelsT, MetaT>;
	name?: string;
	levels?: LevelsT[];
};

export type OnErrorCallback<
	LevelsT extends string,
	MetaT extends DefaultMeta,
> = (
	err: unknown,
	entry: LogEntry<LevelsT, MetaT>,
	transport: Transport<LevelsT, MetaT>,
) => void;

export type LogFn<MetaT extends DefaultMeta> = (
	msg?: string,
	...meta: MetaT
) => Promise<unknown> | void;
export type LoggingInterface<
	LevelsT extends string,
	MetaT extends DefaultMeta,
> = {
	[K in LevelsT]: LogFn<MetaT>;
} & {
	log: (
		level: LevelsT,
		msg?: string,
		...meta: MetaT
	) => Promise<unknown> | void;
};

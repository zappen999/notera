import { Notera } from './lib';
import type { Opts, LoggingInterface, DefaultMeta } from './types';

export * from './utils';
export * from './types';
export * from './lib';

export function factory<LevelsT extends string, MetaT extends DefaultMeta>(
	opts: Opts<LevelsT>,
): Notera<LevelsT, MetaT> & LoggingInterface<LevelsT, MetaT> {
	const notera = new Notera(opts);

	for (const level in opts.levels) {
		(notera as any)[level] = (msg?: string, ...meta: MetaT) => {
			notera.log(level, msg, ...meta);
		};
	}

	return notera as unknown as Notera<LevelsT, MetaT> &
		LoggingInterface<LevelsT, MetaT>;
}

export default factory;

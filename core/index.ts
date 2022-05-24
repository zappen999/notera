import { Notera } from './lib';
import type { Opts, LoggingInterface, Meta } from './types';

export * from './utils';
export * from './types';
export * from './lib';

export function factory<LevelsT extends string>(
	opts: Opts<LevelsT>,
): Notera<LevelsT> & LoggingInterface<LevelsT> {
	const notera = new Notera(opts);

	for (const level in opts.levels) {
		(notera as any)[level] = (msg?: string, ...meta: Meta[]) => {
			notera.log(level, msg, ...meta);
		};
	}

	return notera as Notera<LevelsT> & LoggingInterface<LevelsT>;
}

export default factory;

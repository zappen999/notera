import type { LogEntry, TransportFn } from '@notera/core';
import type Rollbar from 'rollbar';

import type { Opts } from './types';

export default function transport<LevelsT extends string>(
	userOpts: Opts<LevelsT>,
): TransportFn<LevelsT> {
	const { rollbar } = userOpts;

	return (entry: LogEntry<LevelsT>) => {
		const { ctx, msg, meta } = entry;
		const level = userOpts.levelMap[entry.level];

		let message = msg;

		if (ctx) {
			message = `${ctx}: ${message}`;
		}

		rollbar[level](message, ...(meta as Rollbar.LogArgument[]));
	};
}

import type { DefaultMeta, LogEntry, TransportFn } from '@notera/core';
import type Rollbar from 'rollbar';

import type { Opts } from './types';

export default function transport<
	LevelsT extends string,
	MetaT extends DefaultMeta,
>(userOpts: Opts<LevelsT>): TransportFn<LevelsT, MetaT> {
	const { rollbar } = userOpts;

	return (entry: LogEntry<LevelsT, MetaT>) => {
		const { ctx, msg, meta } = entry;
		const level = userOpts.levelMap[entry.level];

		let message = msg;

		if (ctx) {
			message = `${ctx}: ${message}`;
		}

		rollbar[level](message, ...(meta as Rollbar.LogArgument[]));
	};
}

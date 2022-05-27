import type { DefaultMeta, LogEntry, TransportFn } from '@notera/core';
import style from 'ansi-styles';

import type { Opts, ParsedOpts } from './types';

const LINEBREAK_PATTERN = /\r?\n|\r/g;

function getOpts<LevelsT extends string, MetaT extends DefaultMeta>(
	userOpts?: Opts<LevelsT, MetaT>,
): ParsedOpts<LevelsT, MetaT> {
	return {
		disableStyle: false,
		singleLine: false,
		stream: process.stdout,
		...userOpts,
		segment: {
			...userOpts?.segment,
			time: {
				index: 10,
				format: ({ date }) => date.toISOString(),
				style: 'gray',
				...userOpts?.segment?.time,
			},
			ctx: {
				index: 20,
				format: ({ ctx }) => ` [${ctx}]`,
				...userOpts?.segment?.ctx,
			},
			level: {
				index: 30,
				style: ({ level }, opts) => opts.colors?.[level] || 'white',
				format: ({ level }) => ' ' + level.toUpperCase(),
				...userOpts?.segment?.level,
			},
			msg: {
				index: 40,
				format: ({ msg }) => `: ${msg}`,
				...userOpts?.segment?.msg,
			},
			meta: {
				index: 60,
				format: ({ meta }, opts) =>
					` | ${JSON.stringify(meta, null, opts.singleLine ? undefined : 2)}`,
				style: 'gray',
				...userOpts?.segment?.meta,
			},
		},
	};
}

export default function transport<
	LevelsT extends string,
	MetaT extends DefaultMeta,
>(userOpts?: Opts<LevelsT, MetaT>): TransportFn<LevelsT, MetaT> {
	const opts = getOpts(userOpts);

	const segmentKeys = Object.keys(opts.segment)
		.filter(
			(k) => (opts.segment as any)[k] && !(opts.segment as any)[k].disabled,
		)
		.sort(
			(a, b) =>
				((opts.segment as any)[a].index || 1) -
				((opts.segment as any)[b].index || 1),
		);

	return (entry: LogEntry<LevelsT, MetaT>) => {
		let line = segmentKeys
			.filter((key) => (entry as any)[key] !== 'undefined' || 1)
			.reduce((l, _key) => {
				const key = _key as keyof ParsedOpts<LevelsT, MetaT>['segment'];
				const segmentConfig = opts.segment[key];

				const segmentText =
					segmentConfig.format?.(entry, opts) ||
					entry[key as keyof LogEntry<LevelsT, MetaT>];

				const styleName =
					!opts.disableStyle && segmentConfig.style
						? typeof segmentConfig.style === 'function'
							? segmentConfig.style(entry, opts)
							: segmentConfig.style
						: null;

				const styledSegmentText = styleName
					? style[styleName].open + segmentText + style[styleName].close
					: segmentText;

				return l + styledSegmentText;
			}, '');

		if (opts.singleLine) {
			line = line.replace(LINEBREAK_PATTERN, '\\n');
		}

		opts.stream.write(`${line}\n`);
	};
}

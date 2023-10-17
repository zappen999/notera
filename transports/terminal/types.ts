import type { DefaultMeta, LogEntry } from '@notera/core';
import type { ForegroundColor, BackgroundColor, Modifier } from 'ansi-styles';
import type { Writable } from 'stream';

export type Style = keyof (Modifier & ForegroundColor & BackgroundColor);

export type Opts<LevelsT extends string, MetaT extends DefaultMeta> = {
	// Disable colored/styled output. Defaults to false
	disableStyle?: boolean;

	// Never use more than one line for one log entry. This will hide
	// stack traces when logging errors, and only show the message
	// instead. Defaults to false
	singleLine?: boolean;

	// Colors to use for the different logging levels
	colors?: {
		[K in LevelsT]?: Style;
	};

	stream?: Writable;

	// Configuration used when handling each segment. Please see the
	// section "Configuring segments" for more information on how to
	// configure these.
	segment?: {
		time?: SegmentConfig<LevelsT, MetaT>;
		ctx?: SegmentConfig<LevelsT, MetaT>;
		level?: SegmentConfig<LevelsT, MetaT>;
		msg?: SegmentConfig<LevelsT, MetaT>;
		meta?: SegmentConfig<LevelsT, MetaT>;
	};
};

export type ParsedOpts<
	LevelsT extends string,
	MetaT extends DefaultMeta,
> = Pick<Opts<LevelsT, MetaT>, 'colors'> &
	Required<Omit<Opts<LevelsT, MetaT>, 'colors'>> & {
		segment: Required<Opts<LevelsT, MetaT>['segment']>;
	};

export type SegmentConfig<LevelsT extends string, MetaT extends DefaultMeta> = {
	// How this segment should be ordered amongst the other, defaults to 1
	index?: number;

	// Default false
	disabled?: boolean;

	// Function to format the segment
	format?:
		| ((entry: LogEntry<LevelsT, MetaT>, opts: Opts<LevelsT, MetaT>) => string)
		| null;

	// Function to determine the style of this segment this specific log entry.
	style?:
		| Style
		| ((entry: LogEntry<LevelsT, MetaT>, opts: Opts<LevelsT, MetaT>) => Style)
		| null;
};

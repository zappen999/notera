import type { LogEntry } from '@notera/core';
import type { ForegroundColor, BackgroundColor, Modifier } from 'ansi-styles';
import type { Writable } from 'stream';

export type Style = keyof (Modifier & ForegroundColor & BackgroundColor);

export type Opts<LevelsT extends string> = {
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
		time?: SegmentConfig<LevelsT>;
		ctx?: SegmentConfig<LevelsT>;
		level?: SegmentConfig<LevelsT>;
		msg?: SegmentConfig<LevelsT>;
		meta?: SegmentConfig<LevelsT>;
	};
};

export type ParsedOpts<LevelsT extends string> = Pick<Opts<LevelsT>, 'colors'> &
	Required<Omit<Opts<LevelsT>, 'colors'>> & {
		segment: Required<Opts<LevelsT>['segment']>;
	};

export type SegmentConfig<LevelsT extends string> = {
	// How this segment should be ordered amongst the other, defaults to 1
	index?: number;

	// Default false
	disabled?: boolean;

	format?: ((entry: LogEntry<LevelsT>, opts: Opts<LevelsT>) => string) | null;

	style?:
		| Style
		| ((entry: LogEntry<LevelsT>, opts: Opts<LevelsT>) => Style)
		| null;
};

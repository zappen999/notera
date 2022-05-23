import type Rollbar from 'rollbar';
import type { Level as RollbarLevel } from 'rollbar';

export type Opts<LevelsT extends string> = {
	rollbar: Rollbar;
	levelMap: {
		[K in LevelsT]: RollbarLevel;
	};
};

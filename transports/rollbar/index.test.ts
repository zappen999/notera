import type Rollbar from 'rollbar';

import rollbarTransport from './index';

const mockEntry = {
	ctx: 'SERVER',
	level: 'info' as const,
	msg: 'Some stuff\n happened',
	meta: [
		{
			some: 'meta',
			data: true,
		},
	],
	date: new Date(),
};

const levelMap = {
	info: 'info',
} as const;

const noop = () => {
	// noop
};

const rollbar = {
	critical: noop,
	error: noop,
	warning: noop,
	info: noop,
	debug: noop,
} as Rollbar;

beforeEach(() => {
	for (const key in rollbar) {
		(rollbar as any)[key] = jest.fn();
	}
});

describe('Logging', () => {
	it('should call Rollbar logging function', () => {
		rollbarTransport({
			rollbar,
			levelMap,
		})(mockEntry);
		expect((rollbar.info as any).mock.calls.length).toEqual(1);
		const firstCall = (rollbar.info as any).mock.calls[0];
		expect(firstCall[0]).toEqual('SERVER: Some stuff\n happened');
		expect(firstCall[1]).toEqual(mockEntry.meta);
	});
});

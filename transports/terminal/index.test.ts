import type { LogEntry } from '@notera/core';
import style from 'ansi-styles';

import terminalTransport from './index';
import type { Opts } from './types';

const STYLE_RESET_CTRL_CHAR = '\u001b';

type Levels = 'info' | 'warn';

const mockEntry: LogEntry<Levels> = {
	date: new Date(),
	ctx: 'SERVER',
	level: 'info',
	msg: 'Some stuff\n happened',
	meta: [
		{
			some: 'meta',
			data: true,
		},
	],
};

function getWriteStreamMock(): NodeJS.WriteStream {
	let data = '';

	return {
		write: (chunk: string) => (data += chunk),
		read: () => data,
	} as unknown as NodeJS.WriteStream;
}

function getCharOccurences(string: string, char: string): number {
	return string.split('').reduce((sum, c) => sum + (c === char ? 1 : 0), 0);
}

function startsWith(needle: string, haystack: string): boolean {
	return haystack.indexOf(needle) === 0;
}

let stream: NodeJS.WriteStream;

beforeEach(() => {
	stream = getWriteStreamMock();
});

describe('Options', () => {
	test('should print on single line when singleLine option is true', () => {
		const opts = { singleLine: true, stream };
		terminalTransport(opts)(mockEntry);
		expect(getCharOccurences(stream.read(), '\n')).toEqual(1);
	});

	test('should not use styling when styling is turned off', () => {
		const opts = { disableStyle: true, stream };
		terminalTransport(opts)(mockEntry);
		expect(getCharOccurences(stream.read(), STYLE_RESET_CTRL_CHAR)).toEqual(0);
	});

	test('should change colors', () => {
		const opts: Opts<Levels> = {
			stream,
			colors: {
				info: 'blue',
			},
		};
		terminalTransport(opts)(mockEntry);
		const expectedString = style.blue.open + ' INFO' + style.blue.close;
		expect(stream.read().includes(expectedString)).toEqual(true);
	});

	test('should overwrite a feature of a formatter without overwriting everything', () => {
		const opts = {
			stream,
			segment: {
				ctx: {
					index: 0,
				},
			},
		};

		terminalTransport(opts)(mockEntry);
		expect(stream.read()).toEqual(expect.stringContaining('[SERVER]'));
	});

	test('should be able to not provide an options-object', () => {
		terminalTransport();
	});
});

describe('Formatting', () => {
	test('should use the raw value if no formatter is present', () => {
		const opts: Opts<Levels> = {
			stream,
			segment: {
				ctx: { format: null },
			},
		};

		terminalTransport(opts)(mockEntry);
		expect(stream.read().includes('SERVER')).toEqual(true);
	});

	test('should be able to reorder formatters by index', () => {
		const opts = {
			stream,
			disableStyle: true,
			segment: {
				ctx: { index: 0 },
			},
		};

		terminalTransport(opts)(mockEntry);
		expect(startsWith(' [SERVER]', stream.read())).toEqual(true);
	});

	test('should be able to remove default entry formatters', () => {
		const opts: Opts<Levels> = {
			stream,
			disableStyle: true,
			segment: {
				ctx: { disabled: true },
			},
		};

		terminalTransport(opts)(mockEntry);
		expect(stream.read().indexOf('[SERVER]')).toEqual(-1);
	});

	test('should provide entry and options object', (done) => {
		const opts: Opts<Levels> = {
			stream,
			disableStyle: true,
			segment: {
				ctx: {
					format: (entry, opts) => {
						expect(entry).toBe(mockEntry);
						expect(opts.disableStyle).toEqual(true);
						done();
						return 'blue';
					},
				},
			},
		};

		terminalTransport(opts)(mockEntry);
	});
});

describe('Styling', () => {
	test('should be able to set style dynamically with function', () => {
		const opts: Opts<Levels> = {
			stream,
			segment: {
				ctx: {
					style: () => 'blue',
				},
			},
		};

		terminalTransport(opts)(mockEntry);
		const expectedString = style.blue.open + ' [SERVER]' + style.blue.close;
		expect(stream.read().includes(expectedString)).toEqual(true);
	});

	test('should be able to define segment color with color name', () => {
		const opts: Opts<Levels> = {
			stream,
			segment: {
				ctx: {
					style: 'blue',
				},
			},
		};

		terminalTransport(opts)(mockEntry);
		const expectedString = style.blue.open + ' [SERVER]' + style.blue.close;
		expect(stream.read().includes(expectedString)).toEqual(true);
	});
});

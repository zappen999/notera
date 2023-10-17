import createLogger, { defaultOpts, linuxLogLevels } from './index';

const mockMeta = { some: 'meta' };
const mockError = new Error('Some error');

describe('Transports', () => {
	it('should call the transport with log information', (done) => {
		const logger = createLogger(defaultOpts);

		logger.addTransport({
			callback: ({ level, msg, meta }) => {
				expect(level).toEqual('debug');
				expect(msg).toEqual('Some message');
				expect(meta[0]).toEqual(mockMeta);

				done();
			},
		});

		logger.log('debug', 'Some message', mockMeta);
	});

	it('should be able to remove a named transport', () => {
		const logger = createLogger(defaultOpts);
		const mockTransport = jest.fn();

		logger.addTransport({ name: 'mockTransport', callback: mockTransport });
		logger.log('debug', 'Some message');
		logger.removeTransport('mockTransport');
		logger.log('debug', 'Some message');
		expect(mockTransport.mock.calls.length).toEqual(1);
	});

	it('should handle all levels if levels is not specified', () => {
		const logger = createLogger(defaultOpts);
		const mockTransport = jest.fn();

		logger.addTransport({ callback: mockTransport });

		logger.debug('Some message');
		logger.warning('Some message');
		logger.err('Some message');

		expect(mockTransport.mock.calls.length).toEqual(3);
	});

	it('should not handle any levels if levels is empty array', () => {
		const logger = createLogger(defaultOpts);
		const mockTransport = jest.fn();

		logger.addTransport({ callback: mockTransport, levels: [] });

		logger.debug('Some message');
		logger.warning('Some message');
		logger.err('Some message');

		expect(mockTransport.mock.calls.length).toEqual(0);
	});

	it('should handle levels that are specified in transport options', () => {
		const logger = createLogger(defaultOpts);
		const mockTransport = jest.fn();

		logger.addTransport({
			callback: mockTransport,
			levels: ['warning', 'err'],
		});

		logger.debug('Some message');
		logger.warning('Some message');
		logger.err('Some message');

		expect(mockTransport.mock.calls.length).toEqual(2);
		expect(mockTransport.mock.calls[0][0].level).toEqual('warning');
		expect(mockTransport.mock.calls[1][0].level).toEqual('err');
	});

	it('should be able to reconfigure a named transport', () => {
		const logger = createLogger(defaultOpts);
		const mockTransport = jest.fn();

		logger.addTransport({
			callback: mockTransport,
			name: 'mockTransport',
			levels: ['err'],
		});
		logger.err('Some message');
		logger.reconfigureTransport('mockTransport', { levels: ['warning'] });
		logger.warning('Some message');

		expect(mockTransport.mock.calls.length).toEqual(2);
		expect(mockTransport.mock.calls[0][0].level).toEqual('err');
		expect(mockTransport.mock.calls[1][0].level).toEqual('warning');
	});

	it('should throw error when re-configuring non-existing transport', () => {
		const logger = createLogger(defaultOpts);
		expect(() => logger.reconfigureTransport('moon', {})).toThrow(
			`No transport named 'moon'`,
		);
	});
});

describe('Logging', () => {
	it('meta should be provided as array to transport', (done) => {
		const logger = createLogger(defaultOpts);

		logger.addTransport({
			callback: ({ meta }) => {
				expect(meta).toEqual([mockMeta, true, false]);
				done();
			},
		});

		logger.debug('Message', mockMeta, true, false);
	});

	it('should be possible to strictly type meta data', () => {
		const logger = createLogger<
			keyof typeof linuxLogLevels,
			[string, { thisMustBeNumber: number }]
		>(defaultOpts);

		logger.err('message', 'this must be a string', { thisMustBeNumber: 1 });
	});
});

describe('Contexts', () => {
	it('should use global context supplied in options', () => {
		const logger = createLogger({ ...defaultOpts, ctx: 'API' });
		const mockTransport = jest.fn();

		logger.addTransport({ callback: mockTransport });
		logger.debug('Message');

		expect(mockTransport.mock.calls.length).toEqual(1);
		expect(mockTransport.mock.calls[0][0].ctx).toEqual('API');
	});

	it('should override global context with logger', () => {
		const logger = createLogger({ ...defaultOpts, ctx: 'API' });
		const mockTransport = jest.fn();

		logger.addTransport({ callback: mockTransport });
		logger.ctx('SERVER').debug('Message');
		logger.debug('Message');

		expect(mockTransport.mock.calls.length).toEqual(2);
		expect(mockTransport.mock.calls[0][0].ctx).toEqual('SERVER');
		expect(mockTransport.mock.calls[1][0].ctx).toEqual('API');
	});
});

describe('Events', () => {
	it('should emit error event if async transport fails', (done) => {
		const logger = createLogger(defaultOpts);

		logger.onError((err, entry, transport) => {
			expect(err).toBe(mockError);
			expect(transport.name).toEqual('mockTransport');
			expect(entry.msg).toEqual('Some message');
			done();
		});

		logger.addTransport({
			callback: () => {
				return Promise.reject(mockError);
			},
			name: 'mockTransport',
		});

		logger.log('debug', 'Some message');
	});

	it('should emit error event if transport throws (sync)', (done) => {
		const logger = createLogger(defaultOpts);

		logger.onError((err, entry, transport) => {
			expect(err).toBe(mockError);
			expect(transport.name).toEqual('mockTransport');
			expect(entry.msg).toEqual('Some message');
			done();
		});

		logger.addTransport({
			callback: () => {
				throw mockError;
			},
			name: 'mockTransport',
		});

		logger.log('debug', 'Some message');
	});

	it('should throw when there is no error handlers attached', () => {
		const logger = createLogger(defaultOpts);

		logger.addTransport({
			callback: () => {
				throw mockError;
			},
			name: 'mockTransport',
		});

		expect(() => logger.log('debug', 'Some message')).toThrow(`Some error`);
	});

	it('should be able to have two event handlers on the same event', (done) => {
		const logger = createLogger(defaultOpts);
		const errorHandlingMock1 = jest.fn();
		const errorHandlingMock2 = jest.fn();

		logger.onError(errorHandlingMock1);
		logger.onError(errorHandlingMock2);
		logger.onError(() => {
			expect(errorHandlingMock1.mock.calls.length).toEqual(1);
			expect(errorHandlingMock2.mock.calls.length).toEqual(1);
			done();
		});

		logger.addTransport({ callback: () => Promise.reject(mockError) });

		logger.log('debug', 'Some message');
	});
});

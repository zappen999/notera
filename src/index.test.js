/* global jest, describe, test, expect */
const Notera = require('./index')

const mockError = new Error('Some error')
const mockMeta = { some: 'meta' }

describe('Transports', () => {
  test('should call the transport with log information', done => {
    const logger = new Notera()

    logger.addTransport(({ level, msg, meta, err }) => {
      expect(level).toBe('debug')
      expect(msg).toBe('Some message')
      expect(meta).toBe(mockMeta)
      expect(err).toBe(mockError)
      done()
    })

    logger.log('debug', 'Some message', mockMeta, mockError)
  })

  test('should be able to remove a named transport', () => {
    const logger = new Notera()
    const mockTransport = jest.fn()

    logger.addTransport(mockTransport, { name: 'mockTransport' })
    logger.log('debug', 'Some message')
    logger.removeTransport('mockTransport')
    logger.log('debug', 'Some message')
    expect(mockTransport.mock.calls.length).toEqual(1)
  })

  test('should handle all levels if levels is not specified', () => {
    const logger = new Notera()
    const mockTransport = jest.fn()

    logger.addTransport(mockTransport)

    logger.emerg('Some message')
    logger.alert('Some message')
    logger.crit('Some message')
    logger.err('Some message')
    logger.warning('Some message')
    logger.notice('Some message')
    logger.info('Some message')
    logger.debug('Some message')

    expect(mockTransport.mock.calls.length).toEqual(8)
  })

  test('should handle levels that are specified in transport options', () => {
    const logger = new Notera()
    const mockTransport = jest.fn()
    const mockTransportOpts = {
      levels: ['err', 'warning']
    }

    logger.addTransport(mockTransport, mockTransportOpts)

    logger.emerg('Some message')
    logger.alert('Some message')
    logger.crit('Some message')
    logger.err('Some message')
    logger.warning('Some message')
    logger.notice('Some message')
    logger.info('Some message')
    logger.debug('Some message')

    expect(mockTransport.mock.calls.length).toEqual(2)
    expect(mockTransport.mock.calls[0][0].level).toEqual('err')
    expect(mockTransport.mock.calls[1][0].level).toEqual('warning')
  })

  test('should be able to reconfigure a named transport', () => {
    const logger = new Notera()
    const mockTransport = jest.fn()
    const mockTransportOpts = {
      name: 'mockTransport',
      levels: ['err']
    }

    logger.addTransport(mockTransport, mockTransportOpts)
    logger.err('Some message')
    logger.reconfigureTransport('mockTransport', { levels: ['warning'] })
    logger.warning('Some message')

    expect(mockTransport.mock.calls.length).toEqual(2)
    expect(mockTransport.mock.calls[0][0].level).toEqual('err')
    expect(mockTransport.mock.calls[1][0].level).toEqual('warning')
  })

  test('should throw error when re-configuring non-existing transport', () => {
    const logger = new Notera()
    expect(() => logger.reconfigureTransport('moon', {}))
      .toThrow(`No transport named 'moon'`)
  })
})

describe('Logging', () => {
  test('should not be possible to use undefined logging level', () => {
    const logger = new Notera()
    expect(() => logger.log('bogus', 'Some message')).toThrow(TypeError)
  })

  test('should take the first found string as string argument', done => {
    const logger = new Notera()

    logger.addTransport(({ msg, meta }) => {
      expect(msg).toEqual('First string')
      expect(meta).toEqual('Second string')
      done()
    })

    logger.debug('First string', 'Second string')
  })

  test('should take the first found Error as err argument', done => {
    const logger = new Notera()

    logger.addTransport(({ meta, err }) => {
      expect(err).toEqual(mockError)
      expect(meta).toEqual(anotherError)
      done()
    })

    const anotherError = new Error('Another error')
    logger.debug(mockError, anotherError)
  })

  test('should make array of meta if multiple meta is passed', done => {
    const logger = new Notera()

    logger.addTransport(({ meta }) => {
      expect(meta).toEqual([mockMeta, true, false])
      done()
    })

    logger.debug('Message', mockMeta, true, false)
  })
})

describe('Contexts', () => {
  test('should use global context supplied in options', () => {
    const logger = new Notera({ ctx: 'API' })
    const mockTransport = jest.fn()

    logger.addTransport(mockTransport)
    logger.debug('Message')

    expect(mockTransport.mock.calls.length).toEqual(1)
    expect(mockTransport.mock.calls[0][0].ctx).toEqual('API')
  })

  test('should override global context with logger', () => {
    const logger = new Notera({ ctx: 'API' })
    const mockTransport = jest.fn()

    logger.addTransport(mockTransport)
    logger.ctx('SERVER').debug('Message')
    logger.debug('Message')

    expect(mockTransport.mock.calls.length).toEqual(2)
    expect(mockTransport.mock.calls[0][0].ctx).toEqual('SERVER')
    expect(mockTransport.mock.calls[1][0].ctx).toEqual('API')
  })
})

describe('Events', () => {
  test('should emit error event if async transport fails', done => {
    const logger = new Notera()

    logger.on('error', ({ err, transport, entry }) => {
      expect(err).toBe(mockError)
      expect(transport.opts.name).toEqual('mockTransport')
      expect(entry.msg).toEqual('Some message')
      done()
    })

    logger.addTransport(() => {
      return Promise.reject(mockError)
    }, { name: 'mockTransport' })

    logger.log('debug', 'Some message')
  })

  test('should emit error event if transport throws (sync)', done => {
    const logger = new Notera()

    logger.on('error', ({ err, transport, entry }) => {
      expect(err).toBe(mockError)
      expect(transport.opts.name).toEqual('mockTransport')
      expect(entry.msg).toEqual('Some message')
      done()
    })

    logger.addTransport(() => {
      throw mockError
    }, { name: 'mockTransport' })

    logger.log('debug', 'Some message')
  })

  test('should not throw when there is no error handlers attached', () => {
    const logger = new Notera()

    logger.addTransport(() => {
      throw mockError
    }, { name: 'mockTransport' })

    logger.log('debug', 'Some message')
  })

  test('should be able to have two event handlers on the same event', done => {
    const logger = new Notera()
    const errorHandlingMock1 = jest.fn()
    const errorHandlingMock2 = jest.fn()

    logger.on('error', errorHandlingMock1)
    logger.on('error', errorHandlingMock2)
    logger.on('error', () => {
      expect(errorHandlingMock1.mock.calls.length).toEqual(1)
      expect(errorHandlingMock2.mock.calls.length).toEqual(1)
      done()
    })

    logger.addTransport(() => Promise.reject(mockError))

    logger.log('debug', 'Some message')
  })

  test('should throw error when trying to listen on unknown event', () => {
    const logger = new Notera()
    expect(() => logger.on('something', () => {}))
      .toThrow(`No event named 'something'`)
  })
})

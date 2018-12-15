/* global jest, describe, test, expect */
const Notera = require('./index')

const mockError = new Error('Some error')
const mockMeta = { some: 'meta' }

describe('Transports', () => {
  test('should emit error event if async transport fails', done => {
    const logger = new Notera()

    logger.on('error', err => {
      expect(err).toBe(mockError)
      done()
    })

    logger.addTransport(() => {
      return Promise.reject(mockError)
    })

    logger.log('debug', 'Some message')
  })

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

  test('should be able to reconfigure a named transport', () => {
    // TODO: Make this when configurable levels is implemented
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
      expect(meta).toEqual([mockMeta, true])
      done()
    })

    logger.debug('Message', mockMeta, true)
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

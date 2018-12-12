// No transport included by default //
// Targeting ES6/Node.js 8.12 >
//
// Support for:
// - Transports
// - Logging errors with stacktrace
// - Errors with meta data
// - Namespacing
// - Different instances in same application
//
// Requirements:
// - Changeable levels
// - Performance
// - Sync and async behavior of transports

const LINUX_LOG_LEVELS = {
  emerg: 0,
  alert: 1,
  crit: 2,
  err: 3,
  warning: 4,
  notice: 5,
  info: 6,
  debug: 7
}
const EVENT = {
  ERROR: 'error'
}

function Notera (opts) {
  this._opts = {
    levels: LINUX_LOG_LEVELS,
    ...opts
  }

  this._transports = []
  this._subscribers = {}
  this._ctx = null

  this._createLoggerAliases()
}

Notera.prototype._createLoggerAliases = function () {
  Object.keys(this._opts.levels).forEach(level => {
    this[level] = (...args) => this.log(level, ...args)
  })
}

Notera.prototype.addTransport = function addTransport (callback, opts) {
  this._transports.push({ callback, opts })
}

Notera.prototype.ctx = function ctx (contextName) {
  this._ctx = contextName
  return this
}

Notera.prototype.log = function log (level, ...args) {
  if (typeof this._opts.levels[level] === 'undefined') {
    throw new TypeError(
      `Unsupported log level '${level}'. Valid levels are: ` +
      `${Object.keys(this._opts.levels).join(', ')}`
    )
  }

  let msg = null
  let meta = null
  let err = null
  let metaArgCount = 0

  args.forEach(arg => {
    if (typeof arg === 'string' && msg === null) {
      msg = arg
    } else if (arg instanceof Error && err === null) {
      err = arg
    } else {
      if (metaArgCount === 0) {
        meta = arg
      } else if (metaArgCount === 1) {
        meta = [meta, arg]
      } else {
        meta.push(arg)
      }

      metaArgCount++
    }
  })

  this._transports
    .filter(transport => {
      // TODO: filter out the transports that should get the message
      // return this._opts.levels[transport.level] >= this._opts.levels[level]
      return true
    })
    .map(transport => {
      const res = transport.callback({
        ctx: this._ctx || this._opts.ctx,
        level,
        msg,
        meta,
        err
      })

      this._ctx = null // This is not pretty

      if (res instanceof Promise) {
        res.catch(err => this._emitEvent(EVENT.ERROR, err))
      }
    })
}

Notera.prototype._emitEvent = function _emitEvent (event, data) {
  this._subscribers[event].forEach(subscriber => subscriber(data))
}

Notera.prototype.on = function on (event, cb) {
  if (Object.values(EVENT).indexOf(event) === -1) {
    throw new Error(`No event named '${event}'`)
  }

  if (!this._subscribers[event]) {
    this._subscribers[event] = []
  }

  this._subscribers[event].push(cb)
}

module.exports = Notera

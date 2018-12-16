// TODO: Be able to add context to use for a request for example
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
  this._tmpCtx = null

  this._createLoggerAliases()
}

Notera.prototype._createLoggerAliases = function () {
  Object.keys(this._opts.levels).forEach(level => {
    this[level] = (...args) => this.log(level, ...args)
  })
}

Notera.prototype.addTransport = function addTransport (callback, opts = {}) {
  this._transports.push({ callback, opts })
}

Notera.prototype.reconfigureTransport =
  function reconfigureTransport (transportName, newOpts) {
    const transport = this._transports
      .find(transport => transport.opts.name === transportName)

    if (!transport) {
      throw new Error(`No transport named '${transportName}'`)
    }

    transport.opts = {
      ...transport.opts,
      ...newOpts
    }
  }

Notera.prototype.removeTransport = function removeTransport (name) {
  this._transports = this._transports
    .filter(transport => transport.opts.name !== name)
}

Notera.prototype.ctx = function ctx (contextName) {
  this._tmpCtx = contextName
  return this
}

Notera.prototype.log = function log (level, ...args) {
  if (typeof this._opts.levels[level] === 'undefined') {
    throw new TypeError(
      `Unsupported log level '${level}'. Valid levels are: ` +
      `${Object.keys(this._opts.levels).join(', ')}`
    )
  }

  let msg
  let meta
  let err
  let metaArgCount = 0
  const ctx = this._tmpCtx || this._opts.ctx
  this._tmpCtx = null

  args.forEach(arg => {
    if (typeof arg === 'string' && typeof msg === 'undefined') {
      msg = arg
    } else if (arg instanceof Error && typeof err === 'undefined') {
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
      return !transport.opts.levels ||
        transport.opts.levels.length === 0 ||
        transport.opts.levels.indexOf(level) !== -1
    })
    .map(transport => {
      const entry = { ctx, level, msg, err, meta }
      const res = transport.callback(entry)

      if (res instanceof Promise) {
        // TODO, we should save the promise so that we can handle a graceful
        // shutdown
        res.catch(err => this._emitEvent(EVENT.ERROR, { err, entry, transport }))
      }
    })
}

Notera.prototype._emitEvent = function _emitEvent (event, ...args) {
  this._subscribers[event].forEach(subscriber => subscriber(...args))
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

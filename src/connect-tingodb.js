const EventEmitter = require('events').EventEmitter;
const tingo = require('tingodb');

/**
 * Returns a constructor with the specified connect middleware's Store
 * class as its prototype
 *
 * ####Example:
 *
 *     connectMongoDBSession(require('express-session'));
 *
 * @param {Function} connect connect-compatible session middleware (e.g. Express 3, express-session)
 * @api public
 */
module.exports = function(connect) {
  const Store = connect.Store || connect.session.Store;
  const defaults = {
    collection: 'sessions',
    path: 'sessions.db',
    expires: 1000 * 60 * 60 * 24 * 14, // 2 weeks
    idField: '_id'
  };

  let TingoStore = function(options, callback) {
    let _this = this;
    this._emitter = new EventEmitter();
    this._errorHandler = handleError.bind(this);
    this.db = null;

    if (typeof options === 'function') {
      callback = options;
      options = {};
    } else {
      options = options || {};
    }

    mergeOptions(options, defaults);

    Store.call(this, options);
    this.options = options;

    _this.db = new tingo.Db(options.path, {});

    db.
    collection(options.collection).
    createIndex({ expires: 1 }, { expireAfterSeconds: 0 }, function(error) {
      if (error) {
        let e = new Error('Error creating index: ' + error.message);
        return _this._errorHandler(e, callback);
      }

      _this._emitter.emit('connected');

      return callback && callback();
    });
  };

  TingoStore.prototype = Object.create(Store.prototype);

  TingoStore.prototype._generateQuery = function(id) {
    const ret = {};
    ret[this.options.idField] = id;
    return ret;
  };

  TingoStore.prototype.get = function(id, callback) {
    const _this = this;

    if (!this.db) {
      return this._emitter.once('connected', function() {
        _this.get.call(_this, id, callback);
      });
    }

    this.db.collection(this.options.collection).
      findOne(this._generateQuery(id), function(error, session) {
        if (error) {
          const e = new Error('Error finding ' + id + ': ' + error.message);
          return _this._errorHandler(e, callback);
        } else if (session) {
          if (!session.expires || new Date < session.expires) {
            return callback(null, session.session);
          } else {
            return _this.destroy(id, callback);
          }
        } else {
          return callback();
        }
      });
  };

  TingoStore.prototype.destroy = function(id, callback) {
    const _this = this;
    if (!this.db) {
      return this._emitter.once('connected', function() {
        _this.destroy.call(_this, id, callback);
      });
    }

    this.db.collection(this.options.collection).
      remove(this._generateQuery(id), function(error) {
        if (error) {
          let e = new Error('Error destroying ' + id + ': ' + error.message);
          return _this._errorHandler(e, callback);
        }
        callback && callback();
      });
  };

  TingoStore.prototype.clear = function(callback) {
    const _this = this;
    if (!this.db) {
      return this._emitter.once('connected', function() {
        _this.clear.call(_this, callback);
      });
    }

    this.db.collection(this.options.collection).
      remove({}, function(error) {
        if (error) {
          let e = new Error('Error clearing all sessions: ' + error.message);
          return _this._errorHandler(e, callback);
        }
        callback && callback();
      });
  };

  TingoStore.prototype.set = function(id, session, callback) {
    let _this = this;

    if (!this.db) {
      return this._emitter.once('connected', function() {
        _this.set.call(_this, id, session, callback);
      });
    }

    let sess = {};
    for (let key in session) {
      if (key === 'cookie') {
        sess[key] = session[key].toJSON ? session[key].toJSON() : session[key];
      } else {
        sess[key] = session[key];
      }
    }

    const s = this._generateQuery(id);
    s.session = sess;

    if (session && session.cookie && session.cookie.expires) {
      s.expires = new Date(session.cookie.expires);
    } else {
      let now = new Date();
      s.expires = new Date(now.getTime() + this.options.expires);
    }

    this.db.collection(this.options.collection).
      update(this._generateQuery(id), s, { upsert: true }, function(error) {
        if (error) {
          let e = new Error('Error setting ' + id + ' to ' +
            require('util').inspect(session) + ': ' + error.message);
          return _this._errorHandler(e, callback);
        }
        callback && callback();
      });
  };

  TingoStore.prototype.on = function() {
    this._emitter.on.apply(this._emitter, arguments);
  };

  TingoStore.prototype.once = function() {
    this._emitter.once.apply(this._emitter, arguments);
  };

  return TingoStore;
};

function handleError(error, callback) {
  let unhandled = true;

  if (this._emitter.listeners('error').length) {
    this._emitter.emit('error', error);
    unhandled = false;
  }

  if (callback) {
    callback(error);
    unhandled = false;
  }

  if (unhandled) {
    throw error;
  }
}

function mergeOptions(options, defaults) {
  for (let key in defaults) {
    options[key] = options[key] || defaults[key];
  }
}
var util = require('util');
var EventEmitter = require('events').EventEmitter;
var Heroku = require('heroku-client');
var Promise = require('bluebird');
var _ = require('lodash');
var type = require('type-of');

/**
 * Creates a new Heroku dyno of the designated properties.
 * @param {Object} props
 * @param {String} props.token
 * @param {String} props.app
 * @param {String} props.command
 * @param {Number} [props.autoSync]
 * @param {String} [props.size=1x]
 */
function Dyno(props) {
  this.app = new Heroku({token: props.token}).apps(props.app);
  this.command = props.command;
  this.size = props.size || '1X';
  this._processes = [];
  this._timeout = null;

  if (props.autoSync) {
    this.autoSync(props.autoSync);
  }

  EventEmitter.call(this);
  this.setMaxListeners(999);
}

// @extends EventEmitter
util.inherits(Dyno, EventEmitter);

/**
 * Starts a new process on heroku and stores its reference in the internal processes array.
 * @param {Function} [callback] optional callback function with (err, dyno) arguments
 * @return {Promise} resolving to the dyno object.
 */
Dyno.prototype.start = function (callback) {
  var _this = this;

  return Promise.resolve(this.app.dynos().create({
    command: this.command,
    size: this.size
  }))

    .then(function (dyno) {
      _this._processes.push(dyno);
      _this.emit('start', dyno);
      return dyno;
    })

    .nodeify(callback);
};

/**
 * Stops the designated process on heroku and removes its reference from the internal processes array.
 * @param {Object} dyno
 * @param {Function} [callback] optional callback function with (err) arguments
 * @return {Promise}
 */
Dyno.prototype.stop = function (dyno, callback) {
  var _this = this;

  return Promise.resolve(this.app.dynos(dyno.id).restart())

    .then(function () {
      var i = _.findIndex(_this._processes, {id: dyno.id});

      if (i !== -1) {
        _this._processes.splice(i, 1);
        _this.emit('stop', dyno);
      }
    })

    .nodeify(callback);
};

/**
 * Syncs the internal processes array with heroku.
 * @param {Function} [callback] optional callback function with (err, dynos) arguments
 * @return {Promise} resolvind to the active dynos on heroku
 */
Dyno.prototype.sync = function (callback) {
  var _this = this;

  return Promise.resolve(this.app.dynos().list())

    // filter-out other dynos
    .filter(function (dyno) {
      return dyno.command === _this.command;
    })

    // register new processes
    .each(function (e) {
      if (_.findIndex(_this._processes, {id: e.id}) === -1) {
        _this._processes.push(e);
        _this.emit('start', e);
      }
    })

    .then(function (dynos) {
      // unregister stopped processes
      return Promise.each(_this._processes, function (e, i) {
        if (_.findIndex(dynos, {id: e.id}) === -1) {
          _this._processes.splice(i, 1);
          _this.emit('stop', e);
        }
      })

        .return(dynos);
    })

    .then(function (dynos) {
      _this.emit('sync', _this._processes);
      return dynos;
    })

    .nodeify(callback);
};

/**
 * Enables automatic syncing with heroku every designated milliseconds.
 * @param {Number} ms
 */
Dyno.prototype.autoSync = function (ms) {
  var _this = this;

  if (!_.isNumber(ms)) {
    throw new Error('Invalid ms argument; expected number, received ' + type(ms));
  }

  if (ms <= 0) {
    clearTimeout(this._timeout);
    this._timeout = null;
    return;
  }

  if (ms < 5000) {
    clearTimeout(this._timeout);
    this._timeout = null;
    throw new Error('Timeout period is too short; please specifiy a timeout of 5000 milliseconds and above');
  }

  this._timeout = setTimeout(function () {
    return _this.sync()
      // slight delay to avoid immediate repetition
      .delay(10 * 1000)

      .finally(function () {
        return _this.autoSync(ms);
      });
  }, ms);
};

/**
 * Scales the dyno to the designated quantity.
 * @param {Number} quantity the quantity
 * @param {Function} [callback] optional callback function with (err) arguments
 * @return {Promise}
 */
Dyno.prototype.scale = function (quantity, callback) {
  var _this = this;

  if (!_.isNumber(quantity)) {
    return Promise.reject(new Error('Invalid quantity argument; expected number, received ' + type(quantity)))
      .nodeify(callback);
  }

  if (quantity < 0) {
    return Promise.reject(new Error('Invalid quantity argument; please provide a non-negative number'))
      .nodeify(callback);
  }

  return this.sync()

    .then(function (dynos) {
      // less dynos are needed
      if (dynos.length > quantity) {
        return Promise.each(_.take(dynos, dynos.length - quantity), function (dyno) {
          return _this.stop(dyno);
        });
      }

      // more dynos are needed
      if (dynos.length < quantity) {
        return Promise.each(new Array(quantity - dynos.length), function () {
          return _this.start();
        });
      }
    })

    .nodeify(callback);
};

module.exports = Dyno;

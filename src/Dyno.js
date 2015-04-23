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
 * @param {String} [props.size=1x]
 */
function Dyno(props) {
  this.app = new Heroku({token: props.token}).apps(props.app);
  this.command = props.command;
  this.size = props.size || '1X';

  // init the EventEmitter
  EventEmitter.call(this);
  this.setMaxListeners(999);
}

// @extends EventEmitter
util.inherits(Dyno, EventEmitter);

/**
 * Scales the dyno to the designated quantity.
 * @param {Number} quantity the quantity
 * @param {Function} callback a callback function with (err) arguments
 * @return {Promise}
 */
Dyno.prototype.scale = function (quantity, callback) {
  var _this = this;

  if (!_.isNumber(quantity)) {
    return Promise.reject('Invalid quantity argument; expected number, received ' + type(quantity))
      .nodeify(callback);
  }

  if (quantity < 0) {
    return Promise.reject('Invalid quantity argument; please provide a non-negative number')
      .nodeify(callback);
  }

  var resolver = function (resolve, reject) {
    _this.app.dynos().list(function (err, dynos) {
      if (err) return reject(err);

      // filter-out other dynos
      dynos = dynos.filter(function (dyno) {
        return dyno.command === _this.command;
      });

      // determine if more or less dynos are needed
      if (dynos.length > quantity) {
        Promise.each(_.take(dynos, dynos.length - quantity), function (dyno) {
          return _this.app.dynos(dyno.id).restart()
            .then(function () {
              _this.emit('stop', dyno);
            });
        })
          .then(resolve);
      } else if (dynos.length < quantity) {
        Promise.each(new Array(quantity - dynos.length), function () {
          return _this.app.dynos().create({command: _this.command, size: _this.size})
            .then(function (dyno) {
              _this.emit('start', dyno);
            });
        })
          .then(resolve);
      } else {
        // do nothing
        resolve();
      }

      dynos.length = 0; // memory optimization
    });
  };

  return new Promise(resolver)
    .nodeify(callback);
};

module.exports = Dyno;

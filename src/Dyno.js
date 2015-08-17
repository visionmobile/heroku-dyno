import {EventEmitter} from 'events';
import Heroku from 'heroku-client';
import Promise from 'bluebird';
import _ from 'lodash';
import type from 'type-of';

class Dyno extends EventEmitter {

/**
   * Creates a new Heroku dyno of the designated properties.
   * @param {Object} props
   * @param {String} props.token
   * @param {String} props.app
   * @param {String} props.command
   * @param {Number} [props.autoSync]
   * @param {String} [props.size=1x]
   */
  constructor(props) {
    super();
    this.setMaxListeners(999);

    this.app = new Heroku({token: props.token}).apps(props.app);
    this.command = props.command;
    this.size = props.size || '1X';
    this._processes = [];
    this._syncTimeout = null;

    if (props.autoSync) {
      this.autoSync(props.autoSync);
    }
  }

  /**
   * Returns an array of running processes.
   * @return {Array.<Object>}
   */
  get runningProcesses() {
    return this._processes;
  }

  /**
   * Initiates a new running process on heroku.
   * @param {Function} [callback] optional callback function with (err, dyno) arguments
   * @return {Promise} resolving to the dyno object.
   */
  start(callback) {
    return Promise.resolve(this.app.dynos().create({command: this.command, size: this.size}))

      .then((dyno) => {
        this._processes.push(dyno);
        this.emit('start', dyno);
        return dyno;
      })

      .nodeify(callback);
  }

  /**
   * Terminates the designated running process on heroku.
   * @param {Object} dyno
   * @param {Function} [callback] optional callback function with (err) arguments
   * @return {Promise}
   */
  stop(dyno, callback) {
    return Promise.resolve(this.app.dynos(dyno.id).restart())

      .then(() => {
        var i = _.findIndex(this._processes, {id: dyno.id});

        if (i !== -1) {
          this._processes.splice(i, 1);
          this.emit('stop', dyno);
        }
      })

      .nodeify(callback);
  }

  /**
   * Syncs running processes with heroku.
   * @param {Function} [callback] optional callback function with (err, dynos) arguments
   * @return {Promise} resolvind to the active dynos on heroku
   */
  sync(callback) {
    return Promise.resolve(this.app.dynos().list())

      // filter-out other dynos
      .filter((dyno) => {
        return dyno.command === this.command;
      })

      // register running processes
      .each((e) => {
        if (_.findIndex(this._processes, {id: e.id}) === -1) {
          this._processes.push(e);
          this.emit('start', e);
        }
      })

      // unregister stopped processes
      .then((dynos) => {
        return Promise.each(this._processes, (e, i) => {
          if (_.findIndex(dynos, {id: e.id}) === -1) {
            this._processes.splice(i, 1);
            this.emit('stop', e);
          }
        })

          .return(dynos);
      })

      // emit sync and return dynos
      .then((dynos) => {
        this.emit('sync', this._processes);
        return dynos;
      })

      .nodeify(callback);
  }

  /**
   * Scales running processes to the designated quantity.
   * @param {Number} quantity the quantity
   * @param {Function} [callback] optional callback function with (err) arguments
   * @return {Promise}
   */
  scale(quantity, callback) {
    if (!_.isNumber(quantity)) {
      return Promise.reject(new Error('Invalid quantity argument; expected number, received ' + type(quantity)))
        .nodeify(callback);
    }

    if (quantity < 0) {
      return Promise.reject(new Error('Invalid quantity argument; please provide a non-negative number'))
        .nodeify(callback);
    }

    return this.sync()

      .then((dynos) => {
        // less dynos are needed
        if (dynos.length > quantity) {
          return Promise.each(_.take(dynos, dynos.length - quantity), (dyno) => {
            return this.stop(dyno);
          });
        }

        // more dynos are needed
        if (dynos.length < quantity) {
          return Promise.each(new Array(quantity - dynos.length), () => {
            return this.start();
          });
        }
      })

      .nodeify(callback);
  }

  /**
   * Enables automatic syncing with heroku every designated milliseconds.
   * @param {Number} ms
   */
  autoSync(ms) {
    if (!_.isNumber(ms)) {
      throw new Error('Invalid ms argument; expected number, received ' + type(ms));
    }

    if (ms <= 0) {
      clearTimeout(this._syncTimeout);
      this._syncTimeout = null;
      return;
    }

    if (ms < 5000) {
      clearTimeout(this._syncTimeout);
      this._syncTimeout = null;
      throw new Error('Timeout period is too short; please specifiy a timeout of 5000 milliseconds and above');
    }

    this._syncTimeout = setTimeout(() => {
      return this.sync()

        // slight delay to avoid immediate repetition
        .delay(10 * 1000)

        // recurse
        .finally(() => this.autoSync(ms));
    }, ms);
  }

}

export default Dyno;

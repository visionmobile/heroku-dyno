# Heroku Dyno

## Table of Contents

* [Constructor](#constructor)
* [Methods](#methods)
  * [scale(quantity)](#scale)
* [Events](#events)
  * [start](#start-event)
  * [stop](#stop-event)

## Constructor

Creates a new Heroku Dyno.

##### Parameters

* `props` _(Object)_ dyno properties (required)
  * `token` _(String)_ heroku API token (required)
  * `app` _(String)_ name of the application on heroku (required)
  * `command` _(String)_ command to run (required)
  * `size` _(String)_ dyno size; defaults to "1X"

##### Throws

_(Error)_ if props are invalid.

##### Example

```javascript
var Dyno = require('heroku-dyno');

var dyno = new Dyno({
  token: 'abcdfe1234567890',
  app: 'my-heroku-app',
  command: 'node process.js --arg=1',
  size: '2X'
});
```

## Methods

### <a name="scale" href="#scale">#</a>scale(quantity, [callback]) -> Promise

Scales the dyno according to the specified quantity.

##### Parameters

* `quantity` _(number)_ number of dyno processes to run
* `callback` _(Function)_ optional callback function with (err) arguments

##### Throws

_(Error)_ if quantity is invalid.

##### Returns

An empty bluebird promise.

##### Example

```javascript
dyno.scale(2)
  .then(function () {
    // dyno is running with 2 processes
  })
  .catch(function (err) {
    console.error(err);
  });
```

```javascript
dyno.scale(0)
  .then(function () {
    // dyno has been stopped
  })
  .catch(function (err) {
    console.error(err);
  });
```

## Events

### <a name="start-event" href="#start-event">@</a>start event

Event "start" is emitted a new dyno process has started.

##### Example

```javascript
dyno.on('start', function (info) {
  // do something with info
});
```

### <a name="stop-event" href="#stop-event">@</a>stop event

Event "stop" is emitted when a dyno process has stopped.

```javascript
db.on('stop', function (info) {
  // do something with info
});
```

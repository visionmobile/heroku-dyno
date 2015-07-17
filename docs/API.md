# Heroku Dyno

## Table of Contents

* [Constructor](#constructor)
* [Properties](#properties)
  * [runningProcesses](#runningProcesses)
  * [size](#size)
  * [command](#command)
* [Methods](#methods)
  * [scale(quantity)](#scale)
  * [autoSync(ms)](#autoSync)
* [Events](#events)
  * [start](#start-event)
  * [stop](#stop-event)
  * [sync](#sync-event)

## Constructor

Creates a new Heroku Dyno.

##### Parameters

* `props` _(Object)_ dyno properties (required)
  * `token` _(String)_ heroku API token (required)
  * `app` _(String)_ name of the application on heroku (required)
  * `command` _(String)_ command to run (required)
  * `size` _(String)_ dyno size; defaults to "1X"
  * `autoSync` _(Number)_ autosync interval between Heroku and the dyno; defaults to -1 (i.e. no auto-sync)

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

## Properties

### <a name="runningProcesses" href="#runningProcesses">#</a>runningProcesses -> Array.<Object>

Returns an array of running processes.

### <a name="size" href="#size">#</a>size -> String

Returns the size of the dyno, as specified on construction time (e.g. "Standard-1X").

### <a name="command" href="#command">#</a>command -> String

Returns the command executed, as specified on construction time (e.g. "node do-something.js").

## Methods

### <a name="scale" href="#scale">#</a>scale(quantity, [callback]) -> Promise

Scales dyno's running processes to the designated quantity.

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
    // 2 processes initiated
  })
  .catch(function (err) {
    console.error(err);
  });
```

```javascript
dyno.scale(0)
  .then(function () {
    // all processes has been terminated
  })
  .catch(function (err) {
    console.error(err);
  });
```

### <a name="autoSync" href="#autoSync">#</a>autoSync(ms) -> void

Enables automatic syncing with Heroku every designated milliseconds.

##### Parameters

* `ms` _(Number)_ milliseconds interval; must be greater than 5000 ms

##### Throws

_(Error)_ if ms is invalid.

##### Example

```javascript
dyno.autoSync(5000); // auto-sync every 5 seconds
```

```javascript
dyno.autoSync(-1); // disable auto-sync
```

##### Notes

* Disable auto-sync functionality by passing a negative or zero milliseconds interval

## Events

### <a name="start-event" href="#start-event">@</a>start event

Event "start" is emitted a new running process has started.

##### Example

```javascript
dyno.on('start', function (info) {
  // do something with info
});
```

### <a name="stop-event" href="#stop-event">@</a>stop event

##### Example

Event "stop" is emitted when a running process has stopped.

```javascript
db.on('stop', function (info) {
  // do something with info
});
```

### <a name="sync-event" href="#sync-event">@</a>sync event

##### Example

Event "sync" is emitted when the library has synced with heroku.

```javascript
db.on('sync', function (dynos) {
  // do something with active dynos
});
```

# Heroky Dyno

Unbaffled heroku dyno management.

#### Features

* Promise and callback interface;
* Simple API.

## Quick start

```javascript
var Dyno = require('heroku-dyno');

var dyno = new Dyno({
  token: 'abcdfe1234567890',
  app: 'my-heroku-app',
  command: 'node process.js --arg=1',
  size: '2X'
});

dyno.scale(1)
  .then(function () {
    // 1 process running
  })
  .catch(function (err) {
    console.error(err);
  });
```

For further information on how to use this library please refer to the [API docs](https://github.com/visionmobile/heroku-dyno/blob/master/docs/API.md).

## Installation

```
$ npm install heroku-dyno
```

#### Requirements

* Node.js 0.8+

## Contribute

Source code contributions are most welcome. The following rules apply:

1. JavaScript source code needs to follow the [Airbnb Style Guide](https://github.com/airbnb/javascript);
2. Functions need to be well documented in [API docs](https://github.com/visionmobile/heroku-dyno/blob/master/docs/API.md);
3. Unit tests are necessary.

## Support

If you are having issues with this library, please let us know.

* Issue Tracker: [github.com/visionmobile/heroku-dyno/issues](https://github.com/visionmobile/heroku-dyno/issues)

## License

MIT

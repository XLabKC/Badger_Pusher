var apn = require('apn');
var Firebase = require('firebase');

var ref = new Firebase('https://fiery-inferno-4698.firebaseio.com');
var apnConnection = new apn.Connection({});

require('./listeners/tasks')(apnConnection, ref);
require('./listeners/status')(apnConnection, ref);

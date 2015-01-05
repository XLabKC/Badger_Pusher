var apn = require('apn');
var Firebase = require('firebase');

var ref = new Firebase(process.env.FIREBASE_URL);
var apnConnection = new apn.Connection({
   passphrase: process.env.KEY_PASSPHRASE
});

require('./listeners/tasks')(apnConnection, ref);
require('./listeners/status')(apnConnection, ref);

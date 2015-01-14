var apn = require('apn');
var Firebase = require('firebase');

var ref = new Firebase(process.env.FIREBASE_URL);
var apnConnection = new apn.Connection({
   passphrase: process.env.KEY_PASSPHRASE
});

require('./listeners/newtask')(apnConnection, ref);
require('./listeners/completedtask')(apnConnection, ref);
require('./listeners/status')(apnConnection, ref);

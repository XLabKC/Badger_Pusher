var apn = require('apn');
var debug = require('debug')('pusher:status');
var Fetcher = require('../util/fetcher');
var async = require('async');

module.exports = function (connection, firebaseRef) {
   debug('starting')
   firebaseRef.child('push_status_updated').on('child_added', function (snapshot) {
      var uid = snapshot.key();
      var status = snapshot.val();
      debug('received new status (' + status + ') for "' + uid + '"');

      var fetcher = new Fetcher(firebaseRef);
      async.parallel({
         user: function (callback) {
            fetcher.getUser(uid, callback);
         },
         followers: function (callback) {
            fetcher.getFollowers(uid, callback);
         }
      }, function (error, results) {
         var user = results.user;
         var name = user.first_name + " " + user.last_name;
         var followers = results.followers;
         var textStatus = user[status + "_text"].toLowerCase();

         for (var i = 0; i < followers.length; i++) {
            if (followers[i].status == "free" && followers[i].device &&
                  followers[i].device.token) {
               var note = new apn.Notification();
               note.expiry = Math.floor(Date.now() / 1000) + 3600; // Expires 1 hour from now.
               note.alert = name + "is now " + textStatus;
               var device = new apn.Device(followers[i].device.token);
               connection.pushNotification(note, device);
            }
         }
      });
      // Remove the child.
      firebaseRef.child('push_status_updated').child(uid).remove();
   });
};

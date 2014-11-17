var apn = require('apn');
var debug = require('../util/debug')('status');
var Fetcher = require('../util/fetcher');

module.exports = function (connection, firebaseRef) {
   debug('starting')
   firebaseRef.child('new_status').on('child_added', function (snapshot) {
      var userId = snapshot.key();
      var status = snapshot.val();
      debug('received new status (' + messageId + ') for "' + userId + '"');

      var fetcher = new Fetcher(firebaseRef);
      async.parallel({
         user: function (callback) {
            fetcher.getUser(userId, callback);
         },
         followers: function (callback) {
            fetcher.getFollowers(userId, callback);
         }
      }, function (error, results) {
         var user = results.user;
         var name = user.first_name + " " + author.last_name;
         var followers = results.followers;

         for (var i = 0; i < followers.length; i++) {
            if (followers[i].status == "green" && followers[i].device &&
                  followers[i].device.token) {
               var note = new apn.Notification();
               note.expiry = Math.floor(Date.now() / 1000) + 3600; // Expires 1 hour from now.
               note.badge = 3;
               note.alert = name + "is now " + status;
               var device = new apn.Device(followers[i].device.token);
               connection.pushNotification(note, device);
               return;
            }
         }
      });
      
         apn.Device

         var followers = results.followers;

      });
   });
};

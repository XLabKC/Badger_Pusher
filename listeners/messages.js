var debug = require('../util/debug')('messages');
var Fetcher = require('../util/fetcher');
var apn = require('apn');

module.exports = function (connection, firebaseRef) {
   debug('starting')
   firebaseRef.child('new_messages').on('child_added', function (snapshot) {
      var userId = snapshot.val();
      var messageId = snapshot.key();
      debug('received new message "' + messageId + '" for "' + userId + '"');

      var fetcher = new Fetcher(firebaseRef);
      async.parallel({
         message: function (callback) {
            fetcher.getMessage(userId, messageId, callback);
         },
         user: function (callback) {
            fetcher.getUser(userId, callback);
         }
      }, function (error, results) {
         var user = results.user;
         var messages = results.message;

         fetcher.getUser(message.author, function (err, author) {
             // Attemp to send the push notification
            if (user.device && user.device.token) {
               // TODO: Check status of the user.
               var name = author.first_name + " " + author.last_name;
               var note = new apn.Notification();
               note.expiry = Math.floor(Date.now() / 1000) + 3600; // Expires 1 hour from now.
               note.badge = 3;
               note.alert = "You have a new message from " + name;
               note.payload = { 'messageFrom': message.author };
               var device = new apn.Device(user.device.token);
               connection.pushNotification(note, device);
               return;
            }
            debug('unable to push "' + messageId + '" to "' + userId + '"');
         });
      });     
   });
};

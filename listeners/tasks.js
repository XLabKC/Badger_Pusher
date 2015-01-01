var debug = require('debug')('pusher:tasks');
var Fetcher = require('../util/fetcher');
var apn = require('apn');
var async = require('async');

module.exports = function (connection, firebaseRef) {
   debug('starting');
   firebaseRef.child('push_new_task').on('child_added', function (snapshot) {
      var combinedId = Fetcher.separateCombinedId(snapshot.key());
      var uid = combinedId.uid;
      var taskId = combinedId.taskId;
      debug('received new task "' + taskId + '" for "' + uid + '"');
      
      var fetcher = new Fetcher(firebaseRef);
      async.parallel({
         task: function (callback) {
            fetcher.getActiveTask(uid, taskId, callback);
         },
         user: function (callback) {
            fetcher.getUser(uid, callback);
         }
      }, function (error, results) {
         var user = results.user;
         var task = results.task;

         if (!(user && task)) {
            debug('invalid user(' + JSON.stringify(user) + ') or task(' + JSON.stringify(task) + ')');
            return;
         }
         fetcher.getUser(task.author, function (err, author) {
             // Attempt to send the push notification.
            if (user.device && user.device.token) {
               // TODO: Check status of the user.
               var name = author.first_name + " " + author.last_name;
               var note = new apn.Notification();
               note.expiry = Math.floor(Date.now() / 1000) + 3600; // Expires 1 hour from now.
               note.alert = "You have a new task from " + name;
               note.payload = { 'taskFrom': message.author };
               var device = new apn.Device(user.device.token);
               connection.pushNotification(note, device);
               return;
            }
            debug('unable to push "' + taskId + '" to "' + uid + '"');
         });
      });     
      // Remove the child.
      firebaseRef.child('push_new_task').child(snapshot.key()).remove();
   });
};

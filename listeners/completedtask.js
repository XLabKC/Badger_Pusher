var debug = require('debug')('pusher:completedtask');
var Fetcher = require('../util/fetcher');
var apn = require('apn');
var async = require('async');

module.exports = function (connection, firebaseRef) {
   debug('starting');
   firebaseRef.child('push_completed_task').on('child_added', function (snapshot) {
      var combinedId = Fetcher.separateCombinedId(snapshot.key());
      var uid = combinedId.uid;
      var taskId = combinedId.taskId;
      debug('received new task "' + taskId + '" for "' + uid + '"');
      
      var fetcher = new Fetcher(firebaseRef);
      fetcher.getTaskAndUsers(uid, taskId, false, function (error, results) {
         if (error) {
            return debug('failed to retrieve data: ' + JSON.stringify(error));
         }
         if (!results.owner || !results.task || !results.author) {
            return debug('invalid data: ' + JSON.stringify(results));
         }
         var owner = results.owner;
         var task = results.task;
         var author = results.author;
         if (author.device && author.device.token) {
            var name = owner.first_name + " " + owner.last_name;
            var text = 'Completed: ' + task.title + '\nBy: ' + name;
            var note = new apn.Notification();
            note.expiry = Math.floor(Date.now() / 1000) + 3600; // Expires 1 hour from now.
            note.alert = text;
            note.sound = 'default';
            note.payload = { 
               'type': 'completed_task',
               'owner': uid,
               'task': taskId
            };
            var device = new apn.Device(owner.device.token);
            connection.pushNotification(note, device);
            return;
         }
         debug('unable to push "' + taskId + '" to "' + task.author + '"');
      });

      // Remove the child.
      firebaseRef.child('push_completed_task').child(snapshot.key()).remove();
   });
};

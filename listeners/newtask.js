var debug = require('debug')('pusher:newtask');
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
      fetcher.getTaskAndUsers(uid, taskId, true, function (error, results) {
         if (error) {
            return debug('failed to retrieve data: ' + JSON.stringify(error));
         }
         if (!results.owner || !results.task || !results.author) {
            return debug('invalid data: ' + JSON.stringify(results));
         }
         var owner = results.owner;
         var task = results.task;
         var author = results.author;
          // Attempt to send the push notification.
         if (owner.device && owner.device.token) {
            if (!shouldSend(owner.status, task.priority)) {
               debug('user(' + uid +') is not available to receive.');
               return;
            }
            var name = author.first_name + " " + author.last_name;
            var text = 'New task: ' + task.title + '\nAssigned by: ' + name;
            var note = new apn.Notification();
            note.expiry = Math.floor(Date.now() / 1000) + 3600; // Expires 1 hour from now.
            note.alert = text;
            note.sound = 'default';
            note.payload = { 
               'type': 'new_task',
               'author': task.author,
               'task': taskId
            };
            var device = new apn.Device(owner.device.token);
            connection.pushNotification(note, device);
            return;
         }
         debug('unable to push "' + taskId + '" to "' + uid + '"');
      });     
      // Remove the child.
      firebaseRef.child('push_new_task').child(snapshot.key()).remove();
   });
};

function shouldSend(status, priority) {
   var statuses = ["free", "occupied", "unavailable"];
   var priorities = ["low", "medium", "high"];
   var statusIndex = statuses.indexOf(status);
   var priorityIndex = priorities.indexOf(priority);
   return statusIndex <= priorityIndex;
}

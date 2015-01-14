var async = require('async');

var Fetcher = function (firebaseRef) {
   this.firebaseRef = firebaseRef;
}

Fetcher.prototype.getUser = function (uid, done) {
   var ref = this.firebaseRef.child('users').child(uid);
   ref.once('value', function (snapshot) {
      var user = snapshot.val();
      if (user) user.uid = uid;
      done(null, user);
   });
};

Fetcher.prototype.getTask = function (uid, taskId, active, done) {
   var key = active ? 'active_tasks' : 'completed_tasks';
   var ref = this.firebaseRef.child(key).child(uid).child(taskId);
   ref.once('value', function (snapshot) {
      var task = snapshot.val();
      if (task) task.id = taskId;
      done(null, task);
   });   
};

Fetcher.prototype.getFollowers = function (uid, done) {
   var userRef = this.firebaseRef.child('users');
   var followers = [];
   var concurrency = 5; 
   var self = this;

   var q = async.queue(function (uId, callback) {
      self.getUser(uId, function (error, user) {
         followers.push(user);
         callback();
      });
   }, concurrency);

   userRef.child(uid).child('followers').once('value', function(snapshot) {
      snapshot.forEach(function (snapshot) {
         q.push(snapshot.key());
      });
   });

   q.drain = function() {
      done(null, followers)
   };
};

Fetcher.prototype.getTaskAndUsers = function (uid, taskId, active, done) {
   var fetcher = this;
   async.parallel({
      task: function (callback) {
         fetcher.getTask(uid, taskId, active, callback);
      },
      owner: function (callback) {
         fetcher.getUser(uid, callback);
      }
   }, function (error, results) {
      if (error) return done(error);
      if (!results.task) return done('Invalid task: ' + uid + '^' + taskId);
      fetcher.getUser(results.task.author, function (error, author) {
         if (error) return done(error);
         results.author = author
         done(null, results);
      });
   });
};

Fetcher.separateCombinedId = function (combinedId) {
   var parts = combinedId.split('^');
   return {
      uid: parts[0],
      taskId: parts[1]
   };
};

module.exports = Fetcher
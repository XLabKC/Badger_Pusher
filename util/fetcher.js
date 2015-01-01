var async = require('async');

var Fetcher = function (firebaseRef) {
   this.firebaseRef = firebaseRef;
}

Fetcher.prototype.getUser = function (uid, done) {
   var ref = this.firebaseRef.child('users').child(uid);
   ref.once('value', function (snapshot) {
      var user = snapshot.val();
      user.uid = uid;
      done(null, user);
   });
};

Fetcher.prototype.getActiveTask = function (uid, taskId, done) {
   var ref = this.firebaseRef.child('active_tasks').child(uid).child(taskId);
   ref.once('value', function (snapshot) {
      done(null, snapshot.val());
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

Fetcher.separateCombinedId = function (combinedId) {
   var parts = combinedId.split('^');
   return {
      uid: parts[0],
      taskId: parts[1]
   };
};

module.exports = Fetcher
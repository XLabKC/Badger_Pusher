var async = require('async');

var Fetcher = function (firebaseRef) {
   this.firebaseRef = firebaseRef;
}

Fetcher.prototype.getUser = function (userId, done) {
   var ref = this.firebaseRef.child('users').child(userId);
   ref.once('value', function (snapshot) {
      var user = snapshot.val();
      user.userId = userId;
      done(null, user);
   });
};

Fetcher.prototype.getMessage = function (userId, messageId, done) {
   var ref = this.firebaseRef.child('messages').child(userId).child(messageId);
   ref.once('value', function (snapshot) {
      done(null, snapshot.val());
   });
};

Fetcher.prototype.getFollowers = function (userId, done) {
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

   userRef.child(userId).child('followers').once('value', function(snapshot) {
      snapshot.forEach(function (snapshot) {
         q.push(snapshot.key());
      });
   });

   q.drain = function() {
      done(null, followers)
   };
};



module.exports = Fetcher
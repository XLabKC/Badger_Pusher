module.exports = function (name) {
   if (process.env.NODE_ENV != "production") {
      try {
         return require('debug')(name);
      }
      catch (e) {
         console.log("Notice: 'debug' module is not available. Install the " +
               "devDependencies for debug messages.");
         return function () {};
      }
   }
};

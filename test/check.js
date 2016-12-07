/**
 * Helper method that assists in managing exceptions during async tests
 * http://stackoverflow.com/a/15208067
 */
module.exports = function check( done, f ) {
  try {
    f();
    done();
  } catch( e ) {
    done( e );
  }
};
/**
 * Helper method that assists in managing exceptions during async tests
 * http://stackoverflow.com/a/15208067
 */
export default function check(done, f) {
  try {
    f();
    done();
  } catch(e) {
    done(e);
  }
}
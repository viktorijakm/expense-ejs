
/**
 * Converts Mongoose validation errors to flash messages
 * @param {Object} err - Mongoose validation error
 * @param {Object} req - Express request object
 */
module.exports = function parseVErr(err, req) {
  if (!err.errors) return;
  for (const key in err.errors) {
    if (err.errors.hasOwnProperty(key)) {
      req.flash('error', err.errors[key].message);
    }
  }
};

/**
 * Validation Middleware
 * Reads results from express-validator chains and returns structured errors.
 */

const { validationResult } = require('express-validator');

/**
 * Runs after express-validator chains.
 * If validation errors exist, responds with 422 and a list of field errors.
 * Otherwise, passes control to the next handler.
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(422).json({
      success: false,
      statusCode: 422,
      message: 'Validation failed',
      errors: errors.array().map((err) => ({
        field: err.path,
        message: err.msg,
      })),
    });
  }

  next();
};

module.exports = validate;

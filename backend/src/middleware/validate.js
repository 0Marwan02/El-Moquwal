// middleware factory — bytakhod zod schema we byvalidate beh el body aw el query
const { AppError } = require('./errorHandler');

// bytakhod object feeh body / query / params schemas
function validate(schemas) {
  return (req, res, next) => {
    try {
      if (schemas.body) {
        const result = schemas.body.safeParse(req.body);
        if (!result.success) {
          const messages = result.error.issues.map((i) => i.message);
          return next(new AppError(messages.join(' — '), 400, 'VALIDATION_ERROR'));
        }
        req.body = result.data;
      }
      if (schemas.query) {
        const result = schemas.query.safeParse(req.query);
        if (!result.success) {
          return next(new AppError('بيانات الاستعلام غير صحيحة', 400, 'VALIDATION_ERROR'));
        }
        req.query = result.data;
      }
      if (schemas.params) {
        const result = schemas.params.safeParse(req.params);
        if (!result.success) {
          return next(new AppError('معرف غير صحيح', 400, 'VALIDATION_ERROR'));
        }
        req.params = result.data;
      }
      next();
    } catch (err) {
      next(err);
    }
  };
}

module.exports = { validate };

import { errorResponse } from '../utils/response.js';

/**
 * Creates Express middleware that validates req.body against a Zod schema.
 * On failure, returns 400 with a map of field-level error messages.
 *
 * @param {import('zod').ZodSchema} schema
 * @param {'body' | 'query' | 'params'} source - where to read data from (default: 'body')
 */
export function validate(schema, source = 'body') {
  return (req, res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      const fieldErrors = {};
      for (const issue of result.error.issues) {
        const key = issue.path.join('.') || '_root';
        if (!fieldErrors[key]) fieldErrors[key] = [];
        fieldErrors[key].push(issue.message);
      }
      return errorResponse(res, 400, 'Dữ liệu không hợp lệ', { fields: fieldErrors });
    }
    // Replace with parsed (coerced/defaulted) data
    req[source] = result.data;
    return next();
  };
}

export default validate;

export function paginate(query, { page = 1, limit = 20 } = {}) {
  const skip = (page - 1) * limit;
  return query.skip(skip).limit(limit);
}

export function okResponse(res, data, statusCode = 200) {
  return res.status(statusCode).json({ success: true, data });
}

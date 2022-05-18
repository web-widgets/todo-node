export function errorHandler(err, req, res, next) {
  console.error(err.stack);
  console.error(err);
  return res.status(500).send({ message: err.message });
}

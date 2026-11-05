const crypto = require('crypto');

/**
 * Request Tracing Middleware
 * Assigns or passes through X-Request-Id and attaches X-Response-Time header
 */
const requestTracer = (req, res, next) => {
  const requestId = req.headers['x-request-id'] || crypto.randomUUID();
  req.id = requestId;
  res.setHeader('X-Request-Id', requestId);

  const start = process.hrtime.bigint();

  res.on('finish', () => {
    const end = process.hrtime.bigint();
    const durationMs = Number(end - start) / 1e6;
    // Note: header is already sent if streaming, but for standard Express res.json it's tracked
  });

  // Calculate and set header before headers are sent
  const originalEnd = res.end;
  res.end = function (...args) {
    if (!res.headersSent) {
      const end = process.hrtime.bigint();
      const durationMs = (Number(end - start) / 1e6).toFixed(2);
      res.setHeader('X-Response-Time', `${durationMs}ms`);
    }
    return originalEnd.apply(this, args);
  };

  next();
};

module.exports = requestTracer;

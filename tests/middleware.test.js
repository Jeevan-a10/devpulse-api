const test = require('node:test');
const assert = require('node:assert/strict');
const requestTracer = require('../src/middleware/requestTracer');
const rateLimiter = require('../src/middleware/rateLimiter');

const mockResponse = () => {
  const res = {
    headers: {},
    statusCode: 200,
  };
  res.setHeader = function (key, val) {
    this.headers[key.toLowerCase()] = val;
  };
  res.status = function (code) {
    this.statusCode = code;
    return this;
  };
  res.json = function (data) {
    this.body = data;
    return this;
  };
  res.on = function () {};
  res.end = function () {};
  return res;
};

test('Middleware: requestTracer generates UUID when no header is provided', () => {
  const req = { headers: {} };
  const res = mockResponse();
  let nextCalled = false;

  requestTracer(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, true);
  assert.ok(req.id);
  assert.equal(res.headers['x-request-id'], req.id);
});

test('Middleware: requestTracer passes through existing x-request-id', () => {
  const customId = 'client-req-999-abc';
  const req = { headers: { 'x-request-id': customId } };
  const res = mockResponse();

  requestTracer(req, res, () => {});

  assert.equal(req.id, customId);
  assert.equal(res.headers['x-request-id'], customId);
});

test('Middleware: rateLimiter tracks request counts and sets headers', () => {
  const limiter = rateLimiter({ windowMs: 60000, max: 5 });
  const req = { ip: '192.168.1.10', headers: {} };
  const res = mockResponse();

  limiter(req, res, () => {});

  assert.equal(res.headers['x-ratelimit-limit'], 5);
  assert.equal(res.headers['x-ratelimit-remaining'], 4);
  assert.ok(typeof res.headers['x-ratelimit-reset'] === 'number');
});

test('Middleware: rateLimiter blocks with 429 when limit exceeded', () => {
  const limiter = rateLimiter({ windowMs: 60000, max: 2 });
  const ip = '10.0.0.50';

  const req1 = { ip, headers: {} };
  const res1 = mockResponse();
  limiter(req1, res1, () => {});
  assert.equal(res1.headers['x-ratelimit-remaining'], 1);

  const req2 = { ip, headers: {} };
  const res2 = mockResponse();
  limiter(req2, res2, () => {});
  assert.equal(res2.headers['x-ratelimit-remaining'], 0);

  // Third request exceeds limit
  const req3 = { ip, headers: {} };
  const res3 = mockResponse();
  let nextCalled = false;
  limiter(req3, res3, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, false);
  assert.equal(res3.statusCode, 429);
  assert.equal(res3.body.success, false);
  assert.ok(res3.headers['retry-after']);
});

const test = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const authController = require('../src/controllers/authController');
const taskController = require('../src/controllers/taskController');
const { protect, authorize, JWT_SECRET } = require('../src/middleware/auth');
const {
  validateRegister,
  validateLogin,
  validateProfileUpdate,
} = require('../src/middleware/validate');

const mockResponse = () => {
  const res = {};
  res.statusCode = 200;
  res.status = function (code) {
    this.statusCode = code;
    return this;
  };
  res.json = function (data) {
    this.body = data;
    return this;
  };
  return res;
};

// -------------------------------------------------------------
// Registration Validation Middleware Tests
// -------------------------------------------------------------

test('Auth Validation: validateRegister rejects missing or short name', () => {
  const req = {
    body: { name: 'A', email: 'test@example.com', password: 'password123' },
  };
  const res = mockResponse();
  let nextCalled = false;

  validateRegister(req, res, () => { nextCalled = true; });

  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 400);
  assert.equal(res.body.success, false);
  assert.match(res.body.message, /name.*at least 2 characters/i);
});

test('Auth Validation: validateRegister rejects invalid email', () => {
  const req = {
    body: { name: 'Alice Dev', email: 'not-an-email', password: 'password123' },
  };
  const res = mockResponse();
  let nextCalled = false;

  validateRegister(req, res, () => { nextCalled = true; });

  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 400);
  assert.equal(res.body.success, false);
  assert.match(res.body.message, /valid email address/i);
});

test('Auth Validation: validateRegister rejects short password (< 6 chars)', () => {
  const req = {
    body: { name: 'Alice Dev', email: 'alice@example.com', password: '123' },
  };
  const res = mockResponse();
  let nextCalled = false;

  validateRegister(req, res, () => { nextCalled = true; });

  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 400);
  assert.equal(res.body.success, false);
  assert.match(res.body.message, /password.*at least 6 characters/i);
});

test('Auth Validation: validateRegister rejects invalid role enum', () => {
  const req = {
    body: {
      name: 'Alice Dev',
      email: 'alice@example.com',
      password: 'password123',
      role: 'superman',
    },
  };
  const res = mockResponse();
  let nextCalled = false;

  validateRegister(req, res, () => { nextCalled = true; });

  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 400);
  assert.equal(res.body.success, false);
  assert.match(res.body.message, /invalid role/i);
});

test('Auth Validation: validateRegister succeeds with valid inputs', () => {
  const req = {
    body: {
      name: 'Alice Engineer',
      email: 'alice@devpulse.io',
      password: 'securePassword2026',
      role: 'developer',
    },
  };
  const res = mockResponse();
  let nextCalled = false;

  validateRegister(req, res, () => { nextCalled = true; });

  assert.equal(nextCalled, true);
});

// -------------------------------------------------------------
// Login Validation Middleware Tests
// -------------------------------------------------------------

test('Auth Validation: validateLogin rejects missing email', () => {
  const req = { body: { password: 'Password123' } };
  const res = mockResponse();
  let nextCalled = false;

  validateLogin(req, res, () => { nextCalled = true; });

  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 400);
  assert.equal(res.body.success, false);
  assert.match(res.body.message, /email is required/i);
});

test('Auth Validation: validateLogin rejects missing password', () => {
  const req = { body: { email: 'dev@devpulse.io' } };
  const res = mockResponse();
  let nextCalled = false;

  validateLogin(req, res, () => { nextCalled = true; });

  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 400);
  assert.equal(res.body.success, false);
  assert.match(res.body.message, /password is required/i);
});

// -------------------------------------------------------------
// Auth Controller Tests (Register & Login)
// -------------------------------------------------------------

test('Controller: register creates a new user and returns JWT token', async () => {
  const uniqueEmail = `testuser_${Date.now()}@devpulse.io`;
  const req = {
    body: {
      name: 'Test Engineer',
      email: uniqueEmail,
      password: 'MySecretPassword123',
      role: 'developer',
      bio: 'Writing automated backend tests',
    },
  };
  const res = mockResponse();

  await authController.register(req, res, (err) => { throw err; });

  assert.equal(res.statusCode, 201);
  assert.equal(res.body.success, true);
  assert.ok(res.body.token);
  assert.equal(res.body.user.email, uniqueEmail);
  assert.equal(res.body.user.role, 'developer');
  assert.equal(res.body.user.password, undefined); // Ensure password is excluded
});

test('Controller: register rejects duplicate email registration', async () => {
  const email = 'duplicate@devpulse.io';
  const req1 = {
    body: { name: 'User One', email, password: 'password123' },
  };
  const res1 = mockResponse();
  await authController.register(req1, res1, (err) => { throw err; });

  const req2 = {
    body: { name: 'User Two', email, password: 'password456' },
  };
  const res2 = mockResponse();
  await authController.register(req2, res2, (err) => { throw err; });

  assert.equal(res2.statusCode, 400);
  assert.equal(res2.body.success, false);
  assert.match(res2.body.message, /already exists/i);
});

test('Controller: login authenticates valid credentials and returns token', async () => {
  const req = {
    body: {
      email: 'dev@devpulse.io',
      password: 'Password123',
    },
  };
  const res = mockResponse();

  await authController.login(req, res, (err) => { throw err; });

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.success, true);
  assert.ok(res.body.token);
  assert.equal(res.body.user.email, 'dev@devpulse.io');
  assert.equal(res.body.user.role, 'developer');
});

test('Controller: login rejects incorrect password', async () => {
  const req = {
    body: {
      email: 'dev@devpulse.io',
      password: 'WrongPassword999',
    },
  };
  const res = mockResponse();

  await authController.login(req, res, (err) => { throw err; });

  assert.equal(res.statusCode, 401);
  assert.equal(res.body.success, false);
  assert.match(res.body.message, /invalid email or password/i);
});

test('Controller: login rejects unregistered email', async () => {
  const req = {
    body: {
      email: 'nonexistent@devpulse.io',
      password: 'Password123',
    },
  };
  const res = mockResponse();

  await authController.login(req, res, (err) => { throw err; });

  assert.equal(res.statusCode, 401);
  assert.equal(res.body.success, false);
  assert.match(res.body.message, /invalid email or password/i);
});

// -------------------------------------------------------------
// Authentication & RBAC Middleware Tests
// -------------------------------------------------------------

test('Middleware: protect blocks request without Authorization header', async () => {
  const req = { headers: {} };
  const res = mockResponse();
  let nextCalled = false;

  await protect(req, res, () => { nextCalled = true; });

  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 401);
  assert.equal(res.body.success, false);
  assert.match(res.body.message, /access token is required/i);
});

test('Middleware: protect blocks request with malformed or invalid token', async () => {
  const req = { headers: { authorization: 'Bearer invalid.token.value' } };
  const res = mockResponse();
  let nextCalled = false;

  await protect(req, res, () => { nextCalled = true; });

  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 401);
  assert.equal(res.body.success, false);
  assert.match(res.body.message, /invalid or expired/i);
});

test('Middleware: protect authorizes valid JWT and sets req.user', async () => {
  const validToken = jwt.sign(
    { id: 'user_dev_01', name: 'Jeevan Developer', email: 'dev@devpulse.io', role: 'developer' },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

  const req = { headers: { authorization: `Bearer ${validToken}` } };
  const res = mockResponse();
  let nextCalled = false;

  await protect(req, res, () => { nextCalled = true; });

  assert.equal(nextCalled, true);
  assert.ok(req.user);
  assert.equal(req.user.email, 'dev@devpulse.io');
});

test('Middleware: authorize allows permitted roles', () => {
  const req = { user: { role: 'lead' } };
  const res = mockResponse();
  let nextCalled = false;

  const leadOnlyMiddleware = authorize('lead', 'admin');
  leadOnlyMiddleware(req, res, () => { nextCalled = true; });

  assert.equal(nextCalled, true);
});

test('Middleware: authorize blocks unpermitted roles with 403 Forbidden', () => {
  const req = { user: { role: 'developer' } };
  const res = mockResponse();
  let nextCalled = false;

  const leadOnlyMiddleware = authorize('lead', 'admin');
  leadOnlyMiddleware(req, res, () => { nextCalled = true; });

  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 403);
  assert.equal(res.body.success, false);
  assert.match(res.body.message, /Forbidden.*role 'developer'/i);
});

// -------------------------------------------------------------
// Profile & Password Controller Tests
// -------------------------------------------------------------

test('Controller: getMe returns current authenticated user profile', async () => {
  const req = {
    user: {
      _id: 'user_dev_01',
      name: 'Jeevan Developer',
      email: 'dev@devpulse.io',
      role: 'developer',
      bio: 'Full-stack MERN builder',
    },
  };
  const res = mockResponse();

  await authController.getMe(req, res, (err) => { throw err; });

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.success, true);
  assert.equal(res.body.data.email, 'dev@devpulse.io');
});

test('Controller: updateProfile updates user details', async () => {
  const req = {
    user: { _id: 'user_dev_01', id: 'user_dev_01' },
    body: { name: 'Jeevan Senior Dev', bio: 'Senior MERN & Cloud Architect' },
  };
  const res = mockResponse();

  await authController.updateProfile(req, res, (err) => { throw err; });

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.success, true);
  assert.equal(res.body.data.name, 'Jeevan Senior Dev');
  assert.equal(res.body.data.bio, 'Senior MERN & Cloud Architect');
});

test('Controller: changePassword updates password with valid current password', async () => {
  const req = {
    user: { _id: 'user_dev_01', id: 'user_dev_01' },
    body: {
      currentPassword: 'Password123',
      newPassword: 'BrandNewSecurePassword456',
    },
  };
  const res = mockResponse();

  await authController.changePassword(req, res, (err) => { throw err; });

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.success, true);
  assert.match(res.body.message, /Password updated successfully/i);

  // Verify login now works with the new password
  const loginReq = {
    body: {
      email: 'dev@devpulse.io',
      password: 'BrandNewSecurePassword456',
    },
  };
  const loginRes = mockResponse();
  await authController.login(loginReq, loginRes, (err) => { throw err; });

  assert.equal(loginRes.statusCode, 200);
  assert.equal(loginRes.body.success, true);
});

// -------------------------------------------------------------
// User-Scoped Tasks Integration Test
// -------------------------------------------------------------

test('Controller: getMyTasks returns tasks created by authenticated user', async () => {
  const userId = 'user_dev_01';
  // Create task with user set
  const createReq = {
    user: { _id: userId, id: userId },
    body: {
      title: 'Authenticated User Task',
      category: 'Backend',
      priority: 'high',
    },
  };
  const createRes = mockResponse();
  await taskController.createTask(createReq, createRes, (err) => { throw err; });

  // Fetch my tasks
  const myTasksReq = { user: { _id: userId, id: userId } };
  const myTasksRes = mockResponse();
  await taskController.getMyTasks(myTasksReq, myTasksRes, (err) => { throw err; });

  assert.equal(myTasksRes.statusCode, 200);
  assert.equal(myTasksRes.body.success, true);
  assert.ok(Array.isArray(myTasksRes.body.data));
  const found = myTasksRes.body.data.find(t => t.title === 'Authenticated User Task');
  assert.ok(found);
  assert.equal(found.user, userId);
});

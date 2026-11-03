const test = require('node:test');
const assert = require('node:assert/strict');
const taskController = require('../src/controllers/taskController');
const {
  validateCreateTask,
  validateUpdateTask,
  validateId,
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

test('Validation Middleware: validateCreateTask rejects empty title', () => {
  const req = { body: { category: 'Backend' } };
  const res = mockResponse();
  let nextCalled = false;

  validateCreateTask(req, res, () => { nextCalled = true; });

  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 400);
  assert.equal(res.body.success, false);
  assert.match(res.body.message, /title is required/i);
});

test('Validation Middleware: validateCreateTask rejects invalid category', () => {
  const req = { body: { title: 'Valid title', category: 'InvalidCategory' } };
  const res = mockResponse();
  let nextCalled = false;

  validateCreateTask(req, res, () => { nextCalled = true; });

  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 400);
  assert.equal(res.body.success, false);
  assert.match(res.body.message, /invalid category/i);
});

test('Validation Middleware: validateCreateTask passes with valid payload', () => {
  const req = { body: { title: 'Implement validation', category: 'Backend', priority: 'high' } };
  const res = mockResponse();
  let nextCalled = false;

  validateCreateTask(req, res, () => { nextCalled = true; });

  assert.equal(nextCalled, true);
});

test('Controller: createTask creates a new task', async () => {
  const req = {
    body: {
      title: 'Setup Mongoose Schema & Middleware',
      description: 'Defined schema constraints and validation pipeline',
      category: 'Backend',
      priority: 'high',
      status: 'in-progress',
      tags: ['mongoose', 'express'],
    },
  };
  const res = mockResponse();

  await taskController.createTask(req, res, (err) => { throw err; });

  assert.equal(res.statusCode, 201);
  assert.equal(res.body.success, true);
  assert.equal(res.body.data.title, 'Setup Mongoose Schema & Middleware');
  assert.equal(res.body.data.category, 'Backend');
});

test('Controller: getTasks returns task list', async () => {
  const req = { query: {} };
  const res = mockResponse();

  await taskController.getTasks(req, res, (err) => { throw err; });

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.success, true);
  assert.ok(Array.isArray(res.body.data));
  assert.ok(res.body.count > 0);
});

test('Controller: getTaskStats returns valid metrics', async () => {
  const req = {};
  const res = mockResponse();

  await taskController.getTaskStats(req, res, (err) => { throw err; });

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.success, true);
  assert.ok(res.body.stats.total >= 1);
  assert.ok('completionRate' in res.body.stats);
});

test('Controller: updateTask marks task as completed with timestamp', async () => {
  const createReq = {
    body: { title: 'Temporary task for update test', category: 'Testing' },
  };
  const createRes = mockResponse();
  await taskController.createTask(createReq, createRes, (err) => { throw err; });
  const taskId = createRes.body.data._id || createRes.body.data.id;

  const updateReq = {
    params: { id: taskId },
    body: { status: 'completed' },
  };
  const updateRes = mockResponse();
  await taskController.updateTask(updateReq, updateRes, (err) => { throw err; });

  assert.equal(updateRes.statusCode, 200);
  assert.equal(updateRes.body.success, true);
  assert.equal(updateRes.body.data.status, 'completed');
  assert.ok(updateRes.body.data.completedAt !== null);
});

test('Controller: deleteTask removes task', async () => {
  const createReq = {
    body: { title: 'Temporary task for delete test', category: 'Testing' },
  };
  const createRes = mockResponse();
  await taskController.createTask(createReq, createRes, (err) => { throw err; });
  const taskId = createRes.body.data._id || createRes.body.data.id;

  const deleteReq = { params: { id: taskId } };
  const deleteRes = mockResponse();
  await taskController.deleteTask(deleteReq, deleteRes, (err) => { throw err; });

  assert.equal(deleteRes.statusCode, 200);
  assert.equal(deleteRes.body.success, true);
});

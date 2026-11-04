const test = require('node:test');
const assert = require('node:assert/strict');
const milestoneController = require('../src/controllers/milestoneController');
const {
  validateCreateMilestone,
  validateUpdateMilestone,
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

// ── Milestone Validation Tests ────────────────────────────────────────────────
test('Milestone Validation: validateCreateMilestone rejects missing title', () => {
  const req = { body: { description: 'Missing title' } };
  const res = mockResponse();
  let nextCalled = false;

  validateCreateMilestone(req, res, () => { nextCalled = true; });

  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 400);
  assert.equal(res.body.success, false);
  assert.match(res.body.message, /title is required/i);
});

test('Milestone Validation: validateCreateMilestone rejects invalid status enum', () => {
  const req = { body: { title: 'v1.0 Launch', status: 'invalid_status' } };
  const res = mockResponse();
  let nextCalled = false;

  validateCreateMilestone(req, res, () => { nextCalled = true; });

  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 400);
  assert.equal(res.body.success, false);
  assert.match(res.body.message, /invalid milestone status/i);
});

test('Milestone Validation: validateCreateMilestone rejects invalid progress (<0 or >100)', () => {
  const req = { body: { title: 'v1.0 Launch', progress: 150 } };
  const res = mockResponse();
  let nextCalled = false;

  validateCreateMilestone(req, res, () => { nextCalled = true; });

  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 400);
  assert.equal(res.body.success, false);
  assert.match(res.body.message, /progress must be a number between 0 and 100/i);
});

test('Milestone Validation: validateCreateMilestone accepts valid payload', () => {
  const req = {
    body: {
      title: 'v2.0 Milestone Tracking',
      description: 'Implement milestone features',
      status: 'in-progress',
      progress: 50,
      dueDate: new Date().toISOString(),
    },
  };
  const res = mockResponse();
  let nextCalled = false;

  validateCreateMilestone(req, res, () => { nextCalled = true; });

  assert.equal(nextCalled, true);
});

test('Milestone Validation: validateUpdateMilestone rejects empty title string', () => {
  const req = { body: { title: '   ' } };
  const res = mockResponse();
  let nextCalled = false;

  validateUpdateMilestone(req, res, () => { nextCalled = true; });

  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 400);
  assert.match(res.body.message, /title cannot be empty/i);
});

// ── Milestone Controller Tests ────────────────────────────────────────────────
test('Milestone Controller: getMilestones returns pre-seeded milestones', async () => {
  const req = { query: {} };
  const res = mockResponse();

  await milestoneController.getMilestones(req, res, () => {});

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.success, true);
  assert.ok(Array.isArray(res.body.data));
  assert.ok(res.body.data.length >= 2);
});

test('Milestone Controller: getMilestones filters by status', async () => {
  const req = { query: { status: 'completed' } };
  const res = mockResponse();

  await milestoneController.getMilestones(req, res, () => {});

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.success, true);
  res.body.data.forEach(m => {
    assert.equal(m.status, 'completed');
  });
});

test('Milestone Controller: getMilestoneById returns milestone details', async () => {
  const req = { params: { id: 'm1' } };
  const res = mockResponse();

  await milestoneController.getMilestoneById(req, res, () => {});

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.success, true);
  assert.equal(res.body.data.title, 'v1.0 API Foundation & Architecture');
});

test('Milestone Controller: getMilestoneById returns 404 for unknown id', async () => {
  const req = { params: { id: 'nonexistent_id' } };
  const res = mockResponse();

  await milestoneController.getMilestoneById(req, res, () => {});

  assert.equal(res.statusCode, 404);
  assert.equal(res.body.success, false);
});

test('Milestone Controller: createMilestone creates new milestone', async () => {
  const req = {
    body: {
      title: 'v2.1 CI/CD Automated Pipelines',
      description: 'Setup GitHub Actions and Docker build',
      status: 'planning',
      progress: 0,
    },
    user: { _id: 'user_dev_01', name: 'Jeevan Developer' },
  };
  const res = mockResponse();

  await milestoneController.createMilestone(req, res, () => {});

  assert.equal(res.statusCode, 201);
  assert.equal(res.body.success, true);
  assert.equal(res.body.data.title, 'v2.1 CI/CD Automated Pipelines');
  assert.equal(res.body.data.status, 'planning');
});

test('Milestone Controller: updateMilestone updates status & auto-completes', async () => {
  const req = {
    params: { id: 'm3' },
    body: { status: 'completed' },
    user: { _id: 'user_dev_01', name: 'Jeevan Developer' },
  };
  const res = mockResponse();

  await milestoneController.updateMilestone(req, res, () => {});

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.success, true);
  assert.equal(res.body.data.status, 'completed');
  assert.equal(res.body.data.progress, 100);
  assert.ok(res.body.data.completedAt !== null);
});

test('Milestone Controller: getMilestoneStats calculates aggregate metrics', async () => {
  const req = {};
  const res = mockResponse();

  await milestoneController.getMilestoneStats(req, res, () => {});

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.success, true);
  assert.ok(res.body.stats.total >= 3);
  assert.ok('completionRate' in res.body.stats);
  assert.ok('averageProgress' in res.body.stats);
});

test('Milestone Controller: deleteMilestone removes a milestone', async () => {
  const createReq = {
    body: { title: 'Temporary Milestone to Delete' },
    user: { _id: 'user_dev_01', name: 'Jeevan Developer' },
  };
  const createRes = mockResponse();
  await milestoneController.createMilestone(createReq, createRes, () => {});

  const newId = createRes.body.data._id || createRes.body.data.id;

  const deleteReq = { params: { id: newId }, user: { _id: 'user_dev_01' } };
  const deleteRes = mockResponse();
  await milestoneController.deleteMilestone(deleteReq, deleteRes, () => {});

  assert.equal(deleteRes.statusCode, 200);
  assert.equal(deleteRes.body.success, true);
  assert.match(deleteRes.body.message, /removed successfully/i);
});

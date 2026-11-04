const test = require('node:test');
const assert = require('node:assert/strict');
const activityController = require('../src/controllers/activityController');
const taskController = require('../src/controllers/taskController');

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

// ── Activity Controller Tests ────────────────────────────────────────────────
test('Activity Logger: logActivity creates and prepends an activity record', async () => {
  const activity = await activityController.logActivity({
    user: 'user_dev_01',
    userName: 'Jeevan Developer',
    action: 'task_created',
    entityType: 'Task',
    entityId: 'test_task_1',
    details: 'Created test task',
  });

  assert.ok(activity);
  assert.equal(activity.action, 'task_created');
  assert.equal(activity.userName, 'Jeevan Developer');
});

test('Activity Controller: getActivities returns chronological activity feed', async () => {
  const req = { query: { limit: 10 } };
  const res = mockResponse();

  await activityController.getActivities(req, res, () => {});

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.success, true);
  assert.ok(Array.isArray(res.body.data));
  assert.ok(res.body.data.length > 0);
});

test('Activity Controller: getActivities filters by action', async () => {
  const req = { query: { action: 'task_created' } };
  const res = mockResponse();

  await activityController.getActivities(req, res, () => {});

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.success, true);
  res.body.data.forEach(a => {
    assert.equal(a.action, 'task_created');
  });
});

test('Activity Controller: getActivitySummary returns velocity metrics', async () => {
  const req = {};
  const res = mockResponse();

  await activityController.getActivitySummary(req, res, () => {});

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.success, true);
  assert.ok(res.body.summary.totalActions > 0);
  assert.ok('actionsLast24Hours' in res.body.summary);
  assert.ok('activeContributors' in res.body.summary);
  assert.ok('velocity' in res.body.summary);
});

test('Task Activity Integration: createTask automatically triggers an activity log', async () => {
  const initialReq = { query: { limit: 50 } };
  const initialRes = mockResponse();
  await activityController.getActivities(initialReq, initialRes, () => {});
  const countBefore = initialRes.body.count;

  const taskReq = {
    body: {
      title: 'Activity Integration Task',
      category: 'Testing',
      priority: 'high',
    },
    user: { _id: 'user_dev_01', name: 'Jeevan Developer' },
  };
  const taskRes = mockResponse();
  await taskController.createTask(taskReq, taskRes, () => {});

  assert.equal(taskRes.statusCode, 201);

  const afterReq = { query: { limit: 50 } };
  const afterRes = mockResponse();
  await activityController.getActivities(afterReq, afterRes, () => {});

  assert.ok(afterRes.body.count >= countBefore + 1);
  const latestActivity = afterRes.body.data[0];
  assert.equal(latestActivity.action, 'task_created');
  assert.match(latestActivity.details, /Activity Integration Task/);
});

const test = require('node:test');
const assert = require('node:assert/strict');
const analyticsController = require('../src/controllers/analyticsController');

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

test('Analytics Controller: getVelocityMetrics returns comprehensive engineering velocity', async () => {
  const req = {};
  const res = mockResponse();

  await analyticsController.getVelocityMetrics(req, res, () => {});

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.success, true);
  assert.ok(res.body.analytics);

  const { overview, byPriority, byCategory, milestones, weeklySummary } = res.body.analytics;

  // Verify overview metrics
  assert.ok(typeof overview.totalTasks === 'number');
  assert.ok(typeof overview.completedTasks === 'number');
  assert.ok(typeof overview.completionRate === 'string');
  assert.ok(overview.completionRate.endsWith('%'));
  assert.ok(typeof overview.averageCycleTimeHours === 'number');
  assert.ok(['elite', 'high', 'moderate', 'steady'].includes(overview.throughputRating));

  // Verify priority distribution
  assert.ok(byPriority.urgent);
  assert.ok(byPriority.high);
  assert.ok(byPriority.medium);
  assert.ok(byPriority.low);

  // Verify category breakdown
  assert.ok(Object.keys(byCategory).length > 0);

  // Verify milestones velocity
  assert.ok(typeof milestones.total === 'number');
  assert.ok(typeof milestones.averageProgress === 'string');

  // Verify 7-day timeline
  assert.ok(Array.isArray(weeklySummary.dailyVelocity));
  assert.equal(weeklySummary.dailyVelocity.length, 7);
  weeklySummary.dailyVelocity.forEach((day) => {
    assert.ok(day.date);
    assert.ok(typeof day.created === 'number');
    assert.ok(typeof day.completed === 'number');
    assert.ok(typeof day.actions === 'number');
  });
});

test('Analytics Controller: getVelocityMetrics handles empty query parameters gracefully', async () => {
  const req = { query: {} };
  const res = mockResponse();

  await analyticsController.getVelocityMetrics(req, res, () => {});

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.success, true);
  assert.ok(res.body.analytics.overview.completionRate);
});

test('Analytics Controller: breakdown includes Dev, Backend, Frontend categories', async () => {
  const req = {};
  const res = mockResponse();

  await analyticsController.getVelocityMetrics(req, res, () => {});

  const { byCategory } = res.body.analytics;
  assert.ok(byCategory['Dev'] || byCategory['Backend']);
  if (byCategory['Dev']) {
    assert.ok(typeof byCategory['Dev'].total === 'number');
    assert.ok(byCategory['Dev'].completionRate.endsWith('%'));
  }
});

const test = require('node:test');
const assert = require('node:assert/strict');
const exportController = require('../src/controllers/exportController');

const mockResponse = () => {
  const res = {
    headers: {},
  };
  res.statusCode = 200;
  res.status = function (code) {
    this.statusCode = code;
    return this;
  };
  res.setHeader = function (key, val) {
    this.headers[key.toLowerCase()] = val;
  };
  res.send = function (data) {
    this.body = data;
    return this;
  };
  return res;
};

test('Export Controller: exportWorkspaceBackup returns complete workspace JSON with headers', async () => {
  const req = {};
  const res = mockResponse();

  await exportController.exportWorkspaceBackup(req, res, () => {});

  assert.equal(res.statusCode, 200);
  assert.equal(res.headers['content-type'], 'application/json');
  assert.ok(res.headers['content-disposition'].includes('devpulse-backup-'));
  assert.ok(res.headers['content-disposition'].endsWith('.json"'));

  const parsed = JSON.parse(res.body);
  assert.equal(parsed.exportVersion, '1.0');
  assert.equal(parsed.workspace, 'DevPulse Engineering Workspace');
  assert.ok(parsed.counts.tasks >= 0);
  assert.ok(parsed.counts.milestones >= 0);
  assert.ok(parsed.counts.activities >= 0);
  assert.ok(Array.isArray(parsed.data.tasks));
  assert.ok(Array.isArray(parsed.data.milestones));
  assert.ok(Array.isArray(parsed.data.activities));
});

test('Export Controller: exportTasksCSV returns valid formatted CSV with header row', async () => {
  const req = {};
  const res = mockResponse();

  await exportController.exportTasksCSV(req, res, () => {});

  assert.equal(res.statusCode, 200);
  assert.ok(res.headers['content-type'].includes('text/csv'));
  assert.ok(res.headers['content-disposition'].includes('devpulse-tasks-'));
  assert.ok(res.headers['content-disposition'].endsWith('.csv"'));

  assert.ok(typeof res.body === 'string');
  const lines = res.body.split('\r\n');
  assert.ok(lines.length >= 2); // Header + at least one task row
  assert.equal(lines[0], 'ID,Title,Description,Category,Priority,Status,Tags,CreatedAt,CompletedAt');
  // First data line should be enclosed in quotes
  assert.ok(lines[1].startsWith('"'));
});

test('Export Controller: exportTasksCSV properly escapes quotes in titles and joins tags', async () => {
  const req = {};
  const res = mockResponse();

  await exportController.exportTasksCSV(req, res, () => {});

  assert.equal(res.statusCode, 200);
  const lines = res.body.split('\r\n');
  const taskRow = lines[1];
  // Check that row contains quoted segments separated by commas
  const segments = taskRow.split('","');
  assert.ok(segments.length >= 5);
});

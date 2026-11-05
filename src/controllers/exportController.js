const { getRawTasks } = require('./taskController');
const { getRawMilestones } = require('./milestoneController');
const { getRawActivities } = require('./activityController');

/**
 * Escapes field for CSV compliance
 */
const escapeCSV = (field) => {
  if (field === null || field === undefined) return '""';
  let str = String(field);
  if (Array.isArray(field)) {
    str = field.join('; ');
  }
  str = str.replace(/"/g, '""');
  return `"${str}"`;
};

/**
 * @desc    Export entire workspace state (tasks, milestones, activities) as JSON backup
 * @route   GET /api/export/backup
 */
const exportWorkspaceBackup = async (req, res, next) => {
  try {
    const [tasks, milestones, activities] = await Promise.all([
      getRawTasks(),
      getRawMilestones(),
      getRawActivities(),
    ]);

    const dateStr = new Date().toISOString().slice(0, 10);
    const backupPayload = {
      exportVersion: '1.0',
      exportedAt: new Date().toISOString(),
      workspace: 'DevPulse Engineering Workspace',
      counts: {
        tasks: tasks.length,
        milestones: milestones.length,
        activities: activities.length,
      },
      data: {
        tasks,
        milestones,
        activities,
      },
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="devpulse-backup-${dateStr}.json"`);
    return res.status(200).send(JSON.stringify(backupPayload, null, 2));
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Export tasks as downloadable CSV
 * @route   GET /api/export/tasks/csv
 */
const exportTasksCSV = async (req, res, next) => {
  try {
    const tasks = await getRawTasks();
    const dateStr = new Date().toISOString().slice(0, 10);

    const headers = ['ID', 'Title', 'Description', 'Category', 'Priority', 'Status', 'Tags', 'CreatedAt', 'CompletedAt'];
    const rows = tasks.map((t) => [
      escapeCSV(t._id || t.id),
      escapeCSV(t.title),
      escapeCSV(t.description || ''),
      escapeCSV(t.category || 'Dev'),
      escapeCSV(t.priority || 'medium'),
      escapeCSV(t.status || 'pending'),
      escapeCSV(t.tags || []),
      escapeCSV(t.createdAt || ''),
      escapeCSV(t.completedAt || ''),
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="devpulse-tasks-${dateStr}.csv"`);
    return res.status(200).send(csvContent);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  exportWorkspaceBackup,
  exportTasksCSV,
};

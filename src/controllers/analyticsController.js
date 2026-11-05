const { getRawTasks } = require('./taskController');
const { getRawMilestones } = require('./milestoneController');
const { getRawActivities } = require('./activityController');

/**
 * @desc    Get comprehensive engineering velocity and workspace analytics
 * @route   GET /api/analytics/velocity
 */
const getVelocityMetrics = async (req, res, next) => {
  try {
    const [tasks, milestones, activities] = await Promise.all([
      getRawTasks(),
      getRawMilestones(),
      getRawActivities(),
    ]);

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t) => t.status === 'completed');
    const inProgressTasks = tasks.filter((t) => t.status === 'in-progress');
    const pendingTasks = tasks.filter((t) => t.status === 'pending');

    const completionRate = totalTasks > 0 ? Math.round((completedTasks.length / totalTasks) * 100) : 0;

    // Calculate Average Cycle Time (hours from createdAt to completedAt)
    let totalCycleTimeMs = 0;
    let timedTasksCount = 0;

    completedTasks.forEach((t) => {
      if (t.completedAt && t.createdAt) {
        const diff = new Date(t.completedAt).getTime() - new Date(t.createdAt).getTime();
        if (diff > 0) {
          totalCycleTimeMs += diff;
          timedTasksCount += 1;
        }
      }
    });

    const averageCycleTimeHours = timedTasksCount > 0
      ? +(totalCycleTimeMs / (timedTasksCount * 3600000)).toFixed(1)
      : 0;

    // Breakdown by Priority
    const priorities = ['urgent', 'high', 'medium', 'low'];
    const byPriority = {};
    priorities.forEach((p) => {
      const match = tasks.filter((t) => t.priority === p);
      const done = match.filter((t) => t.status === 'completed').length;
      byPriority[p] = {
        total: match.length,
        completed: done,
        completionRate: match.length > 0 ? `${Math.round((done / match.length) * 100)}%` : '0%',
      };
    });

    // Breakdown by Category
    const byCategory = {};
    tasks.forEach((t) => {
      const cat = t.category || 'General';
      if (!byCategory[cat]) {
        byCategory[cat] = { total: 0, completed: 0, inProgress: 0, pending: 0 };
      }
      byCategory[cat].total += 1;
      if (t.status === 'completed') byCategory[cat].completed += 1;
      else if (t.status === 'in-progress') byCategory[cat].inProgress += 1;
      else byCategory[cat].pending += 1;
    });

    Object.keys(byCategory).forEach((cat) => {
      const c = byCategory[cat];
      c.completionRate = c.total > 0 ? `${Math.round((c.completed / c.total) * 100)}%` : '0%';
    });

    // Milestone Velocity
    const totalMilestones = milestones.length;
    const completedMilestones = milestones.filter((m) => m.status === 'completed').length;
    const inProgressMilestones = milestones.filter((m) => m.status === 'in-progress').length;
    const planningMilestones = milestones.filter((m) => m.status === 'planning').length;
    const totalProgress = milestones.reduce((sum, m) => sum + (Number(m.progress) || 0), 0);
    const averageProgress = totalMilestones > 0 ? Math.round(totalProgress / totalMilestones) : 0;

    // 7-Day Velocity Timeline
    const dailyVelocity = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const targetDate = new Date(now);
      targetDate.setDate(targetDate.getDate() - i);
      const dateStr = targetDate.toISOString().slice(0, 10);

      const createdOnDay = tasks.filter((t) => t.createdAt && t.createdAt.slice(0, 10) === dateStr).length;
      const completedOnDay = tasks.filter((t) => t.completedAt && t.completedAt.slice(0, 10) === dateStr).length;
      const actionsOnDay = activities.filter((a) => a.createdAt && a.createdAt.slice(0, 10) === dateStr).length;

      dailyVelocity.push({
        date: dateStr,
        created: createdOnDay,
        completed: completedOnDay,
        actions: actionsOnDay,
      });
    }

    // Velocity Throughput Rating
    const totalWeeklyCompletions = dailyVelocity.reduce((sum, d) => sum + d.completed, 0);
    const totalWeeklyActions = dailyVelocity.reduce((sum, d) => sum + d.actions, 0);

    let throughputRating = 'steady';
    if (totalWeeklyCompletions >= 10 || totalWeeklyActions >= 25) {
      throughputRating = 'elite';
    } else if (totalWeeklyCompletions >= 5 || totalWeeklyActions >= 10) {
      throughputRating = 'high';
    } else if (totalWeeklyCompletions >= 2 || totalWeeklyActions >= 5) {
      throughputRating = 'moderate';
    }

    return res.json({
      success: true,
      analytics: {
        generatedAt: new Date().toISOString(),
        overview: {
          totalTasks,
          completedTasks: completedTasks.length,
          inProgressTasks: inProgressTasks.length,
          pendingTasks: pendingTasks.length,
          completionRate: `${completionRate}%`,
          averageCycleTimeHours,
          throughputRating,
        },
        byPriority,
        byCategory,
        milestones: {
          total: totalMilestones,
          completed: completedMilestones,
          inProgress: inProgressMilestones,
          planning: planningMilestones,
          averageProgress: `${averageProgress}%`,
        },
        weeklySummary: {
          totalWeeklyCompletions,
          totalWeeklyActions,
          dailyVelocity,
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getVelocityMetrics,
};

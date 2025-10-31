import { cronJobs } from 'convex/server';

import { internal } from './_generated/api';

const crons = cronJobs();

crons.daily(
  'Cleanup deleted notes',
  { hourUTC: 8, minuteUTC: 30 },
  internal.tasks.deleteAllMessages,
);

export default crons;

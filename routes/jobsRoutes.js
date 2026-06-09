import express from 'express';
const router = express.Router();
import {
  createJob,
  deleteJob,
  getAllJobs,
  updateJob,
  importSeekJobs,
  showStats,
} from '../controllers/jobsController.js';

router.route('/').post(createJob).get(getAllJobs);
router.route('/stats').get(showStats);
router.route('/import/seek').post(importSeekJobs);
router.route('/:id').delete(deleteJob).patch(updateJob);

export default router;

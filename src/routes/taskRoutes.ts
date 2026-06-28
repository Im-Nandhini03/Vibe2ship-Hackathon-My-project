/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Router } from 'express';
import { TaskController } from '../controllers/TaskController.ts';

const router = Router();

// Retrieve all tasks
router.get('/', TaskController.getTasks);

// Create a new task
router.post('/', TaskController.addTask);

// Update details or status of a task
router.put('/:id', TaskController.updateTask);

// Delete a task
router.delete('/:id', TaskController.deleteTask);

// Retrieve prioritized tasks sorted by urgency/impact score
router.post('/prioritize', TaskController.prioritizeTasks);

// Generate time block schedules for tasks based on mock calendar slots
router.post('/schedule', TaskController.scheduleTasks);

export default router;

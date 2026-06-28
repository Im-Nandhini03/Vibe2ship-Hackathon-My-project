/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Request, Response } from 'express';
import { ProductiveTask, CalendarBlock } from '../models/ProductiveTask.ts';
import { GoogleGenAI } from '@google/genai';

// In-memory task list initialized with realistic tasks to demonstrate the app
let tasks: ProductiveTask[] = [
  {
    id: 'task-1',
    title: 'Deploy Production Backend Hotfix',
    description: 'Resolve a memory leak in the websocket handler before peak weekend traffic.',
    deadline: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(), // 4 hours from now
    priority: 'High',
    status: 'Pending',
    impact: 9,
    effort: 4,
  },
  {
    id: 'task-2',
    title: 'Prepare Presentation Slides for Board Meeting',
    description: 'Summarize Q2 performance, highlight expansion metrics, and detail budget requirements.',
    deadline: new Date(Date.now() + 18 * 60 * 60 * 1000).toISOString(), // 18 hours from now
    priority: 'High',
    status: 'In Progress',
    impact: 8,
    effort: 7,
  },
  {
    id: 'task-3',
    title: 'Submit Expense Reports',
    description: 'Upload all receipts from the last business trip to the finance portal.',
    deadline: new Date(Date.now() + 30 * 60 * 60 * 1000).toISOString(), // 30 hours (1.25 days) from now
    priority: 'Medium',
    status: 'Pending',
    impact: 4,
    effort: 2,
  },
  {
    id: 'task-4',
    title: 'Review PR for New Landing Page',
    description: 'Verify accessibility standards, check image compression, and test responsive layouts.',
    deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days from now
    priority: 'Low',
    status: 'Pending',
    impact: 6,
    effort: 3,
  },
];

// Generate standard mock calendar blocks for the next 3 days
// These represent existing commitments like sleep, sync meetings, meals
function getMockCalendarBlocks(): CalendarBlock[] {
  const blocks: CalendarBlock[] = [];
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  for (let d = 0; d < 3; d++) {
    const date = new Date(startOfToday.getTime() + d * 24 * 60 * 60 * 1000);
    const dateString = date.toISOString().split('T')[0];

    // Sleep blocks (11:00 PM to 7:00 AM next day)
    const sleepStart = new Date(`${dateString}T23:00:00`);
    const sleepEnd = new Date(sleepStart.getTime() + 8 * 60 * 60 * 1000);
    blocks.push({
      id: `sleep-${d}`,
      title: '😴 Sleep & Rest',
      start: sleepStart.toISOString(),
      end: sleepEnd.toISOString(),
      isBusy: true,
    });

    // Lunch block (12:00 PM to 1:00 PM)
    blocks.push({
      id: `lunch-${d}`,
      title: '🍽️ Lunch Break',
      start: new Date(`${dateString}T12:00:00`).toISOString(),
      end: new Date(`${dateString}T13:00:00`).toISOString(),
      isBusy: true,
    });

    // Dinner block (7:00 PM to 8:00 PM)
    blocks.push({
      id: `dinner-${d}`,
      title: '🍽️ Dinner Time',
      start: new Date(`${dateString}T19:00:00`).toISOString(),
      end: new Date(`${dateString}T20:00:00`).toISOString(),
      isBusy: true,
    });

    // Mock meetings on day 1 and day 2
    if (d === 0) {
      blocks.push({
        id: 'meeting-1',
        title: '👥 Daily Standup Meeting',
        start: new Date(`${dateString}T10:00:00`).toISOString(),
        end: new Date(`${dateString}T10:30:00`).toISOString(),
        isBusy: true,
      });
      blocks.push({
        id: 'meeting-2',
        title: '🎯 Sprint Planning Session',
        start: new Date(`${dateString}T14:00:00`).toISOString(),
        end: new Date(`${dateString}T15:30:00`).toISOString(),
        isBusy: true,
      });
    } else if (d === 1) {
      blocks.push({
        id: 'meeting-3',
        title: '🤝 Client Feedback Interview',
        start: new Date(`${dateString}T11:00:00`).toISOString(),
        end: new Date(`${dateString}T12:00:00`).toISOString(),
        isBusy: true,
      });
      blocks.push({
        id: 'meeting-4',
        title: '💻 Code Architecture Review',
        start: new Date(`${dateString}T15:00:00`).toISOString(),
        end: new Date(`${dateString}T16:00:00`).toISOString(),
        isBusy: true,
      });
    }
  }

  return blocks.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
}

// Calculate the deadline urgency helper (returns score from 1 to 10)
function calculateUrgency(deadlineStr: string): { score: number; text: string } {
  const deadline = new Date(deadlineStr);
  const now = new Date();
  const diffMs = deadline.getTime() - now.getTime();
  const diffHrs = diffMs / (1000 * 60 * 60);

  if (diffHrs <= 0) {
    return { score: 10, text: 'Overdue or Due Now!' };
  } else if (diffHrs <= 2) {
    return { score: 10, text: 'Extremely Critical (< 2h)' };
  } else if (diffHrs <= 6) {
    return { score: 9.5, text: 'Urgent Action Needed (< 6h)' };
  } else if (diffHrs <= 12) {
    return { score: 9.0, text: 'Very Urgent (< 12h)' };
  } else if (diffHrs <= 24) {
    return { score: 8.0, text: 'Due Tomorrow (< 24h)' };
  } else if (diffHrs <= 48) {
    return { score: 6.5, text: 'Due in 2 days' };
  } else if (diffHrs <= 72) {
    return { score: 5.0, text: 'Due in 3 days' };
  } else if (diffHrs <= 120) {
    return { score: 3.5, text: 'Due in 5 days' };
  } else {
    return { score: 1.5, text: 'Relaxed Timeline' };
  }
}

// Lazy initialization of Gemini API client
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
      aiClient = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });
    }
  }
  return aiClient;
}

export const TaskController = {
  // 1. Fetch all tasks
  getTasks: async (req: Request, res: Response): Promise<void> => {
    try {
      res.json({ success: true, data: tasks });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // 2. Add a new task
  addTask: async (req: Request, res: Response): Promise<void> => {
    try {
      const { title, description, deadline, priority, impact, effort } = req.body;

      if (!title || !deadline) {
        res.status(400).json({ success: false, error: 'Title and deadline are required.' });
        return;
      }

      const newTask: ProductiveTask = {
        id: `task-${Date.now()}`,
        title,
        description: description || '',
        deadline: new Date(deadline).toISOString(),
        priority: priority || 'Medium',
        status: 'Pending',
        impact: Number(impact) || 5,
        effort: Number(effort) || 5,
      };

      tasks.push(newTask);
      res.status(201).json({ success: true, data: newTask });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // 3. Update task status or fields
  updateTask: async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { title, description, deadline, priority, status, impact, effort } = req.body;

      const taskIndex = tasks.findIndex((t) => t.id === id);
      if (taskIndex === -1) {
        res.status(404).json({ success: false, error: 'Task not found.' });
        return;
      }

      const updatedTask = {
        ...tasks[taskIndex],
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(deadline !== undefined && { deadline: new Date(deadline).toISOString() }),
        ...(priority !== undefined && { priority }),
        ...(status !== undefined && { status }),
        ...(impact !== undefined && { impact: Number(impact) }),
        ...(effort !== undefined && { effort: Number(effort) }),
      };

      tasks[taskIndex] = updatedTask;
      res.json({ success: true, data: updatedTask });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // 4. Delete task
  deleteTask: async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const taskIndex = tasks.findIndex((t) => t.id === id);
      if (taskIndex === -1) {
        res.status(404).json({ success: false, error: 'Task not found.' });
        return;
      }

      tasks.splice(taskIndex, 1);
      res.json({ success: true, message: 'Task deleted successfully.' });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // 5. Prioritize tasks based on custom or default weights
  prioritizeTasks: async (req: Request, res: Response): Promise<void> => {
    try {
      // Extract custom weights, fallback to default if not provided
      const urgencyWeight = Number(req.body.urgencyWeight) ?? 5;
      const impactWeight = Number(req.body.impactWeight) ?? 3;
      const effortWeight = Number(req.body.effortWeight) ?? 2;

      // Score = (deadline urgency * urgencyWeight) + (impact * impactWeight) - (effort * effortWeight)
      const prioritized = tasks.map((task) => {
        if (task.status === 'Completed') {
          return { ...task, score: -100 }; // Push completed tasks to the bottom
        }

        const { score: urgencyScore, text: urgencyText } = calculateUrgency(task.deadline);
        const rawScore = (urgencyScore * urgencyWeight) + (task.impact * impactWeight) - (task.effort * effortWeight);
        
        // Ensure score has a reasonable display precision
        const formattedScore = Math.round(rawScore * 10) / 10;

        return {
          ...task,
          score: formattedScore,
          urgencyText,
        };
      });

      // Sort tasks by score in descending order
      prioritized.sort((a, b) => (b.score || 0) - (a.score || 0));

      res.json({
        success: true,
        data: prioritized,
        weights: { urgencyWeight, impactWeight, effortWeight },
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // 6. Suggest calendar time blocks for prioritized tasks using mock calendar data
  scheduleTasks: async (req: Request, res: Response): Promise<void> => {
    try {
      const urgencyWeight = Number(req.body.urgencyWeight) ?? 5;
      const impactWeight = Number(req.body.impactWeight) ?? 3;
      const effortWeight = Number(req.body.effortWeight) ?? 2;

      // First, score and sort pending/in-progress tasks
      const activeTasks = tasks
        .filter((t) => t.status !== 'Completed')
        .map((task) => {
          const { score: urgencyScore } = calculateUrgency(task.deadline);
          const score = (urgencyScore * urgencyWeight) + (task.impact * impactWeight) - (task.effort * effortWeight);
          return { ...task, score };
        })
        .sort((a, b) => b.score - a.score);

      const calendarBlocks = getMockCalendarBlocks();
      const scheduledTasks: ProductiveTask[] = [];

      // Determine starting hour for scheduling (e.g. today starting now, aligned to next half hour)
      let currentTime = new Date();
      // Round to next 30 min block
      const minutes = currentTime.getMinutes();
      if (minutes > 0 && minutes <= 30) {
        currentTime.setMinutes(30, 0, 0);
      } else if (minutes > 30) {
        currentTime.setHours(currentTime.getHours() + 1, 0, 0, 0);
      } else {
        currentTime.setMinutes(0, 0, 0);
      }

      // Proactively schedule task slots (e.g., 1.5-hour blocks)
      for (const task of activeTasks) {
        let blockScheduled = false;
        let scanTime = new Date(currentTime.getTime());

        // Max scan window is 48 hours
        const maxScanTime = new Date(Date.now() + 48 * 60 * 60 * 1000);

        while (!blockScheduled && scanTime < maxScanTime) {
          const proposedStart = new Date(scanTime.getTime());
          const proposedEnd = new Date(scanTime.getTime() + 1.5 * 60 * 60 * 1000); // 1.5 hour focus blocks

          // Check if proposed focus block conflicts with any mock busy block or night sleep
          const hasConflict = calendarBlocks.some((block) => {
            const bStart = new Date(block.start);
            const bEnd = new Date(block.end);
            return proposedStart < bEnd && proposedEnd > bStart;
          });

          // Check if proposed block is within reasonable work hours (8 AM - 10 PM)
          const startHour = proposedStart.getHours();
          const endHour = proposedEnd.getHours();
          const isReasonableHours = startHour >= 8 && (endHour < 22 || (endHour === 22 && proposedEnd.getMinutes() === 0));

          if (!hasConflict && isReasonableHours) {
            // Found a free slot!
            task.suggestedBlock = {
              startTime: proposedStart.toISOString(),
              endTime: proposedEnd.toISOString(),
              motivation: 'Carve out uninterrupted deep focus time. Close browser tabs and silence notifications.',
            };

            // Add the new block to the calendar index to prevent overlapping schedules
            calendarBlocks.push({
              id: `focus-${task.id}`,
              title: `🎯 Focus: ${task.title}`,
              start: proposedStart.toISOString(),
              end: proposedEnd.toISOString(),
              isBusy: true,
            });

            scheduledTasks.push(task);
            blockScheduled = true;
          } else {
            // Move forward by 30 mins and check again
            scanTime.setMinutes(scanTime.getMinutes() + 30);
          }
        }
      }

      // Standardize motivational sentences via Gemini API if key is set
      const gemini = getGeminiClient();
      if (gemini && scheduledTasks.length > 0) {
        try {
          const taskSummaries = scheduledTasks.map((t) => ({
            id: t.id,
            title: t.title,
            description: t.description,
            timeSlot: `${new Date(t.suggestedBlock!.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${new Date(t.suggestedBlock!.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
          }));

          const prompt = `You are "The Last-Minute Life Saver" digital productivity companion.
We have scheduled some highly critical, high-impact tasks into focus time blocks today or tomorrow.
For each scheduled task below, write a short (one-sentence, Max 15 words) highly motivational, action-biased, specific tip to break work inertia. Avoid generic cliches; refer directly to what the task involves.

Scheduled Tasks:
${JSON.stringify(taskSummaries, null, 2)}

Return a JSON array containing objects with "id" and "motivation" keys corresponding to the input tasks.
Example format:
[
  { "id": "task-1", "motivation": "Start by identifying the exact block causing the leak, then write a test script." }
]`;

          const response = await gemini.models.generateContent({
            model: 'gemini-3.5-flash',
            contents: prompt,
            config: {
              responseMimeType: 'application/json',
            },
          });

          if (response.text) {
            const parsedTips = JSON.parse(response.text.trim());
            if (Array.isArray(parsedTips)) {
              for (const tip of parsedTips) {
                const targetTask = scheduledTasks.find((t) => t.id === tip.id);
                if (targetTask && targetTask.suggestedBlock && tip.motivation) {
                  targetTask.suggestedBlock.motivation = tip.motivation;
                }
              }
            }
          }
        } catch (aiErr) {
          console.error('Gemini scheduling advice failed, continuing with mock advice:', aiErr);
        }
      }

      res.json({
        success: true,
        data: scheduledTasks,
        calendarBusyBlocks: calendarBlocks.filter((b) => !b.id.startsWith('focus-')),
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },
};

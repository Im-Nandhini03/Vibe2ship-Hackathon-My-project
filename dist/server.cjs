var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express2 = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_dotenv = __toESM(require("dotenv"), 1);

// src/routes/taskRoutes.ts
var import_express = require("express");

// src/controllers/TaskController.ts
var import_genai = require("@google/genai");
var tasks = [
  {
    id: "task-1",
    title: "Deploy Production Backend Hotfix",
    description: "Resolve a memory leak in the websocket handler before peak weekend traffic.",
    deadline: new Date(Date.now() + 4 * 60 * 60 * 1e3).toISOString(),
    // 4 hours from now
    priority: "High",
    status: "Pending",
    impact: 9,
    effort: 4
  },
  {
    id: "task-2",
    title: "Prepare Presentation Slides for Board Meeting",
    description: "Summarize Q2 performance, highlight expansion metrics, and detail budget requirements.",
    deadline: new Date(Date.now() + 18 * 60 * 60 * 1e3).toISOString(),
    // 18 hours from now
    priority: "High",
    status: "In Progress",
    impact: 8,
    effort: 7
  },
  {
    id: "task-3",
    title: "Submit Expense Reports",
    description: "Upload all receipts from the last business trip to the finance portal.",
    deadline: new Date(Date.now() + 30 * 60 * 60 * 1e3).toISOString(),
    // 30 hours (1.25 days) from now
    priority: "Medium",
    status: "Pending",
    impact: 4,
    effort: 2
  },
  {
    id: "task-4",
    title: "Review PR for New Landing Page",
    description: "Verify accessibility standards, check image compression, and test responsive layouts.",
    deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1e3).toISOString(),
    // 3 days from now
    priority: "Low",
    status: "Pending",
    impact: 6,
    effort: 3
  }
];
function getMockCalendarBlocks() {
  const blocks = [];
  const startOfToday = /* @__PURE__ */ new Date();
  startOfToday.setHours(0, 0, 0, 0);
  for (let d = 0; d < 3; d++) {
    const date = new Date(startOfToday.getTime() + d * 24 * 60 * 60 * 1e3);
    const dateString = date.toISOString().split("T")[0];
    const sleepStart = /* @__PURE__ */ new Date(`${dateString}T23:00:00`);
    const sleepEnd = new Date(sleepStart.getTime() + 8 * 60 * 60 * 1e3);
    blocks.push({
      id: `sleep-${d}`,
      title: "\u{1F634} Sleep & Rest",
      start: sleepStart.toISOString(),
      end: sleepEnd.toISOString(),
      isBusy: true
    });
    blocks.push({
      id: `lunch-${d}`,
      title: "\u{1F37D}\uFE0F Lunch Break",
      start: (/* @__PURE__ */ new Date(`${dateString}T12:00:00`)).toISOString(),
      end: (/* @__PURE__ */ new Date(`${dateString}T13:00:00`)).toISOString(),
      isBusy: true
    });
    blocks.push({
      id: `dinner-${d}`,
      title: "\u{1F37D}\uFE0F Dinner Time",
      start: (/* @__PURE__ */ new Date(`${dateString}T19:00:00`)).toISOString(),
      end: (/* @__PURE__ */ new Date(`${dateString}T20:00:00`)).toISOString(),
      isBusy: true
    });
    if (d === 0) {
      blocks.push({
        id: "meeting-1",
        title: "\u{1F465} Daily Standup Meeting",
        start: (/* @__PURE__ */ new Date(`${dateString}T10:00:00`)).toISOString(),
        end: (/* @__PURE__ */ new Date(`${dateString}T10:30:00`)).toISOString(),
        isBusy: true
      });
      blocks.push({
        id: "meeting-2",
        title: "\u{1F3AF} Sprint Planning Session",
        start: (/* @__PURE__ */ new Date(`${dateString}T14:00:00`)).toISOString(),
        end: (/* @__PURE__ */ new Date(`${dateString}T15:30:00`)).toISOString(),
        isBusy: true
      });
    } else if (d === 1) {
      blocks.push({
        id: "meeting-3",
        title: "\u{1F91D} Client Feedback Interview",
        start: (/* @__PURE__ */ new Date(`${dateString}T11:00:00`)).toISOString(),
        end: (/* @__PURE__ */ new Date(`${dateString}T12:00:00`)).toISOString(),
        isBusy: true
      });
      blocks.push({
        id: "meeting-4",
        title: "\u{1F4BB} Code Architecture Review",
        start: (/* @__PURE__ */ new Date(`${dateString}T15:00:00`)).toISOString(),
        end: (/* @__PURE__ */ new Date(`${dateString}T16:00:00`)).toISOString(),
        isBusy: true
      });
    }
  }
  return blocks.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
}
function calculateUrgency(deadlineStr) {
  const deadline = new Date(deadlineStr);
  const now = /* @__PURE__ */ new Date();
  const diffMs = deadline.getTime() - now.getTime();
  const diffHrs = diffMs / (1e3 * 60 * 60);
  if (diffHrs <= 0) {
    return { score: 10, text: "Overdue or Due Now!" };
  } else if (diffHrs <= 2) {
    return { score: 10, text: "Extremely Critical (< 2h)" };
  } else if (diffHrs <= 6) {
    return { score: 9.5, text: "Urgent Action Needed (< 6h)" };
  } else if (diffHrs <= 12) {
    return { score: 9, text: "Very Urgent (< 12h)" };
  } else if (diffHrs <= 24) {
    return { score: 8, text: "Due Tomorrow (< 24h)" };
  } else if (diffHrs <= 48) {
    return { score: 6.5, text: "Due in 2 days" };
  } else if (diffHrs <= 72) {
    return { score: 5, text: "Due in 3 days" };
  } else if (diffHrs <= 120) {
    return { score: 3.5, text: "Due in 5 days" };
  } else {
    return { score: 1.5, text: "Relaxed Timeline" };
  }
}
var aiClient = null;
function getGeminiClient() {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey !== "MY_GEMINI_API_KEY") {
      aiClient = new import_genai.GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build"
          }
        }
      });
    }
  }
  return aiClient;
}
var TaskController = {
  // 1. Fetch all tasks
  getTasks: async (req, res) => {
    try {
      res.json({ success: true, data: tasks });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },
  // 2. Add a new task
  addTask: async (req, res) => {
    try {
      const { title, description, deadline, priority, impact, effort } = req.body;
      if (!title || !deadline) {
        res.status(400).json({ success: false, error: "Title and deadline are required." });
        return;
      }
      const newTask = {
        id: `task-${Date.now()}`,
        title,
        description: description || "",
        deadline: new Date(deadline).toISOString(),
        priority: priority || "Medium",
        status: "Pending",
        impact: Number(impact) || 5,
        effort: Number(effort) || 5
      };
      tasks.push(newTask);
      res.status(201).json({ success: true, data: newTask });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },
  // 3. Update task status or fields
  updateTask: async (req, res) => {
    try {
      const { id } = req.params;
      const { title, description, deadline, priority, status, impact, effort } = req.body;
      const taskIndex = tasks.findIndex((t) => t.id === id);
      if (taskIndex === -1) {
        res.status(404).json({ success: false, error: "Task not found." });
        return;
      }
      const updatedTask = {
        ...tasks[taskIndex],
        ...title !== void 0 && { title },
        ...description !== void 0 && { description },
        ...deadline !== void 0 && { deadline: new Date(deadline).toISOString() },
        ...priority !== void 0 && { priority },
        ...status !== void 0 && { status },
        ...impact !== void 0 && { impact: Number(impact) },
        ...effort !== void 0 && { effort: Number(effort) }
      };
      tasks[taskIndex] = updatedTask;
      res.json({ success: true, data: updatedTask });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },
  // 4. Delete task
  deleteTask: async (req, res) => {
    try {
      const { id } = req.params;
      const taskIndex = tasks.findIndex((t) => t.id === id);
      if (taskIndex === -1) {
        res.status(404).json({ success: false, error: "Task not found." });
        return;
      }
      tasks.splice(taskIndex, 1);
      res.json({ success: true, message: "Task deleted successfully." });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },
  // 5. Prioritize tasks based on custom or default weights
  prioritizeTasks: async (req, res) => {
    try {
      const urgencyWeight = Number(req.body.urgencyWeight) ?? 5;
      const impactWeight = Number(req.body.impactWeight) ?? 3;
      const effortWeight = Number(req.body.effortWeight) ?? 2;
      const prioritized = tasks.map((task) => {
        if (task.status === "Completed") {
          return { ...task, score: -100 };
        }
        const { score: urgencyScore, text: urgencyText } = calculateUrgency(task.deadline);
        const rawScore = urgencyScore * urgencyWeight + task.impact * impactWeight - task.effort * effortWeight;
        const formattedScore = Math.round(rawScore * 10) / 10;
        return {
          ...task,
          score: formattedScore,
          urgencyText
        };
      });
      prioritized.sort((a, b) => (b.score || 0) - (a.score || 0));
      res.json({
        success: true,
        data: prioritized,
        weights: { urgencyWeight, impactWeight, effortWeight }
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },
  // 6. Suggest calendar time blocks for prioritized tasks using mock calendar data
  scheduleTasks: async (req, res) => {
    try {
      const urgencyWeight = Number(req.body.urgencyWeight) ?? 5;
      const impactWeight = Number(req.body.impactWeight) ?? 3;
      const effortWeight = Number(req.body.effortWeight) ?? 2;
      const activeTasks = tasks.filter((t) => t.status !== "Completed").map((task) => {
        const { score: urgencyScore } = calculateUrgency(task.deadline);
        const score = urgencyScore * urgencyWeight + task.impact * impactWeight - task.effort * effortWeight;
        return { ...task, score };
      }).sort((a, b) => b.score - a.score);
      const calendarBlocks = getMockCalendarBlocks();
      const scheduledTasks = [];
      let currentTime = /* @__PURE__ */ new Date();
      const minutes = currentTime.getMinutes();
      if (minutes > 0 && minutes <= 30) {
        currentTime.setMinutes(30, 0, 0);
      } else if (minutes > 30) {
        currentTime.setHours(currentTime.getHours() + 1, 0, 0, 0);
      } else {
        currentTime.setMinutes(0, 0, 0);
      }
      for (const task of activeTasks) {
        let blockScheduled = false;
        let scanTime = new Date(currentTime.getTime());
        const maxScanTime = new Date(Date.now() + 48 * 60 * 60 * 1e3);
        while (!blockScheduled && scanTime < maxScanTime) {
          const proposedStart = new Date(scanTime.getTime());
          const proposedEnd = new Date(scanTime.getTime() + 1.5 * 60 * 60 * 1e3);
          const hasConflict = calendarBlocks.some((block) => {
            const bStart = new Date(block.start);
            const bEnd = new Date(block.end);
            return proposedStart < bEnd && proposedEnd > bStart;
          });
          const startHour = proposedStart.getHours();
          const endHour = proposedEnd.getHours();
          const isReasonableHours = startHour >= 8 && (endHour < 22 || endHour === 22 && proposedEnd.getMinutes() === 0);
          if (!hasConflict && isReasonableHours) {
            task.suggestedBlock = {
              startTime: proposedStart.toISOString(),
              endTime: proposedEnd.toISOString(),
              motivation: "Carve out uninterrupted deep focus time. Close browser tabs and silence notifications."
            };
            calendarBlocks.push({
              id: `focus-${task.id}`,
              title: `\u{1F3AF} Focus: ${task.title}`,
              start: proposedStart.toISOString(),
              end: proposedEnd.toISOString(),
              isBusy: true
            });
            scheduledTasks.push(task);
            blockScheduled = true;
          } else {
            scanTime.setMinutes(scanTime.getMinutes() + 30);
          }
        }
      }
      const gemini = getGeminiClient();
      if (gemini && scheduledTasks.length > 0) {
        try {
          const taskSummaries = scheduledTasks.map((t) => ({
            id: t.id,
            title: t.title,
            description: t.description,
            timeSlot: `${new Date(t.suggestedBlock.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} - ${new Date(t.suggestedBlock.endTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
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
            model: "gemini-3.5-flash",
            contents: prompt,
            config: {
              responseMimeType: "application/json"
            }
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
          console.error("Gemini scheduling advice failed, continuing with mock advice:", aiErr);
        }
      }
      res.json({
        success: true,
        data: scheduledTasks,
        calendarBusyBlocks: calendarBlocks.filter((b) => !b.id.startsWith("focus-"))
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
};

// src/routes/taskRoutes.ts
var router = (0, import_express.Router)();
router.get("/", TaskController.getTasks);
router.post("/", TaskController.addTask);
router.put("/:id", TaskController.updateTask);
router.delete("/:id", TaskController.deleteTask);
router.post("/prioritize", TaskController.prioritizeTasks);
router.post("/schedule", TaskController.scheduleTasks);
var taskRoutes_default = router;

// server.ts
var import_vite = require("vite");
import_dotenv.default.config();
async function startServer() {
  const app = (0, import_express2.default)();
  const PORT = 3e3;
  app.use(import_express2.default.json());
  app.use("/api/tasks", taskRoutes_default);
  app.get("/api/health", (req, res) => {
    res.json({ status: "healthy", time: (/* @__PURE__ */ new Date()).toISOString() });
  });
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting Express in development mode with Vite middleware...");
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting Express in production mode serving static dist...");
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express2.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`====================================================`);
    console.log(`\u{1F680} The Last-Minute Life Saver is running!`);
    console.log(`\u{1F517} Local server url: http://localhost:${PORT}`);
    console.log(`====================================================`);
  });
}
startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
//# sourceMappingURL=server.cjs.map

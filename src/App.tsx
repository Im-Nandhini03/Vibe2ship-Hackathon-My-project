/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Inbox, 
  Zap, 
  ListTodo,
  TrendingUp,
  BrainCircuit,
  RotateCw
} from 'lucide-react';
import TaskForm from './components/TaskForm.tsx';
import TaskList from './components/TaskList.tsx';
import PriorityView from './components/PriorityView.tsx';
import { ProductiveTask } from './types.ts';

export default function App() {
  const [tasks, setTasks] = useState<ProductiveTask[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [activePanel, setActivePanel] = useState<'all' | 'ai'>('all');

  // Keep a ticking clock in the header to reinforce the "Last-Minute" theme
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch tasks from Express Backend
  const fetchTasks = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/tasks');
      const result = await response.json();
      if (result.success) {
        setTasks(result.data);
      } else {
        setError(result.error || 'Could not load tasks from database.');
      }
    } catch (err) {
      setError('Express server connection failed. Ensure the server is listening on port 3000.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  // Calculate high-level statistics for the dashboard
  const getStats = () => {
    const total = tasks.length;
    const completed = tasks.filter((t) => t.status === 'Completed').length;
    const active = total - completed;

    // Overdue tasks
    const overdue = tasks.filter((t) => {
      if (t.status === 'Completed') return false;
      return new Date(t.deadline).getTime() < Date.now();
    }).length;

    // Due within 24 hours
    const urgent = tasks.filter((t) => {
      if (t.status === 'Completed') return false;
      const hoursLeft = (new Date(t.deadline).getTime() - Date.now()) / (1000 * 60 * 60);
      return hoursLeft > 0 && hoursLeft <= 24;
    }).length;

    return { total, completed, active, overdue, urgent };
  };

  const stats = getStats();

  return (
    <div className="min-h-screen bg-gray-50/50 text-gray-800 selection:bg-indigo-100 selection:text-indigo-900">
      {/* Top Banner Alert if anything is overdue */}
      {stats.overdue > 0 && (
        <div className="bg-gradient-to-r from-red-600 to-rose-600 text-white text-xs font-semibold py-2.5 px-4 text-center flex items-center justify-center gap-2 shadow-inner">
          <ShieldAlert className="w-4 h-4 animate-bounce" />
          <span>ALERT: You have {stats.overdue} overdue {stats.overdue === 1 ? 'task' : 'tasks'}! Prioritize immediately to salvage your deadlines.</span>
        </div>
      )}

      {/* Main Premium Navbar Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-md shadow-indigo-600/10">
              <BrainCircuit className="w-5.5 h-5.5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold text-gray-900 tracking-tight">The Last-Minute Life Saver</h1>
              <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">AI Productivity Companion</p>
            </div>
          </div>

          {/* Real-time Deadline Ticker / Clock */}
          <div className="flex items-center gap-4 text-xs">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-gray-400 font-medium">Session Local Time</span>
              <span className="font-semibold text-gray-800 font-mono">
                {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            </div>
            <button
              onClick={fetchTasks}
              className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-gray-50 rounded-xl border border-gray-100 transition cursor-pointer"
              title="Sync Repositories"
            >
              <RotateCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-indigo-600' : ''}`} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Statistics Widgets */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center border border-gray-100">
              <Inbox className="w-5 h-5 text-gray-500" />
            </div>
            <div>
              <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Total Tasks</span>
              <p className="text-lg font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center border border-indigo-100">
              <ListTodo className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <span className="text-[10px] text-indigo-500 font-semibold uppercase tracking-wider">Active Queue</span>
              <p className="text-lg font-bold text-gray-900">{stats.active}</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center border border-emerald-100">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <span className="text-[10px] text-emerald-500 font-semibold uppercase tracking-wider">Secured</span>
              <p className="text-lg font-bold text-gray-900">{stats.completed}</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center border border-amber-100">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <span className="text-[10px] text-amber-500 font-semibold uppercase tracking-wider">Due &lt; 24h</span>
              <p className="text-lg font-bold text-gray-900">{stats.urgent}</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm col-span-2 lg:col-span-1 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center border border-rose-100">
              <ShieldAlert className="w-5 h-5 text-rose-600" />
            </div>
            <div>
              <span className="text-[10px] text-rose-500 font-semibold uppercase tracking-wider">Overdue</span>
              <p className="text-lg font-bold text-gray-900">{stats.overdue}</p>
            </div>
          </div>
        </div>

        {/* Dynamic Split Layout Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Left Panel: Task Creation Form */}
          <div className="lg:col-span-1 space-y-4">
            <TaskForm onTaskAdded={fetchTasks} />
            
            {/* Context Notice Card */}
            <div className="bg-indigo-900 text-indigo-100 rounded-2xl p-5 shadow-sm space-y-3 border border-indigo-950/20">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />
                Under the Hood: AI Scores
              </h3>
              <p className="text-xs text-indigo-200/90 leading-relaxed">
                Traditional planners only look at deadlines. Our custom algorithm balances deadline urgency with true business impact while adjusting for required mental effort. 
              </p>
              <div className="text-[10px] text-indigo-300 font-medium">
                Tip: Lower effort items with high impact score much higher, facilitating immediate momentum!
              </div>
            </div>
          </div>

          {/* Right Panel: Primary Navigation Cockpit */}
          <div className="lg:col-span-2 space-y-6">
            {/* Tab selection bar for Primary dashboard */}
            <div className="flex bg-white p-1 rounded-2xl border border-gray-100 shadow-sm">
              <button
                onClick={() => setActivePanel('all')}
                className={`flex-1 py-3 text-sm font-semibold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  activePanel === 'all'
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/10'
                    : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
                }`}
              >
                <ListTodo className="w-4 h-4" />
                <span>Task Repositories</span>
              </button>
              <button
                onClick={() => setActivePanel('ai')}
                className={`flex-1 py-3 text-sm font-semibold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  activePanel === 'ai'
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/10'
                    : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
                }`}
              >
                <TrendingUp className="w-4 h-4" />
                <span>AI Priority Engine</span>
              </button>
            </div>

            {/* Render selected cockpit component */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-xs text-red-700">
                {error}
              </div>
            )}

            {activePanel === 'all' ? (
              <TaskList 
                tasks={tasks} 
                onTaskUpdated={fetchTasks} 
                isLoading={isLoading} 
              />
            ) : (
              <PriorityView 
                tasks={tasks} 
                onTaskUpdated={fetchTasks} 
              />
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 py-6 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-gray-400">
          <div>
            &copy; 2026 The Last-Minute Life Saver. All rights reserved.
          </div>
          <div className="flex gap-4">
            <span>Powered by Gemini 3.5 Flash</span>
            <span>&bull;</span>
            <span>Real-time Prioritization Algorithm</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Sliders, 
  Flame, 
  Calendar, 
  Clock, 
  Zap, 
  Brain, 
  Play, 
  CheckCircle2, 
  Award,
  AlertTriangle,
  Grid
} from 'lucide-react';
import { ProductiveTask, CalendarBlock } from '../types.ts';

interface PriorityViewProps {
  tasks: ProductiveTask[];
  onTaskUpdated: () => void;
}

export default function PriorityView({ tasks, onTaskUpdated }: PriorityViewProps) {
  // Score weights
  const [urgencyWeight, setUrgencyWeight] = useState<number>(5);
  const [impactWeight, setImpactWeight] = useState<number>(3);
  const [effortWeight, setEffortWeight] = useState<number>(2);

  const [prioritizedTasks, setPrioritizedTasks] = useState<ProductiveTask[]>([]);
  const [scheduledTasks, setScheduledTasks] = useState<ProductiveTask[]>([]);
  const [calendarBusyBlocks, setCalendarBusyBlocks] = useState<CalendarBlock[]>([]);
  
  const [isLoadingPriorities, setIsLoadingPriorities] = useState(false);
  const [isLoadingSchedule, setIsLoadingSchedule] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [activeTab, setActiveTab] = useState<'priorities' | 'schedule'>('priorities');

  // Load prioritized tasks
  const fetchPriorities = async () => {
    setIsLoadingPriorities(true);
    setError(null);
    try {
      const response = await fetch('/api/tasks/prioritize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urgencyWeight, impactWeight, effortWeight }),
      });
      const result = await response.json();
      if (result.success) {
        setPrioritizedTasks(result.data);
      } else {
        setError(result.error || 'Failed to fetch prioritized tasks.');
      }
    } catch (err) {
      setError('Connection to backend failed. Please check if server is running.');
    } finally {
      setIsLoadingPriorities(false);
    }
  };

  // Load focus schedule
  const generateSchedule = async () => {
    setIsLoadingSchedule(true);
    setError(null);
    try {
      const response = await fetch('/api/tasks/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urgencyWeight, impactWeight, effortWeight }),
      });
      const result = await response.json();
      if (result.success) {
        setScheduledTasks(result.data);
        setCalendarBusyBlocks(result.calendarBusyBlocks || []);
        setActiveTab('schedule');
      } else {
        setError(result.error || 'Failed to generate focus schedule.');
      }
    } catch (err) {
      setError('Failed to reach scheduling service.');
    } finally {
      setIsLoadingSchedule(false);
    }
  };

  // Auto fetch priorities whenever task list changes or weights are saved/applied
  useEffect(() => {
    fetchPriorities();
  }, [tasks, urgencyWeight, impactWeight, effortWeight]);

  // Combine calendarBusyBlocks and scheduled focus blocks into a master hourly timeline for display
  const getTimelineEvents = () => {
    const events: {
      id: string;
      title: string;
      start: Date;
      end: Date;
      type: 'busy' | 'focus';
      motivation?: string;
      taskId?: string;
    }[] = [];

    // Add busy blocks (meetings, meals, sleep)
    calendarBusyBlocks.forEach((block) => {
      events.push({
        id: block.id,
        title: block.title,
        start: new Date(block.start),
        end: new Date(block.end),
        type: 'busy',
      });
    });

    // Add scheduled focus blocks
    scheduledTasks.forEach((task) => {
      if (task.suggestedBlock) {
        events.push({
          id: `focus-${task.id}`,
          title: `🎯 Focus: ${task.title}`,
          start: new Date(task.suggestedBlock.startTime),
          end: new Date(task.suggestedBlock.endTime),
          type: 'focus',
          motivation: task.suggestedBlock.motivation,
          taskId: task.id,
        });
      }
    });

    // Sort by start time
    return events.sort((a, b) => a.start.getTime() - b.start.getTime());
  };

  const timelineEvents = getTimelineEvents();

  const getScoreColorBadge = (score: number) => {
    if (score >= 40) return 'bg-rose-500 text-white';
    if (score >= 25) return 'bg-amber-500 text-white';
    return 'bg-indigo-500 text-white';
  };

  // Complete task from PriorityView directly
  const handleQuickComplete = async (taskId: string) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Completed' }),
      });
      const result = await response.json();
      if (result.success) {
        onTaskUpdated();
        // Remove from current local state to feel snappy
        setPrioritizedTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'Completed', score: -100 } : t));
        setScheduledTasks(prev => prev.filter(t => t.id !== taskId));
      }
    } catch (err) {
      console.error('Failed to complete task:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Parameters Sidebar + Header Controls */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-gray-50 mb-5">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-600" />
              <h2 className="text-lg font-semibold text-gray-900 tracking-tight">AI Priority Engine & Hyper-Focus Scheduler</h2>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">Customize prioritization variables and auto-carve quiet times into your day</p>
          </div>

          {/* Navigation Tab selection */}
          <div className="flex bg-gray-50 p-1 rounded-xl border border-gray-200/50 self-start lg:self-center">
            <button
              onClick={() => setActiveTab('priorities')}
              className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                activeTab === 'priorities'
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <Zap className="w-3.5 h-3.5 inline mr-1" />
              AI Priority List
            </button>
            <button
              onClick={() => {
                if (scheduledTasks.length === 0) {
                  generateSchedule();
                } else {
                  setActiveTab('schedule');
                }
              }}
              className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                activeTab === 'schedule'
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <Calendar className="w-3.5 h-3.5 inline mr-1" />
              Smart Focus Timeline
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-5 p-4 bg-red-50 border border-red-100 rounded-xl text-xs text-red-700 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Weights sliders */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-semibold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-rose-500" />
                Urgency Weight
              </span>
              <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md">{urgencyWeight}x</span>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              className="w-full accent-rose-500 h-1.5 bg-gray-100 rounded-lg appearance-none cursor-pointer"
              value={urgencyWeight}
              onChange={(e) => setUrgencyWeight(Number(e.target.value))}
            />
            <p className="text-[10px] text-gray-400">Multiplies the calculated deadline proximity score.</p>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-semibold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-indigo-500" />
                Impact Weight
              </span>
              <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">{impactWeight}x</span>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              className="w-full accent-indigo-500 h-1.5 bg-gray-100 rounded-lg appearance-none cursor-pointer"
              value={impactWeight}
              onChange={(e) => setImpactWeight(Number(e.target.value))}
            />
            <p className="text-[10px] text-gray-400">Multiplies the business consequence score.</p>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-semibold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-emerald-500" />
                Effort Penalty
              </span>
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">{effortWeight}x</span>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              className="w-full accent-emerald-500 h-1.5 bg-gray-100 rounded-lg appearance-none cursor-pointer"
              value={effortWeight}
              onChange={(e) => setEffortWeight(Number(e.target.value))}
            />
            <p className="text-[10px] text-gray-400">Subtracts score for complex tasks, sorting quick wins first.</p>
          </div>
        </div>

        <div className="mt-5 pt-4 border-t border-gray-50 flex flex-wrap justify-between items-center gap-3">
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <Brain className="w-4 h-4 text-purple-500" />
            <span>Score formula: (Urgency × {urgencyWeight}) + (Impact × {impactWeight}) - (Effort × {effortWeight})</span>
          </div>

          <button
            onClick={generateSchedule}
            disabled={isLoadingSchedule || tasks.filter(t => t.status !== 'Completed').length === 0}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-100 disabled:text-gray-400 text-white font-medium text-xs rounded-xl shadow-sm transition flex items-center gap-2 cursor-pointer"
          >
            {isLoadingSchedule ? (
              <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Calendar className="w-3.5 h-3.5" />
            )}
            <span>Generate Smart Focus Timeline</span>
          </button>
        </div>
      </div>

      {/* Tabs Content */}
      {activeTab === 'priorities' ? (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-gray-50 bg-gray-50/10 flex justify-between items-center">
            <h3 className="font-semibold text-gray-800 text-sm flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-indigo-500" />
              Dynamic Queue Sorted by Impact & Deadline Urgency
            </h3>
            <span className="text-xs text-gray-400">Updated automatically</span>
          </div>

          <div className="divide-y divide-gray-100">
            {isLoadingPriorities ? (
              <div className="p-12 text-center text-gray-400 flex flex-col items-center justify-center gap-3">
                <div className="w-6 h-6 border-2 border-indigo-500/20 border-t-indigo-600 rounded-full animate-spin" />
                <span className="text-xs">Re-calculating AI scores...</span>
              </div>
            ) : prioritizedTasks.filter(t => t.status !== 'Completed').length === 0 ? (
              <div className="p-12 text-center text-gray-400 flex flex-col items-center justify-center gap-2">
                <Award className="w-8 h-8 text-indigo-200" />
                <span className="font-medium text-sm text-gray-600">All pending deadlines secured or completed!</span>
                <span className="text-xs text-gray-400">Add a task above to start prioritizing.</span>
              </div>
            ) : (
              prioritizedTasks
                .filter(t => t.status !== 'Completed')
                .map((task, index) => (
                  <div key={task.id} className="p-5 flex items-start gap-4 hover:bg-gray-50/30 transition">
                    {/* Rank Index */}
                    <div className="flex flex-col items-center justify-center w-7 h-7 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-lg text-xs font-bold shrink-0">
                      #{index + 1}
                    </div>

                    {/* Task Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h4 className="font-semibold text-gray-900 text-sm leading-snug">{task.title}</h4>
                          {task.description && (
                            <p className="text-xs text-gray-500 mt-1 line-clamp-2">{task.description}</p>
                          )}
                        </div>
                        {/* AI Priority Score Badging */}
                        <div className="flex flex-col items-end shrink-0">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase ${getScoreColorBadge(task.score || 0)}`}>
                            Score: {task.score}
                          </span>
                          {task.urgencyText && (
                            <span className="text-[10px] text-gray-400 mt-1 font-medium">{task.urgencyText}</span>
                          )}
                        </div>
                      </div>

                      {/* Info Pills */}
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-3 pt-3 border-t border-gray-50 text-[11px] text-gray-500">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-gray-400" />
                          Due: {new Date(task.deadline).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                        </span>
                        <span className="flex items-center gap-1">
                          <Zap className="w-3.5 h-3.5 text-indigo-400" />
                          Impact: <strong className="text-gray-700">{task.impact}/10</strong>
                        </span>
                        <span className="flex items-center gap-1">
                          <Sliders className="w-3.5 h-3.5 text-rose-400" />
                          Effort: <strong className="text-gray-700">{task.effort}/10</strong>
                        </span>
                        <span className="inline-flex items-center px-1.5 py-0.2 bg-gray-50 text-gray-600 rounded border border-gray-100">
                          {task.status}
                        </span>
                      </div>
                    </div>

                    {/* Completion action */}
                    <button
                      onClick={() => handleQuickComplete(task.id)}
                      className="p-1.5 self-center bg-white border border-gray-200 hover:border-emerald-200 hover:bg-emerald-50 text-gray-400 hover:text-emerald-600 rounded-lg transition shrink-0 cursor-pointer"
                      title="Quick Mark Completed"
                    >
                      <CheckCircle2 className="w-4.5 h-4.5" />
                    </button>
                  </div>
                ))
            )}
          </div>
        </div>
      ) : (
        /* SCHEDULE TIMELINE TAB */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Active focus block suggestions card list */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <div className="pb-3 border-b border-gray-50 mb-4 flex items-center justify-between">
                <h3 className="font-semibold text-gray-800 text-sm flex items-center gap-1.5">
                  <Play className="w-4 h-4 text-indigo-600 fill-indigo-600" />
                  Your Proactive Focus Slots & AI Coaching Tips
                </h3>
                <span className="text-xs text-gray-400 bg-gray-50 border border-gray-100 px-2.5 py-0.5 rounded-full font-medium">
                  {scheduledTasks.length} Slots Carved
                </span>
              </div>

              {scheduledTasks.length === 0 ? (
                <div className="py-12 text-center text-gray-400 flex flex-col items-center justify-center gap-2">
                  <Calendar className="w-8 h-8 text-indigo-100" />
                  <span className="font-medium text-sm text-gray-600">No active blocks scheduled.</span>
                  <p className="text-xs text-gray-400 max-w-sm mt-1">
                    Click "Generate Smart Focus Timeline" above to reserve quiet periods before deadlines hit!
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {scheduledTasks.map((task) => {
                    const block = task.suggestedBlock;
                    if (!block) return null;
                    const startTime = new Date(block.startTime);
                    const endTime = new Date(block.endTime);

                    return (
                      <div 
                        key={`sched-${task.id}`} 
                        className="p-4 rounded-xl border border-indigo-100 bg-gradient-to-r from-indigo-50/30 to-white hover:border-indigo-200 hover:shadow-sm transition flex flex-col md:flex-row md:items-center justify-between gap-4"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-md flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <span className="text-[10px] text-gray-400">
                              ({Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60))} min slot)
                            </span>
                          </div>
                          
                          <h4 className="font-semibold text-gray-900 text-sm leading-snug">{task.title}</h4>
                          
                          {block.motivation && (
                            <div className="p-2.5 bg-indigo-50/40 rounded-lg border border-indigo-100/30 text-xs text-indigo-900 italic flex items-start gap-1.5">
                              <Brain className="w-3.5 h-3.5 text-indigo-600 mt-0.5 shrink-0" />
                              <span>"{block.motivation}"</span>
                            </div>
                          )}
                        </div>

                        <button
                          onClick={() => handleQuickComplete(task.id)}
                          className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 transition shadow-sm hover:shadow-indigo-600/10 self-start md:self-center shrink-0 cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Complete Task</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Integrated daily Timeline block component */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <h3 className="font-semibold text-gray-800 text-xs uppercase tracking-wider mb-3.5 text-gray-400">
                Today's Integrated Calendar
              </h3>

              {timelineEvents.length === 0 ? (
                <div className="py-8 text-center text-xs text-gray-400">
                  Timeline empty. Generate schedules above.
                </div>
              ) : (
                <div className="relative border-l border-gray-100 pl-4 ml-2.5 space-y-6">
                  {timelineEvents.map((event) => (
                    <div key={event.id} className="relative">
                      {/* Timeline Dot Indicator */}
                      <span className={`absolute -left-[24.5px] top-1 w-3 h-3 rounded-full border-2 ${
                        event.type === 'focus' 
                          ? 'bg-indigo-600 border-indigo-200 ring-4 ring-indigo-50' 
                          : 'bg-gray-400 border-gray-200'
                      }`} />

                      <div className="space-y-1">
                        <div className="flex justify-between items-center text-[10px] font-bold text-gray-400">
                          <span>
                            {event.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {event.end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <span className={`px-1.5 py-0.5 rounded text-[8px] uppercase tracking-wide ${
                            event.type === 'focus' 
                              ? 'bg-indigo-100 text-indigo-700' 
                              : 'bg-gray-100 text-gray-500'
                          }`}>
                            {event.type}
                          </span>
                        </div>
                        <h4 className={`text-xs font-semibold leading-tight ${
                          event.type === 'focus' ? 'text-indigo-900' : 'text-gray-700'
                        }`}>
                          {event.title}
                        </h4>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

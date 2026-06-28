/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Calendar, Trash2, CheckCircle2, Circle, AlertCircle, RefreshCw, Clock } from 'lucide-react';
import { ProductiveTask } from '../types.ts';

interface TaskListProps {
  tasks: ProductiveTask[];
  onTaskUpdated: () => void;
  isLoading: boolean;
}

export default function TaskList({ tasks, onTaskUpdated, isLoading }: TaskListProps) {
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Helper to format remaining time/deadline countdown beautifully
  const getDeadlineBadge = (deadlineStr: string, status: string) => {
    if (status === 'Completed') {
      return (
        <span className="inline-flex items-center gap-1 text-xs text-gray-400 font-medium line-through">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          Completed
        </span>
      );
    }

    const deadline = new Date(deadlineStr);
    const now = new Date();
    const diffMs = deadline.getTime() - now.getTime();
    const diffHrs = diffMs / (1000 * 60 * 60);

    if (diffHrs <= 0) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-rose-50 border border-rose-100 text-rose-700 rounded-full text-xs font-semibold animate-pulse">
          <AlertCircle className="w-3.5 h-3.5" />
          Overdue!
        </span>
      );
    }

    if (diffHrs < 24) {
      const hrs = Math.floor(diffHrs);
      const mins = Math.round((diffHrs - hrs) * 60);
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 border border-amber-100 text-amber-700 rounded-full text-xs font-semibold">
          <Clock className="w-3.5 h-3.5" />
          {hrs}h {mins}m left
        </span>
      );
    }

    const days = Math.floor(diffHrs / 24);
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-full text-xs font-medium">
        <Calendar className="w-3.5 h-3.5 text-indigo-500" />
        {days} {days === 1 ? 'day' : 'days'} left
      </span>
    );
  };

  // Handle task status transition
  const handleStatusChange = async (task: ProductiveTask, newStatus: ProductiveTask['status']) => {
    setUpdatingId(task.id);
    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const result = await response.json();
      if (result.success) {
        onTaskUpdated();
      }
    } catch (err) {
      console.error('Failed to update task status:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  // Handle task delete action
  const handleDeleteTask = async (id: string) => {
    if (!confirm('Are you sure you want to remove this task?')) return;
    setUpdatingId(id);
    try {
      const response = await fetch(`/api/tasks/${id}`, {
        method: 'DELETE',
      });
      const result = await response.json();
      if (result.success) {
        onTaskUpdated();
      }
    } catch (err) {
      console.error('Failed to delete task:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="flex justify-between items-center px-6 py-5 border-b border-gray-50 bg-gray-50/20">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 tracking-tight">Active Task Repositories</h2>
          <p className="text-xs text-gray-400 mt-0.5">Maintain, modify, or mark tasks as completed</p>
        </div>
        <div className="flex items-center gap-2">
          {isLoading && <RefreshCw className="w-4 h-4 text-indigo-600 animate-spin" />}
          <span className="text-xs bg-indigo-50 text-indigo-700 font-medium px-2.5 py-1 rounded-full border border-indigo-100">
            {tasks.length} {tasks.length === 1 ? 'Task' : 'Tasks'}
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50/50">
              <th className="py-4 px-6 font-semibold">Task Details</th>
              <th className="py-4 px-4 font-semibold text-center">Urgency / Countdown</th>
              <th className="py-4 px-4 font-semibold text-center">Priority</th>
              <th className="py-4 px-4 font-semibold text-center">Impact / Effort</th>
              <th className="py-4 px-4 font-semibold text-center">Status</th>
              <th className="py-4 px-6 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm">
            {tasks.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-gray-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Circle className="w-8 h-8 text-gray-200 stroke-[1.5]" />
                    <span className="font-medium">No tasks found. Create a task to save your deadlines!</span>
                  </div>
                </td>
              </tr>
            ) : (
              tasks.map((task) => (
                <tr
                  key={task.id}
                  className={`group transition hover:bg-gray-50/30 ${
                    task.status === 'Completed' ? 'bg-gray-50/10 opacity-70' : ''
                  }`}
                >
                  <td className="py-4 px-6 max-w-sm">
                    <div className="flex flex-col">
                      <span className={`font-semibold text-gray-900 group-hover:text-indigo-600 transition ${
                        task.status === 'Completed' ? 'line-through text-gray-400' : ''
                      }`}>
                        {task.title}
                      </span>
                      {task.description && (
                        <p className="text-xs text-gray-400 mt-1 line-clamp-2">
                          {task.description}
                        </p>
                      )}
                    </div>
                  </td>

                  <td className="py-4 px-4 text-center whitespace-nowrap">
                    {getDeadlineBadge(task.deadline, task.status)}
                  </td>

                  <td className="py-4 px-4 text-center">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold border ${
                        task.priority === 'High'
                          ? 'bg-rose-50 border-rose-100 text-rose-700'
                          : task.priority === 'Medium'
                            ? 'bg-amber-50 border-amber-100 text-amber-700'
                            : 'bg-green-50 border-green-100 text-green-700'
                      }`}
                    >
                      {task.priority}
                    </span>
                  </td>

                  <td className="py-4 px-4 text-center whitespace-nowrap">
                    <div className="flex justify-center items-center gap-2">
                      <div className="flex flex-col items-center">
                        <span className="text-xs font-semibold text-indigo-600">{task.impact}</span>
                        <span className="text-[10px] text-gray-400 uppercase font-medium">Impact</span>
                      </div>
                      <div className="text-gray-300">/</div>
                      <div className="flex flex-col items-center">
                        <span className="text-xs font-semibold text-rose-600">{task.effort}</span>
                        <span className="text-[10px] text-gray-400 uppercase font-medium">Effort</span>
                      </div>
                    </div>
                  </td>

                  <td className="py-4 px-4 text-center">
                    <select
                      value={task.status}
                      onChange={(e) => handleStatusChange(task, e.target.value as ProductiveTask['status'])}
                      disabled={updatingId === task.id}
                      className={`text-xs font-semibold rounded-lg border px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/15 cursor-pointer transition ${
                        task.status === 'Completed'
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                          : task.status === 'In Progress'
                            ? 'bg-blue-50 border-blue-200 text-blue-700'
                            : 'bg-gray-100 border-gray-200 text-gray-600'
                      }`}
                    >
                      <option value="Pending">Pending</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </td>

                  <td className="py-4 px-6 text-right whitespace-nowrap">
                    <div className="flex justify-end gap-1.5">
                      {task.status !== 'Completed' ? (
                        <button
                          onClick={() => handleStatusChange(task, 'Completed')}
                          disabled={updatingId === task.id}
                          className="p-1.5 bg-gray-50 border border-gray-200 hover:border-emerald-200 hover:bg-emerald-50 text-gray-400 hover:text-emerald-600 rounded-lg transition tooltip cursor-pointer"
                          title="Quick Mark Complete"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleStatusChange(task, 'Pending')}
                          disabled={updatingId === task.id}
                          className="p-1.5 bg-gray-50 border border-gray-200 hover:border-indigo-200 hover:bg-indigo-50 text-gray-400 hover:text-indigo-600 rounded-lg transition tooltip cursor-pointer"
                          title="Revert to Pending"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteTask(task.id)}
                        disabled={updatingId === task.id}
                        className="p-1.5 bg-gray-50 border border-gray-200 hover:border-red-200 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded-lg transition cursor-pointer"
                        title="Delete Task"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

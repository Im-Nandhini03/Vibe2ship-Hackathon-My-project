/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { PlusCircle, Calendar, AlertTriangle, ShieldCheck } from 'lucide-react';
import { ProductiveTask } from '../types.ts';

interface TaskFormProps {
  onTaskAdded: () => void;
}

export default function TaskForm({ onTaskAdded }: TaskFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [priority, setPriority] = useState<'Low' | 'Medium' | 'High'>('Medium');
  const [impact, setImpact] = useState<number>(5);
  const [effort, setEffort] = useState<number>(5);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Set default deadline to tomorrow at 5 PM helper
  const setDefaultDeadline = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(17, 0, 0, 0); // 5 PM
    
    // Format to yyyy-MM-ddThh:mm for datetime-local input
    const year = tomorrow.getFullYear();
    const month = String(tomorrow.getMonth() + 1).padStart(2, '0');
    const day = String(tomorrow.getDate()).padStart(2, '0');
    const hours = String(tomorrow.getHours()).padStart(2, '0');
    const minutes = String(tomorrow.getMinutes()).padStart(2, '0');
    
    setDeadline(`${year}-${month}-${day}T${hours}:${minutes}`);
  };

  React.useEffect(() => {
    setDefaultDeadline();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Task Title is required.');
      return;
    }
    if (!deadline) {
      setError('Task Deadline is required.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          deadline: new Date(deadline).toISOString(),
          priority,
          impact,
          effort,
        }),
      });

      const result = await response.json();
      if (result.success) {
        setTitle('');
        setDescription('');
        setImpact(5);
        setEffort(5);
        setDefaultDeadline();
        onTaskAdded();
      } else {
        setError(result.error || 'Failed to add task.');
      }
    } catch (err: any) {
      setError('Server connection failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
      <div className="flex items-center gap-2.5 mb-5 pb-3 border-b border-gray-50">
        <PlusCircle className="w-5 h-5 text-indigo-600" />
        <h2 className="text-lg font-semibold text-gray-900 tracking-tight">Add New Lifesaver Task</h2>
      </div>

      {error && (
        <div className="mb-4 p-3.5 bg-red-50 rounded-xl border border-red-100 text-sm text-red-700 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-700 uppercase tracking-wider mb-1.5">
            Task Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-gray-900 placeholder:text-gray-400 transition"
            placeholder="e.g., Deliver Board Presentation Slides"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={isSubmitting}
            required
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 uppercase tracking-wider mb-1.5">
            Description
          </label>
          <textarea
            rows={2}
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-gray-900 placeholder:text-gray-400 transition resize-none"
            placeholder="Brief details about the task, requirements, etc..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={isSubmitting}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-gray-400" />
              Deadline <span className="text-red-500">*</span>
            </label>
            <input
              type="datetime-local"
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-gray-900 transition"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              disabled={isSubmitting}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 uppercase tracking-wider mb-1.5">
              Initial priority
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['Low', 'Medium', 'High'] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  disabled={isSubmitting}
                  className={`py-2 text-xs font-medium rounded-xl border transition ${
                    priority === p
                      ? p === 'High'
                        ? 'bg-red-50 border-red-200 text-red-700 font-semibold shadow-sm'
                        : p === 'Medium'
                          ? 'bg-amber-50 border-amber-200 text-amber-700 font-semibold shadow-sm'
                          : 'bg-green-50 border-green-200 text-green-700 font-semibold shadow-sm'
                      : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div className="bg-gray-50/50 p-3.5 rounded-xl border border-gray-100">
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-xs font-medium text-gray-700 uppercase tracking-wider">Business Impact</span>
              <span className="text-sm font-semibold text-indigo-600">{impact}/10</span>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              className="w-full accent-indigo-600"
              value={impact}
              onChange={(e) => setImpact(Number(e.target.value))}
              disabled={isSubmitting}
            />
            <p className="text-[10px] text-gray-400 mt-1">Consequence if missed or completed (High value = critical)</p>
          </div>

          <div className="bg-gray-50/50 p-3.5 rounded-xl border border-gray-100">
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-xs font-medium text-gray-700 uppercase tracking-wider">Required Effort</span>
              <span className="text-sm font-semibold text-rose-600">{effort}/10</span>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              className="w-full accent-rose-600"
              value={effort}
              onChange={(e) => setEffort(Number(e.target.value))}
              disabled={isSubmitting}
            />
            <p className="text-[10px] text-gray-400 mt-1">Estimated duration and mental intensity (Low effort = quick wins)</p>
          </div>
        </div>

        <button
          type="submit"
          className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm rounded-xl transition flex items-center justify-center gap-2 shadow-sm shadow-indigo-600/10 cursor-pointer disabled:opacity-50"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <ShieldCheck className="w-4 h-4" />
              <span>Create Productivity Task</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}

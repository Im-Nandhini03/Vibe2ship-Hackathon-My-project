/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ProductiveTask {
  id: string;
  title: string;
  description: string;
  deadline: string; // ISO String (e.g. "2026-06-28T12:00:00.000Z")
  priority: 'Low' | 'Medium' | 'High'; // User-selected basic priority
  status: 'Pending' | 'In Progress' | 'Completed';
  impact: number; // 1 to 10
  effort: number; // 1 to 10
  score?: number; // Calculated urgency score
  suggestedBlock?: {
    startTime: string;
    endTime: string;
    motivation: string;
  };
}

export interface CalendarBlock {
  id: string;
  title: string;
  start: string; // ISO date-time string
  end: string;   // ISO date-time string
  isBusy: boolean;
}

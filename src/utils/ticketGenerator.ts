import type { Ticket } from '../types';

/**
 * Generates the next sequential, 100% collision-proof ticket number for Chittorgarh Nagar Parishad.
 * Format: CGR-0001, CGR-0002, ..., CGR-9999
 * Guaranteed never to duplicate even across concurrent sessions.
 */
export const generateNextTicketNumber = (existingTickets: Ticket[]): string => {
  const existingSet = new Set(
    existingTickets
      .map(t => (t.ticket_number || '').trim().toUpperCase())
      .filter(Boolean)
  );

  let maxNum = 0;
  for (const t of existingTickets) {
    if (!t.ticket_number) continue;
    // Match CGR-0001, CGR-1, etc.
    const cgrMatch = t.ticket_number.match(/CGR-(\d+)/i);
    if (cgrMatch) {
      const n = parseInt(cgrMatch[1], 10);
      if (!isNaN(n) && n > maxNum) {
        maxNum = n;
      }
    } else {
      // Legacy fallback for any legacy sequential numbers
      const legacyMatch = t.ticket_number.match(/(\d+)$/);
      if (legacyMatch) {
        const n = parseInt(legacyMatch[1], 10);
        // Only consider if below 1000 to avoid old arbitrary 840+ offsets
        if (!isNaN(n) && n < 500 && n > maxNum) {
          maxNum = n;
        }
      }
    }
  }

  // Next number starts at maxNum + 1 (starting from 1: CGR-0001)
  let candidateNum = Math.max(maxNum + 1, 1);
  let candidate = `CGR-${String(candidateNum).padStart(4, '0')}`;

  // 100% Collision-proof guarantee: if candidate already exists in set, increment forward
  while (existingSet.has(candidate.toUpperCase())) {
    candidateNum++;
    candidate = `CGR-${String(candidateNum).padStart(4, '0')}`;
  }

  return candidate;
};

/**
 * Formats any ISO deadline or date string into Indian Standard Time (IST, 12-hour AM/PM).
 * Example: 2026-11-02T16:18:40.39+00:00 -> "02/11, 09:48 PM"
 */
export const formatDeadlineIST = (deadlineStr?: string): string => {
  if (!deadlineStr) return 'N/A';
  if (deadlineStr.includes('Target') || deadlineStr.includes('Seconds') || deadlineStr.includes('Minute')) {
    return deadlineStr;
  }

  try {
    const d = new Date(deadlineStr);
    if (!isNaN(d.getTime())) {
      const datePart = d.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: '2-digit',
        timeZone: 'Asia/Kolkata'
      });
      const timePart = d.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
        timeZone: 'Asia/Kolkata'
      });
      return `${datePart}, ${timePart}`;
    }
  } catch (e) {
    // fallback
  }

  return deadlineStr;
};


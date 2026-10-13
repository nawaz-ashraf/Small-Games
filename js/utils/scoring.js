/**
 * Scoring and Formatting Utilities
 */

import { formatDuration, formatTime } from './time.js';

export { formatDuration, formatTime };

/**
 * Format a number with localized comma separators
 * @param {number} num
 * @returns {string}
 */
export function formatScore(num) {
  return Number(num || 0).toLocaleString();
}

/**
 * Time and Duration Formatting Utilities
 * Provides human-readable MM:SS and HH:MM:SS formatters with whole-second flooring
 */

/**
 * Format duration in seconds to standard MM:SS or HH:MM:SS display
 * Floors to whole seconds, eliminating decimal and millisecond precision
 *
 * Examples:
 *   0.275s -> "0:00"
 *   5.9s   -> "0:05"
 *   9.99s  -> "0:09"
 *   15.4s  -> "0:15"
 *   59.9s  -> "0:59"
 *   60s    -> "1:00"
 *   125.7s -> "2:05"
 *   3661s  -> "1:01:01"
 *
 * @param {number} totalSeconds - Elapsed duration in seconds
 * @returns {string} Formatted duration string
 */
export function formatDuration(totalSeconds) {
  if (typeof totalSeconds !== 'number' || isNaN(totalSeconds) || !isFinite(totalSeconds) || totalSeconds <= 0) {
    return '0:00';
  }

  // Use Math.floor to display completed whole seconds consistently
  const totalSec = Math.floor(totalSeconds);
  const hours = Math.floor(totalSec / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;
  const pad = (n) => String(n).padStart(2, '0');

  if (hours > 0) {
    return `${hours}:${pad(minutes)}:${pad(seconds)}`;
  }
  return `${minutes}:${pad(seconds)}`;
}

// Alias for seamless backward compatibility
export const formatTime = formatDuration;

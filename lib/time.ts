/**
 * Formats milliseconds into a time string in the format "M:SS" or "H:MM:SS" for longer durations
 * @param ms Duration in milliseconds
 * @returns Formatted time string
 * @example
 * formatDuration(123000) // "2:03"
 * formatDuration(3665000) // "1:01:05"
 * formatDuration(-123000) // "0:00"
 */
export const formatDuration = (ms: number): string => {
	if (ms < 0) return "0:00";

	const totalSeconds = Math.floor(ms / 1000);
	const hours = Math.floor(totalSeconds / 3600);
	const minutes = Math.floor((totalSeconds % 3600) / 60);
	const seconds = totalSeconds % 60;

	if (hours > 0) {
		return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
	}
	return `${minutes}:${seconds.toString().padStart(2, "0")}`;
};

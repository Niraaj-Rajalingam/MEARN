/**
 * Determine the Tamagotchi's mood based on experience points
 *
 * Point thresholds:
 * - very_sad: points < -5 (many incomplete high-priority tasks)
 * - sad: -5 <= points < 0 (some incomplete tasks)
 * - neutral: points === 0 (balanced or no tasks)
 * - happy: 0 < points <= 10 (more completed than incomplete)
 * - very_happy: points > 10 (many completed high-priority tasks)
 */
export function getTamagotchiMood(points: number): 'very_sad' | 'sad' | 'neutral' | 'happy' | 'very_happy' {
  if (points < -5) return 'very_sad';
  if (points < 0) return 'sad';
  if (points === 0) return 'neutral';
  if (points <= 10) return 'happy';
  return 'very_happy';
}

/**
 * Get a description of the Tamagotchi's current mood
 */
export function getMoodDescription(mood: 'very_sad' | 'sad' | 'neutral' | 'happy' | 'very_happy'): string {
  switch (mood) {
    case 'very_sad':
      return 'Your Tamagotchi is very sad. Complete some tasks to cheer them up!';
    case 'sad':
      return 'Your Tamagotchi is a bit down. A few completed tasks will help!';
    case 'neutral':
      return 'Your Tamagotchi is feeling okay. Complete tasks to make them happy!';
    case 'happy':
      return 'Your Tamagotchi is happy! Keep up the good work!';
    case 'very_happy':
      return 'Your Tamagotchi is thrilled! You\'re crushing it!';
  }
}

/**
 * Get color scheme based on mood
 */
export function getMoodColors(mood: 'very_sad' | 'sad' | 'neutral' | 'happy' | 'very_happy'): {
  primary: string;
  secondary: string;
} {
  switch (mood) {
    case 'very_sad':
      return { primary: '#7a7b7cff', secondary: '#9CA3AF' }; // gray
    case 'sad':
      return { primary: '#60A5FA', secondary: '#93C5FD' }; // blue
    case 'neutral':
      return { primary: '#bfadf2ff', secondary: '#C4B5FD' }; // purple
    case 'happy':
      return { primary: '#34D399', secondary: '#6EE7B7' }; // green
    case 'very_happy':
      return { primary: '#FBBF24', secondary: '#FCD34D' }; // yellow/gold
  }
}

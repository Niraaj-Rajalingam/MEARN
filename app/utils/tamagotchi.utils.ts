// Get tamagotchi mood based on happiness score (0-10)
export function getTamagotchiMood(points: number): 'very_sad' | 'sad' | 'neutral' | 'happy' | 'very_happy' {
  if (points <= 2) return 'very_sad';
  if (points < 4) return 'sad';
  if (points < 6) return 'neutral';
  if (points < 8) return 'happy';
  return 'very_happy';
}

// Get mood description
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

// Get colors for mood
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

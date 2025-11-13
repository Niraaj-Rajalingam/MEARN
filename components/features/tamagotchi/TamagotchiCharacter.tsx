'use client'

import './TamagotchiCharacter.css';

interface TamagotchiCharacterProps {
  mood: 'very_sad' | 'sad' | 'neutral' | 'happy' | 'very_happy';
  userColor?: number[];  // RGB array [R, G, B]
  size?: number;
}

/**
 * Convert RGB array to hex color
 */
function rgbToHex(rgb: number[]): string {
  const [r, g, b] = rgb;
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

/**
 * Adjust color based on mood
 * Happier moods = brighter/more saturated, sadder moods = greyer/desaturated
 */
function adjustColorByMood(rgb: number[], mood: string): number[] {
  const [r, g, b] = rgb;

  // Calculate the average (grey value)
  const grey = (r + g + b) / 3;

  switch (mood) {
    case 'very_sad':
      // Very desaturated (80% grey, 20% original color)
      return [
        Math.round(grey * 0.8 + r * 0.2),
        Math.round(grey * 0.8 + g * 0.2),
        Math.round(grey * 0.8 + b * 0.2)
      ];

    case 'sad':
      // Darker greyish purple (65% grey, 35% original color, + 10 brightness, slight purple tint)
      return [
        Math.min(255, Math.round(grey * 0.65 + r * 0.35) + 10),
        Math.min(255, Math.round(grey * 0.65 + g * 0.35) + 5),
        Math.min(255, Math.round(grey * 0.65 + b * 0.35) + 15)
      ];

    case 'neutral':
      // Original color
      return [r, g, b];

    case 'happy':
      // Slightly brighter and more saturated
      return rgb.map(val => Math.min(255, val + 30));

    case 'very_happy':
      // Much brighter and more saturated
      return rgb.map(val => Math.min(255, val + 60));

    default:
      return [r, g, b];
  }
}

/**
 * Create background color with opacity
 */
function createBackgroundColor(rgb: number[]): string {
  const [r, g, b] = rgb;
  return `rgba(${r}, ${g}, ${b}, 0.25)`;  // Increased from 0.1 to 0.25 for more opacity
}

export function TamagotchiCharacter({
  mood,
  userColor = [79, 70, 229], // Default indigo
  size = 120
}: TamagotchiCharacterProps) {

  // Adjust user's color based on mood
  const adjustedColor = adjustColorByMood(userColor, mood);
  const primaryColor = rgbToHex(adjustedColor);
  const backgroundColor = createBackgroundColor(userColor);

  // Get animation class based on mood
  const getAnimationClass = () => {
    switch (mood) {
      case 'very_sad':
        return 'tamagotchi-stagnant'; // No animation
      case 'sad':
        return 'tamagotchi-slow-sway'; // Very slow sway
      case 'neutral':
        return 'tamagotchi-gentle-bob'; // Gentle bobbing
      case 'happy':
        return 'tamagotchi-bounce'; // Bouncing
      case 'very_happy':
        return 'tamagotchi-fast-bounce'; // Fast bouncing
      default:
        return '';
    }
  };

  // Render egg based on mood
  const renderEgg = () => {
    switch (mood) {
      case 'very_sad':
        // Egg toppled over on its side (90 degrees to the left) with cracked head popped off
        return (
          <g transform="rotate(-90 50 56) translate(-10, 6)">
            {/* White liquid puddle near the cracked head - spilled out - BEHIND EVERYTHING */}
            <g transform="rotate(90 50 22) translate(-7, 26)">
              {/* Large puddle spreading on the ground - wider near bottom/left - very transparent */}
              <ellipse cx="40" cy="22" rx="25" ry="6" fill="white" opacity="0.3" />
              <ellipse cx="45" cy="20" rx="22" ry="5" fill="white" opacity="0.35" />
              <ellipse cx="35" cy="20" rx="18" ry="5.5" fill="white" opacity="0.25" />

              {/* Additional irregular puddle shapes for more organic look - extended left, wider, very transparent */}
              <ellipse cx="28" cy="22" rx="12" ry="4.5" fill="white" opacity="0.2" />
              <ellipse cx="50" cy="21" rx="15" ry="4" fill="white" opacity="0.25" />

              {/* Animated sparkly droplets near the spilling source - creating movement effect - very noticeable */}
              <ellipse cx="48" cy="21" rx="7" ry="3.5" fill="white" opacity="1" className="liquid-droplet-1" />
              <ellipse cx="50" cy="19" rx="6.5" ry="3" fill="white" opacity="1" className="liquid-droplet-2" />
              <ellipse cx="52" cy="22" rx="6" ry="3" fill="white" opacity="1" className="liquid-droplet-3" />
            </g>

            {/* Bottom part of egg body (from crack line down) */}
            <path
              d="M 50 28 L 56 29 L 62 28 L 68 29 L 73 28
                 C 78 38, 82 50, 82 62
                 C 82 76, 80 88, 72 94
                 C 64 100, 57 100, 50 100
                 C 43 100, 36 100, 28 94
                 C 20 88, 18 76, 18 62
                 C 18 50, 22 38, 27 28
                 C 35 28, 42 28, 50 28 Z"
              fill={primaryColor}
            />

            {/* Crescent shadow at bottom of egg */}
            <path
              d="M 28 86
                 C 35 88, 42 90, 50 90
                 C 58 90, 65 88, 72 86
                 C 70 92, 61 97, 50 97
                 C 39 97, 30 92, 28 86 Z"
              fill="#000"
              opacity="0.15"
            />

            {/* Bottom outline */}
            <path
              d="M 50 28 L 56 29 L 62 28 L 68 29 L 73 28
                 C 78 38, 82 50, 82 62
                 C 82 76, 80 88, 72 94
                 C 64 100, 57 100, 50 100
                 C 43 100, 36 100, 28 94
                 C 20 88, 18 76, 18 62
                 C 18 50, 22 38, 27 28
                 C 35 28, 42 28, 50 28 Z"
              fill="none"
              stroke="#4A3728"
              strokeWidth="4"
            />

            {/* Jagged crack line - very visible, thinner on left end */}
            <path d="M 50 28 L 56 29 L 62 28 L 68 29 L 73 28" stroke="#000" strokeWidth="0.7" fill="none" />

            {/* X eyes - very sad */}
            <path d="M 35 50 L 41 56 M 41 50 L 35 56" stroke="#4A3728" strokeWidth="3" strokeLinecap="round" />
            <path d="M 59 50 L 65 56 M 65 50 L 59 56" stroke="#4A3728" strokeWidth="3" strokeLinecap="round" />

            {/* Frown */}
            <path d="M 38 66 Q 50 62 62 66" stroke="#4A3728" strokeWidth="2.5" fill="none" strokeLinecap="round" />

            {/* Rosy cheeks */}
            <circle cx="28" cy="60" r="4" fill="#FCA5A5" opacity="0.3" />
            <circle cx="72" cy="60" r="4" fill="#FCA5A5" opacity="0.3" />
          </g>
        );

      case 'sad':
        // Cracking egg
        return (
          <>
            {/* Main egg body - true egg shape (narrower top, wider bottom) */}
            <path
              d="M 50 12
                 C 60 12, 68 18, 73 28
                 C 78 38, 82 50, 82 62
                 C 82 76, 80 88, 72 94
                 C 64 100, 57 100, 50 100
                 C 43 100, 36 100, 28 94
                 C 20 88, 18 76, 18 62
                 C 18 50, 22 38, 27 28
                 C 32 18, 40 12, 50 12 Z"
              fill={primaryColor}
            />

            {/* Crescent shadow at bottom of egg */}
            <path
              d="M 28 86
                 C 35 88, 42 90, 50 90
                 C 58 90, 65 88, 72 86
                 C 70 92, 61 97, 50 97
                 C 39 97, 30 92, 28 86 Z"
              fill="#000"
              opacity="0.15"
            />

            {/* Egg outline/border */}
            <path
              d="M 50 12
                 C 60 12, 68 18, 73 28
                 C 78 38, 82 50, 82 62
                 C 82 76, 80 88, 72 94
                 C 64 100, 57 100, 50 100
                 C 43 100, 36 100, 28 94
                 C 20 88, 18 76, 18 62
                 C 18 50, 22 38, 27 28
                 C 32 18, 40 12, 50 12 Z"
              fill="none"
              stroke="#4A3728"
              strokeWidth="4"
            />

            {/* Egg shine - top left highlight */}
            <ellipse cx="38" cy="30" rx="7" ry="12" fill="white" opacity="0.6" transform="rotate(25 38 30)" />

            {/* Cracks in the shell - horizontal crack extending to outer edge */}
            <path d="M 43 28 L 51 29 L 59 28 L 67 29 L 73 28" stroke="#000" strokeWidth="0.875" fill="none" />

            {/* Sad face */}
            <ellipse cx="38" cy="54" rx="4" ry="5" fill="#4A3728" />
            <ellipse cx="62" cy="54" rx="4" ry="5" fill="#4A3728" />
            <path d="M 40 66 Q 50 62 60 66" stroke="#4A3728" strokeWidth="2.5" fill="none" strokeLinecap="round" />

            {/* Teardrops - animated to continuously flow, thicker */}
            <path d="M 38 63 Q 35 65 35 68 Q 35 72 38 74 Q 41 72 41 68 Q 41 65 38 63 Z" fill="#3B82F6" opacity="0.95" className="tear-drop" />
            <path d="M 62 65 Q 59 67 59 71 Q 59 76 62 78 Q 65 76 65 71 Q 65 67 62 65 Z" fill="#3B82F6" opacity="0.95" className="tear-drop-delayed" />

            {/* Rosy cheeks */}
            <circle cx="28" cy="60" r="4" fill="#FCA5A5" opacity="0.4" />
            <circle cx="72" cy="60" r="4" fill="#FCA5A5" opacity="0.4" />
          </>
        );

      case 'neutral':
        // Normal egg
        return (
          <>
            {/* Main egg body - true egg shape (narrower top, wider bottom) */}
            <path
              d="M 50 12
                 C 60 12, 68 18, 73 28
                 C 78 38, 82 50, 82 62
                 C 82 76, 80 88, 72 94
                 C 64 100, 57 100, 50 100
                 C 43 100, 36 100, 28 94
                 C 20 88, 18 76, 18 62
                 C 18 50, 22 38, 27 28
                 C 32 18, 40 12, 50 12 Z"
              fill={primaryColor}
            />

            {/* Crescent shadow at bottom of egg */}
            <path
              d="M 28 86
                 C 35 88, 42 90, 50 90
                 C 58 90, 65 88, 72 86
                 C 70 92, 61 97, 50 97
                 C 39 97, 30 92, 28 86 Z"
              fill="#000"
              opacity="0.15"
            />

            {/* Egg outline/border */}
            <path
              d="M 50 12
                 C 60 12, 68 18, 73 28
                 C 78 38, 82 50, 82 62
                 C 82 76, 80 88, 72 94
                 C 64 100, 57 100, 50 100
                 C 43 100, 36 100, 28 94
                 C 20 88, 18 76, 18 62
                 C 18 50, 22 38, 27 28
                 C 32 18, 40 12, 50 12 Z"
              fill="none"
              stroke="#4A3728"
              strokeWidth="4"
            />

            {/* Egg shine - top left highlight */}
            <ellipse cx="38" cy="30" rx="7" ry="12" fill="white" opacity="0.6" transform="rotate(25 38 30)" />

            {/* Neutral face */}
            <ellipse cx="38" cy="54" rx="4" ry="5" fill="#4A3728" />
            <ellipse cx="62" cy="54" rx="4" ry="5" fill="#4A3728" />
            <line x1="40" y1="66" x2="60" y2="66" stroke="#4A3728" strokeWidth="2.5" strokeLinecap="round" />

            {/* Rosy cheeks */}
            <circle cx="28" cy="60" r="4" fill="#FCA5A5" opacity="0.5" />
            <circle cx="72" cy="60" r="4" fill="#FCA5A5" opacity="0.5" />
          </>
        );

      case 'happy':
        // Happy egg with smile
        return (
          <>
            {/* Main egg body - true egg shape (narrower top, wider bottom) */}
            <path
              d="M 50 12
                 C 60 12, 68 18, 73 28
                 C 78 38, 82 50, 82 62
                 C 82 76, 80 88, 72 94
                 C 64 100, 57 100, 50 100
                 C 43 100, 36 100, 28 94
                 C 20 88, 18 76, 18 62
                 C 18 50, 22 38, 27 28
                 C 32 18, 40 12, 50 12 Z"
              fill={primaryColor}
            />

            {/* Crescent shadow at bottom of egg */}
            <path
              d="M 28 86
                 C 35 88, 42 90, 50 90
                 C 58 90, 65 88, 72 86
                 C 70 92, 61 97, 50 97
                 C 39 97, 30 92, 28 86 Z"
              fill="#000"
              opacity="0.15"
            />

            {/* Egg outline/border */}
            <path
              d="M 50 12
                 C 60 12, 68 18, 73 28
                 C 78 38, 82 50, 82 62
                 C 82 76, 80 88, 72 94
                 C 64 100, 57 100, 50 100
                 C 43 100, 36 100, 28 94
                 C 20 88, 18 76, 18 62
                 C 18 50, 22 38, 27 28
                 C 32 18, 40 12, 50 12 Z"
              fill="none"
              stroke="#4A3728"
              strokeWidth="4"
            />

            {/* Egg shine - top left highlight */}
            <ellipse cx="38" cy="30" rx="7" ry="12" fill="white" opacity="0.6" transform="rotate(25 38 30)" />

            {/* Happy face */}
            <ellipse cx="38" cy="52" rx="4" ry="5" fill="#4A3728" />
            <ellipse cx="62" cy="52" rx="4" ry="5" fill="#4A3728" />
            {/* Big smile */}
            <path d="M 35 62 Q 50 72 65 62" stroke="#4A3728" strokeWidth="3" fill="none" strokeLinecap="round" />

            {/* Rosy cheeks */}
            <circle cx="26" cy="60" r="5" fill="#FCA5A5" opacity="0.65" />
            <circle cx="74" cy="60" r="5" fill="#FCA5A5" opacity="0.65" />
          </>
        );

      case 'very_happy':
        // Very happy bouncing egg with sparkles
        return (
          <>
            {/* Sparkles around egg */}
            <path d="M 15 25 L 17 30 L 22 28 L 17 33 L 15 38 L 13 33 L 8 28 L 13 30 Z" fill={primaryColor} opacity="0.8" />
            <path d="M 85 25 L 87 30 L 92 28 L 87 33 L 85 38 L 83 33 L 78 28 L 83 30 Z" fill={primaryColor} opacity="0.8" />
            <path d="M 20 70 L 22 74 L 26 73 L 22 77 L 20 81 L 18 77 L 14 73 L 18 74 Z" fill={primaryColor} opacity="0.6" />
            <path d="M 80 70 L 82 74 L 86 73 L 82 77 L 80 81 L 78 77 L 74 73 L 78 74 Z" fill={primaryColor} opacity="0.6" />

            {/* Main egg body - true egg shape (narrower top, wider bottom) */}
            <path
              d="M 50 12
                 C 60 12, 68 18, 73 28
                 C 78 38, 82 50, 82 62
                 C 82 76, 80 88, 72 94
                 C 64 100, 57 100, 50 100
                 C 43 100, 36 100, 28 94
                 C 20 88, 18 76, 18 62
                 C 18 50, 22 38, 27 28
                 C 32 18, 40 12, 50 12 Z"
              fill={primaryColor}
            />

            {/* Crescent shadow at bottom of egg */}
            <path
              d="M 28 86
                 C 35 88, 42 90, 50 90
                 C 58 90, 65 88, 72 86
                 C 70 92, 61 97, 50 97
                 C 39 97, 30 92, 28 86 Z"
              fill="#000"
              opacity="0.15"
            />

            {/* Egg outline/border */}
            <path
              d="M 50 12
                 C 60 12, 68 18, 73 28
                 C 78 38, 82 50, 82 62
                 C 82 76, 80 88, 72 94
                 C 64 100, 57 100, 50 100
                 C 43 100, 36 100, 28 94
                 C 20 88, 18 76, 18 62
                 C 18 50, 22 38, 27 28
                 C 32 18, 40 12, 50 12 Z"
              fill="none"
              stroke="#4A3728"
              strokeWidth="4"
            />

            {/* Egg shine - top left highlight */}
            <ellipse cx="38" cy="30" rx="7" ry="12" fill="white" opacity="0.6" transform="rotate(25 38 30)" />

            {/* Very happy face - closed eyes smile */}
            <path d="M 34 50 Q 38 46 42 50" stroke="#4A3728" strokeWidth="3" fill="none" strokeLinecap="round" />
            <path d="M 58 50 Q 62 46 66 50" stroke="#4A3728" strokeWidth="3" fill="none" strokeLinecap="round" />
            {/* Huge smile */}
            <path d="M 32 60 Q 50 74 68 60" stroke="#4A3728" strokeWidth="3.5" fill="none" strokeLinecap="round" />

            {/* Big rosy cheeks */}
            <circle cx="24" cy="58" r="7" fill="#FCA5A5" opacity="0.7" />
            <circle cx="76" cy="58" r="7" fill="#FCA5A5" opacity="0.7" />

            {/* Sparkles on cheeks */}
            <circle cx="22" cy="56" r="1.5" fill="white" opacity="0.9" />
            <circle cx="78" cy="56" r="1.5" fill="white" opacity="0.9" />
          </>
        );
    }
  };

  return (
    <div className="relative">
      <svg
        width={size}
        height={size}
        viewBox="-10 -10 120 120"
        xmlns="http://www.w3.org/2000/svg"
        className="mx-auto"
      >
        {/* Static background */}
        <rect x="-10" y="-10" width="120" height="120" rx="20" fill={backgroundColor} />
        {/* Static shadow */}
        <ellipse
          cx="50"
          cy="102"
          rx={mood === 'very_sad' ? 45 : (mood === 'very_happy' ? 28 : 26)}
          ry={mood === 'very_sad' ? 8 : (mood === 'very_happy' ? 6 : 5)}
          fill="#000"
          opacity={mood === 'very_happy' ? 0.2 : 0.15}
        />
      </svg>
      <svg
        width={size}
        height={size}
        viewBox="-10 -10 120 120"
        xmlns="http://www.w3.org/2000/svg"
        className={`mx-auto absolute inset-0 ${getAnimationClass()}`}
      >
        {renderEgg()}
      </svg>
    </div>
  );
}

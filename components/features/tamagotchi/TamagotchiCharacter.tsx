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
 * Create a lighter shade of a color
 */
function lightenColor(rgb: number[], amount: number = 40): string {
  const lightRgb = rgb.map(val => Math.min(255, val + amount));
  return rgbToHex(lightRgb);
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
      // Desaturated (60% grey, 40% original color)
      return [
        Math.round(grey * 0.6 + r * 0.4),
        Math.round(grey * 0.6 + g * 0.4),
        Math.round(grey * 0.6 + b * 0.4)
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
  const secondaryColor = lightenColor(adjustedColor, 60);
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

  // Define expressions for each mood
  const getMoodExpression = () => {
    switch (mood) {
      case 'very_sad':
        return {
          eyes: (
            <>
              {/* Crying eyes */}
              <circle cx="35" cy="45" r="3" fill="#000" />
              <circle cx="65" cy="45" r="3" fill="#000" />
              {/* Tears */}
              <path d="M 35 50 Q 33 60 35 65" stroke="#60A5FA" strokeWidth="2" fill="none" />
              <path d="M 65 50 Q 67 60 65 65" stroke="#60A5FA" strokeWidth="2" fill="none" />
            </>
          ),
          mouth: <path d="M 35 75 Q 50 68 65 75" stroke="#000" strokeWidth="3" fill="none" strokeLinecap="round" />, // frown
          cheeks: null
        };

      case 'sad':
        return {
          eyes: (
            <>
              {/* Sad eyes */}
              <circle cx="35" cy="45" r="3" fill="#000" />
              <circle cx="65" cy="45" r="3" fill="#000" />
            </>
          ),
          mouth: <path d="M 40 75 Q 50 70 60 75" stroke="#000" strokeWidth="2" fill="none" strokeLinecap="round" />, // slight frown
          cheeks: null
        };

      case 'neutral':
        return {
          eyes: (
            <>
              {/* Neutral eyes */}
              <circle cx="35" cy="45" r="4" fill="#000" />
              <circle cx="65" cy="45" r="4" fill="#000" />
            </>
          ),
          mouth: <line x1="40" y1="72" x2="60" y2="72" stroke="#000" strokeWidth="2" strokeLinecap="round" />, // straight line
          cheeks: null
        };

      case 'happy':
        return {
          eyes: (
            <>
              {/* Happy eyes */}
              <circle cx="35" cy="45" r="5" fill="#000" />
              <circle cx="65" cy="45" r="5" fill="#000" />
            </>
          ),
          mouth: <path d="M 35 70 Q 50 78 65 70" stroke="#000" strokeWidth="3" fill="none" strokeLinecap="round" />, // smile
          cheeks: (
            <>
              <circle cx="20" cy="60" r="6" fill="#FCA5A5" opacity="0.6" />
              <circle cx="80" cy="60" r="6" fill="#FCA5A5" opacity="0.6" />
            </>
          )
        };

      case 'very_happy':
        return {
          eyes: (
            <>
              {/* Very happy eyes (sparkles) */}
              <path d="M 35 45 L 33 40 L 35 35 L 37 40 Z" fill="#000" />
              <path d="M 35 45 L 30 43 L 25 45 L 30 47 Z" fill="#000" />
              <path d="M 65 45 L 63 40 L 65 35 L 67 40 Z" fill="#000" />
              <path d="M 65 45 L 60 43 L 55 45 L 60 47 Z" fill="#000" />
              {/* Sparkles around */}
              <path d="M 10 20 L 12 22 L 10 24 L 8 22 Z" fill={primaryColor} opacity="0.8" />
              <path d="M 90 20 L 92 22 L 90 24 L 88 22 Z" fill={primaryColor} opacity="0.8" />
            </>
          ),
          mouth: <path d="M 30 68 Q 50 82 70 68" stroke="#000" strokeWidth="3" fill="none" strokeLinecap="round" />, // big smile
          cheeks: (
            <>
              <circle cx="18" cy="60" r="8" fill="#FCA5A5" opacity="0.7" />
              <circle cx="82" cy="60" r="8" fill="#FCA5A5" opacity="0.7" />
            </>
          )
        };
    }
  };

  const expression = getMoodExpression();

  return (
    <div className={getAnimationClass()}>
      <svg
        width={size}
        height={size}
        viewBox="-10 -10 120 120"
        xmlns="http://www.w3.org/2000/svg"
        className="mx-auto"
      >
      {/* Background square - larger with padding */}
      <rect x="-10" y="-10" width="120" height="120" rx="16" fill={backgroundColor} />

      {/* Body */}
      <ellipse cx="50" cy="55" rx="40" ry="45" fill={primaryColor} />

      {/* Belly spot */}
      <ellipse cx="50" cy="70" rx="25" ry="20" fill={secondaryColor} opacity="0.5" />

      {/* Head outline/shine */}
      <ellipse cx="45" cy="30" rx="8" ry="12" fill="white" opacity="0.3" />

      {/* Ears/Antennae */}
      <circle cx="25" cy="15" r="8" fill={primaryColor} />
      <circle cx="75" cy="15" r="8" fill={primaryColor} />
      <circle cx="25" cy="12" r="4" fill={secondaryColor} />
      <circle cx="75" cy="12" r="4" fill={secondaryColor} />

      {/* Face */}
      {expression.eyes}
      {expression.mouth}
      {expression.cheeks}

      {/* Arms */}
      <ellipse cx="10" cy="60" rx="8" ry="15" fill={primaryColor} />
      <ellipse cx="90" cy="60" rx="8" ry="15" fill={primaryColor} />

      {/* Feet */}
      <ellipse cx="35" cy="95" rx="10" ry="6" fill={primaryColor} />
      <ellipse cx="65" cy="95" rx="10" ry="6" fill={primaryColor} />
    </svg>
    </div>
  );
}

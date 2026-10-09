import React from 'react';
import Svg, { Path, Rect } from 'react-native-svg';

/**
 * The assistant's face: a smiling bot with headset ears in a speech bubble.
 * Drawn in one colour (the theme accent) with a white face plate, so it follows
 * whatever colour the business picks.
 */
export function BotIcon({ size = 40, color, face = '#FFFFFF' }: { size?: number; color: string; face?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      {/* speech-bubble tail, bottom left */}
      <Path d="M20 70 L12 92 L38 78 Z" fill={color} />
      {/* headset ears */}
      <Rect x="3" y="38" width="12" height="26" rx="6" fill={color} />
      <Rect x="85" y="38" width="12" height="26" rx="6" fill={color} />
      <Path d="M9 40 C9 14 91 14 91 40" stroke={color} strokeWidth="5" fill="none" strokeLinecap="round" />
      {/* head */}
      <Rect x="12" y="22" width="76" height="60" rx="28" fill={color} />
      {/* face plate */}
      <Rect x="23" y="33" width="54" height="36" rx="17" fill={face} />
      {/* eyes: two happy arcs */}
      <Path d="M34 52 Q39 44 44 52" stroke={color} strokeWidth="4" fill="none" strokeLinecap="round" />
      <Path d="M56 52 Q61 44 66 52" stroke={color} strokeWidth="4" fill="none" strokeLinecap="round" />
      {/* smile */}
      <Path d="M44 58 Q50 64 56 58" stroke={color} strokeWidth="3.5" fill="none" strokeLinecap="round" />
    </Svg>
  );
}

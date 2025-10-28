// Map Tailwind color classes to actual color values
export const TAG_COLOR_MAP: Record<string, { bg: string; text: string }> = {
  'bg-red-300': { bg: '#fca5a5', text: '#000000' },
  'bg-red-700': { bg: '#b91c1c', text: '#ffffff' },
  'bg-orange-300': { bg: '#fdba74', text: '#000000' },
  'bg-orange-700': { bg: '#c2410c', text: '#ffffff' },
  'bg-amber-300': { bg: '#fcd34d', text: '#000000' },
  'bg-amber-700': { bg: '#b45309', text: '#ffffff' },
  'bg-yellow-300': { bg: '#fde047', text: '#000000' },
  'bg-yellow-700': { bg: '#a16207', text: '#ffffff' },
  'bg-lime-300': { bg: '#bef264', text: '#000000' },
  'bg-lime-700': { bg: '#4d7c0f', text: '#ffffff' },
  'bg-green-300': { bg: '#86efac', text: '#000000' },
  'bg-green-700': { bg: '#15803d', text: '#ffffff' },
  'bg-emerald-300': { bg: '#6ee7b7', text: '#000000' },
  'bg-emerald-700': { bg: '#047857', text: '#ffffff' },
  'bg-teal-300': { bg: '#5eead4', text: '#000000' },
  'bg-teal-700': { bg: '#0f766e', text: '#ffffff' },
  'bg-cyan-300': { bg: '#67e8f9', text: '#000000' },
  'bg-cyan-700': { bg: '#0e7490', text: '#ffffff' },
  'bg-sky-300': { bg: '#7dd3fc', text: '#000000' },
  'bg-sky-700': { bg: '#0369a1', text: '#ffffff' },
  'bg-blue-300': { bg: '#93c5fd', text: '#000000' },
  'bg-blue-700': { bg: '#1d4ed8', text: '#ffffff' },
  'bg-indigo-300': { bg: '#a5b4fc', text: '#000000' },
  'bg-indigo-700': { bg: '#4338ca', text: '#ffffff' },
  'bg-violet-300': { bg: '#c4b5fd', text: '#000000' },
  'bg-violet-700': { bg: '#6d28d9', text: '#ffffff' },
  'bg-purple-300': { bg: '#d8b4fe', text: '#000000' },
  'bg-purple-700': { bg: '#7e22ce', text: '#ffffff' },
  'bg-fuchsia-300': { bg: '#f0abfc', text: '#000000' },
  'bg-fuchsia-700': { bg: '#a21caf', text: '#ffffff' },
  'bg-pink-300': { bg: '#f9a8d4', text: '#000000' },
  'bg-pink-700': { bg: '#be185d', text: '#ffffff' },
  'bg-rose-300': { bg: '#fda4af', text: '#000000' },
  'bg-rose-700': { bg: '#be123c', text: '#ffffff' },
};

export function getTagColors(colorClass: string): { bg: string; text: string } {
  return TAG_COLOR_MAP[colorClass] || { bg: '#93c5fd', text: '#000000' }; // default to blue-300
}


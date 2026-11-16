import React from 'react';
import {
  Flame
} from 'lucide-react';

export function GithubIcon({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
      />
    </svg>
  );
}

export function LinkedinIcon({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 8.76a1.67 1.67 0 1 0 0-3.34 1.67 1.67 0 0 0 0 3.34M7.85 18.5V10.13H5.06v8.37h2.79z" />
    </svg>
  );
}

export function LeetCodeIcon({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M13.483 0a1.374 1.374 0 0 0-.961.438L7.116 6.226l-3.854 4.126a5.266 5.266 0 0 0-1.209 2.104 5.35 5.35 0 0 0-.125.513 5.527 5.527 0 0 0 .271 4.735 5.574 5.574 0 0 0 3.654 2.857 5.602 5.602 0 0 0 1.258.141c1.365 0 2.65-.515 3.633-1.451l4.02-3.834a1.383 1.383 0 0 0 .013-1.954 1.383 1.383 0 0 0-1.953-.013l-4.02 3.834a2.822 2.822 0 0 1-1.842.736 2.84 2.84 0 0 1-.637-.072 2.808 2.808 0 0 1-1.843-1.44 2.784 2.784 0 0 1-.137-2.388c.117-.307.287-.591.503-.84l3.855-4.125 5.405-5.787a1.38 1.38 0 0 0-.986-2.345zm2.844 7.647a1.382 1.382 0 0 0-1.026 2.308l3.666 3.918a1.38 1.38 0 1 0 2.015-1.888l-3.667-3.918a1.377 1.377 0 0 0-.988-.42zM7.28 12.012a1.382 1.382 0 0 0-1.38 1.382c0 .763.619 1.382 1.38 1.382h6.896a1.382 1.382 0 0 0 0-2.764H7.28z" />
    </svg>
  );
}

export function HackerRankIcon({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0a12 12 0 1 0 12 12A12.014 12.014 0 0 0 12 0zm3.333 16.667h-1.666v-3.75h-3.334v3.75H8.667V7.333h1.666v3.75h3.334v-3.75h1.666v9.334z" />
    </svg>
  );
}

export function CodeforcesIcon({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M4.5 7.5A1.5 1.5 0 0 1 6 9v10.5A1.5 1.5 0 0 1 4.5 21h-3A1.5 1.5 0 0 1 0 19.5V9a1.5 1.5 0 0 1 1.5-1.5h3zm7.5-4.5A1.5 1.5 0 0 1 13.5 4.5V19.5a1.5 1.5 0 0 1-1.5 1.5h-3A1.5 1.5 0 0 1 7.5 19.5V4.5A1.5 1.5 0 0 1 9 3h3zm7.5 9a1.5 1.5 0 0 1 1.5 1.5V19.5a1.5 1.5 0 0 1-1.5 1.5h-3a1.5 1.5 0 0 1-1.5-1.5V13.5a1.5 1.5 0 0 1 1.5-1.5h3z" />
    </svg>
  );
}

export function KaggleIcon({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.825 23.859c-.022.08-.095.141-.186.141h-3.238c-.13 0-.25-.067-.321-.176l-4.996-7.51-1.936 1.867v5.679c0 .144-.116.26-.26.26H5.26a.26.26 0 0 1-.26-.26V.26c0-.144.116-.26.26-.26h2.628c.144 0 .26.116.26.26v14.474l6.818-7.391a.384.384 0 0 1 .28-.123h3.297c.105 0 .178.077.168.181a.487.487 0 0 1-.102.222l-6.273 6.643 6.702 9.356c.074.1.085.228.025.321z" />
    </svg>
  );
}

export function CodeChefIcon({ className = 'w-4 h-4' }) {
  return (
    <div className={`flex items-center justify-center font-black ${className}`}>
      <Flame className="w-full h-full text-amber-600" />
    </div>
  );
}

export function GeeksforGeeksIcon({ className = 'w-4 h-4' }) {
  return (
    <div className={`flex items-center justify-center font-black text-[10px] bg-emerald-600 text-white rounded px-0.5 ${className}`}>
      GFG
    </div>
  );
}

export { PLATFORM_CONFIG } from './platformConfig';

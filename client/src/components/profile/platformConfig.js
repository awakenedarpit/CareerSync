import {
  Globe,
  Briefcase
} from 'lucide-react';
import {
  GithubIcon,
  LinkedinIcon,
  LeetCodeIcon,
  HackerRankIcon,
  CodeforcesIcon,
  CodeChefIcon,
  KaggleIcon,
  GeeksforGeeksIcon
} from './SocialPlatformIcons';

export const PLATFORM_CONFIG = {
  githubUrl: {
    label: 'GitHub',
    icon: GithubIcon,
    placeholder: 'https://github.com/username',
    color: 'text-slate-900',
    bg: 'bg-slate-100',
    hover: 'hover:border-slate-800',
  },
  linkedinUrl: {
    label: 'LinkedIn',
    icon: LinkedinIcon,
    placeholder: 'https://linkedin.com/in/username',
    color: 'text-sky-700',
    bg: 'bg-sky-50',
    hover: 'hover:border-sky-600',
  },
  portfolioUrl: {
    label: 'Personal Portfolio',
    icon: Briefcase,
    placeholder: 'https://yourname.dev',
    color: 'text-[#009669]',
    bg: 'bg-[#BDF9F9]/30',
    hover: 'hover:border-indigo-600',
  },
  leetcodeUrl: {
    label: 'LeetCode',
    icon: LeetCodeIcon,
    placeholder: 'https://leetcode.com/u/username',
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    hover: 'hover:border-amber-600',
  },
  hackerrankUrl: {
    label: 'HackerRank',
    icon: HackerRankIcon,
    placeholder: 'https://hackerrank.com/profile/username',
    color: 'text-emerald-700',
    bg: 'bg-emerald-50',
    hover: 'hover:border-emerald-600',
  },
  codeforcesUrl: {
    label: 'Codeforces',
    icon: CodeforcesIcon,
    placeholder: 'https://codeforces.com/profile/username',
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    hover: 'hover:border-blue-600',
  },
  codechefUrl: {
    label: 'CodeChef',
    icon: CodeChefIcon,
    placeholder: 'https://codechef.com/users/username',
    color: 'text-amber-700',
    bg: 'bg-amber-50',
    hover: 'hover:border-amber-700',
  },
  kaggleUrl: {
    label: 'Kaggle',
    icon: KaggleIcon,
    placeholder: 'https://kaggle.com/username',
    color: 'text-cyan-600',
    bg: 'bg-cyan-50',
    hover: 'hover:border-cyan-600',
  },
  geeksforgeeksUrl: {
    label: 'GeeksforGeeks',
    icon: GeeksforGeeksIcon,
    placeholder: 'https://auth.geeksforgeeks.org/user/username',
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    hover: 'hover:border-emerald-600',
  },
  personalWebsiteUrl: {
    label: 'Personal Website / Blog',
    icon: Globe,
    placeholder: 'https://blog.yourdomain.com',
    color: 'text-[#009669]',
    bg: 'bg-[#BDF9F9]/30',
    hover: 'hover:border-purple-600',
  },
};

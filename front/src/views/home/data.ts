/* Содержимое главной — пока текст образца ✳ (21.11.2026); заменяется по частям
   на данные федерации. */

export const TODAY = [
  'Plan my vacation',
  'Help me move to NYC',
  'Review my weekly goals',
  'Plan my Q3 priorities',
  'Build a better morning routine',
  'Organize my personal tasks',
  'What should I focus on today',
];

export const FILTERS = ['All Goals', 'Health', 'Career', 'Growth'];

export const PILLARS = [
  { name: 'Health', sub: '2 Active goal', grade: 'A+', icon: 'heart' },
  { name: 'Career', sub: '1 Active goal', grade: 'B+', icon: 'briefcase' },
  { name: 'Relationships', sub: 'Focus area', grade: 'A-', icon: 'users' },
  { name: 'Growth', sub: '0 Active goal', grade: 'A+', icon: 'trend' },
] as const;

export const STATS = [
  { value: '2', label: 'Active goal', icon: 'target' },
  { value: '4', label: 'Completed tasks', icon: 'list' },
  { value: '3', label: 'Total pillars', icon: 'heart' },
  { value: '78%', label: 'Avg. progress', icon: 'bars' },
] as const;

export const VISION = [
  {
    title: 'Build My Dream Career',
    text: 'Build a top 1% career in UI/UX design and development, work on meaningful projects, and create products people love.',
    status: 'In Progress',
    when: 'Q4 2026',
    art: 'climb',
  },
  {
    title: 'Be 1% Better Every Day',
    text: 'Stay fit, build a consistent workout routine, eat clean, and have more energy for the things I love.',
    status: 'Planned',
    when: '2029',
    art: 'book',
  },
  {
    title: 'Financial Freedom',
    text: 'Grow multiple income streams, invest wisely, and reach financial freedom within 5 years.',
    status: 'In Progress',
    when: 'Q4 2026',
    art: 'plant',
  },
] as const;

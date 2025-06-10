import { SortOption } from '../types/post';

export const SORT_OPTIONS: SortOption[] = [
  { label: 'Trending', sortBy: 'heat', order: 'desc' },
  { label: 'Most Recent', sortBy: 'createdAt', order: 'desc' },
  { label: 'Oldest First', sortBy: 'createdAt', order: 'asc' },
  { label: 'Most Liked', sortBy: 'likesCount', order: 'desc' },
  { label: 'Most Comments', sortBy: 'commentsCount', order: 'desc' },
];
'use client';

import { Moon, Sun } from 'lucide-react';
import { Button } from '@/../components/ui/button';
import { useTheme } from '@/../contexts/theme-context';

export function ThemeToggle() {
  const { toggleTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className="relative h-8 w-8 rounded-full items-center justify-center flex"
    >
      <Sun className="h-4 w-4 rotate-0 block transition-all dark:-rotate-90 dark:hidden" />
      <Moon className="h-4 w-4 rotate-90 hidden transition-all dark:rotate-0 dark:block" />
      <span className="md:hidden text-sm">Toggle theme</span>
    </Button>
  );
} 
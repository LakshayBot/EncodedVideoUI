import React from 'react';
import { Button } from '@/components/ui/button';
import { Sun, Moon, LaptopIcon } from 'lucide-react';
import { useTheme } from '@/components/ThemeProvider';

export function ThemeSwitch({ variant = 'outline' }: { variant?: 'outline' | 'ghost' }) {
    const { theme, setTheme } = useTheme();

    return (
        <div className="flex gap-1">
            <Button
                variant={variant}
                size="icon"
                onClick={() => setTheme("light")}
                className={`rounded-full w-8 h-8 ${theme === 'light' ? 'bg-primary text-primary-foreground' : ''}`}
            >
                <Sun className="h-4 w-4" />
                <span className="sr-only">Light theme</span>
            </Button>

            <Button
                variant={variant}
                size="icon"
                onClick={() => setTheme("dark")}
                className={`rounded-full w-8 h-8 ${theme === 'dark' ? 'bg-primary text-primary-foreground' : ''}`}
            >
                <Moon className="h-4 w-4" />
                <span className="sr-only">Dark theme</span>
            </Button>

            <Button
                variant={variant}
                size="icon"
                onClick={() => setTheme("system")}
                className={`rounded-full w-8 h-8 ${theme === 'system' ? 'bg-primary text-primary-foreground' : ''}`}
            >
                <LaptopIcon className="h-4 w-4" />
                <span className="sr-only">System theme</span>
            </Button>
        </div>
    );
}

export function ThemeToggle() {
    const { theme, setTheme } = useTheme();

    return (
        <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="rounded-full w-8 h-8"
        >
            {theme === 'dark' ? (
                <Sun className="h-4 w-4" />
            ) : (
                <Moon className="h-4 w-4" />
            )}
            <span className="sr-only">Toggle theme</span>
        </Button>
    );
}
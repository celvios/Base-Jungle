import { Moon, Sun } from "lucide-react";

interface ThemeToggleProps {
  theme: "light" | "dark";
  onToggle: () => void;
}

export function ThemeToggle({ theme, onToggle }: ThemeToggleProps) {
  return (
    <button
      onClick={onToggle}
      className="w-10 h-10 bg-white/5 backdrop-blur-md border border-white/10 rounded-full hover:bg-white/10 transition-all flex items-center justify-center"
      data-testid="button-theme-toggle"
      aria-label="Toggle theme"
    >
      {theme === "dark" ? (
        <Sun className="w-5 h-5 text-gray-300 hover:text-white transition-colors" />
      ) : (
        <Moon className="w-5 h-5 text-gray-300 hover:text-white transition-colors" />
      )}
    </button>
  );
}


"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const keys = [
  "QWERTYUIOP".split(""),
  "ASDFGHJKL".split(""),
  "ZXCVBNM".split(""),
];

interface KeyboardProps {
  onKeyClick: (key: string) => void;
  guessedLetters: {
    correct: string[];
    incorrect: string[];
  };
  revealedByHint: string[];
}

export function Keyboard({ onKeyClick, guessedLetters, revealedByHint }: KeyboardProps) {
  return (
    <div className="flex flex-col items-center gap-2">
      {keys.map((row, rowIndex) => (
        <div key={rowIndex} className="flex gap-1 md:gap-2">
          {row.map((key) => {
            const lowerKey = key.toLowerCase();
            const isCorrect = guessedLetters.correct.includes(lowerKey);
            const isIncorrect = guessedLetters.incorrect.includes(lowerKey);
            const isHinted = revealedByHint.includes(lowerKey);
            const isDisabled = isCorrect || isIncorrect || isHinted;

            return (
              <Button
                key={key}
                onClick={() => onKeyClick(key)}
                disabled={isDisabled}
                variant="outline"
                className={cn(
                  "h-10 w-10 md:h-12 md:w-12 p-0 text-lg font-bold uppercase",
                  isCorrect && "bg-[hsl(var(--correct))] hover:bg-[hsl(var(--correct))] text-primary-foreground border-transparent",
                  isIncorrect && "bg-destructive/80 hover:bg-destructive/90 text-destructive-foreground border-destructive/90",
                  isHinted && "bg-blue-500/80 hover:bg-blue-500/90 text-primary-foreground border-blue-600 opacity-50 cursor-not-allowed"
                )}
              >
                {key}
              </Button>
            );
          })}
        </div>
      ))}
    </div>
  );
}

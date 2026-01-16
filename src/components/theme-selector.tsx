'use client';

import { useState } from 'react';
import { WordTheme, WORD_THEMES } from '@/lib/game-data';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface ThemeSelectorProps {
  selectedTheme: WordTheme;
  onThemeChange: (theme: WordTheme) => void;
  isPremium: boolean;
  onUpgradeClick?: () => void;
}

export function ThemeSelector({
  selectedTheme,
  onThemeChange,
  isPremium,
  onUpgradeClick,
}: ThemeSelectorProps) {
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);

  const handleThemeSelect = (value: string) => {
    const theme = value as WordTheme;
    const themeInfo = WORD_THEMES[theme];

    if (themeInfo.premium && !isPremium) {
      setShowUpgradeDialog(true);
      return;
    }

    onThemeChange(theme);
  };

  return (
    <>
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium">Word Theme</label>
        <Select value={selectedTheme} onValueChange={handleThemeSelect}>
          <SelectTrigger className="w-full">
            <SelectValue>
              <div className="flex items-center gap-2">
                <span>{WORD_THEMES[selectedTheme].icon}</span>
                <span>{WORD_THEMES[selectedTheme].name}</span>
              </div>
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {(Object.entries(WORD_THEMES) as [WordTheme, typeof WORD_THEMES[WordTheme]][]).map(
              ([key, theme]) => (
                <SelectItem key={key} value={key}>
                  <div className="flex items-center gap-2 w-full">
                    <span>{theme.icon}</span>
                    <span className="flex-1">{theme.name}</span>
                    {theme.premium && !isPremium && (
                      <Lock className="h-3 w-3 text-muted-foreground" />
                    )}
                  </div>
                </SelectItem>
              )
            )}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          {WORD_THEMES[selectedTheme].description}
        </p>
      </div>

      <Dialog open={showUpgradeDialog} onOpenChange={setShowUpgradeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>🎓 Premium Word Themes</DialogTitle>
            <DialogDescription>
              Unlock themed word generation to focus your learning! Choose from science, history, or geography themes.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-medium">Premium Themes Include:</h4>
              <ul className="space-y-2 text-sm">
                {(Object.entries(WORD_THEMES) as [WordTheme, typeof WORD_THEMES[WordTheme]][])
                  .filter(([_, theme]) => theme.premium)
                  .map(([key, theme]) => (
                    <li key={key} className="flex items-start gap-2 p-2 rounded-lg bg-muted/50">
                      <span className="text-2xl">{theme.icon}</span>
                      <div>
                        <div className="font-medium">{theme.name}</div>
                        <div className="text-muted-foreground text-xs">{theme.description}</div>
                      </div>
                    </li>
                  ))}
              </ul>
            </div>
            <div className="bg-primary/10 p-3 rounded-lg text-sm">
              <p className="font-medium">✨ Premium Benefits:</p>
              <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                <li>• All themed word generation</li>
                <li>• Unlimited hints</li>
                <li>• Ad-free experience</li>
                <li>• Advanced statistics</li>
              </ul>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  setShowUpgradeDialog(false);
                  onUpgradeClick?.();
                }}
                className="flex-1"
                size="lg"
              >
                View Premium Plans
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowUpgradeDialog(false)}
                className="flex-1"
              >
                Maybe Later
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

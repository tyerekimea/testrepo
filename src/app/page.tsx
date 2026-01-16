
'use client';

import { useState, useEffect, useCallback, useMemo, useTransition, useRef } from "react";
import { type WordData, type WordTheme, getRankForScore } from "@/lib/game-data";
import { generateWord } from "@/ai/flows/generate-word-flow";
import { generateImageDescription } from "@/ai/flows/generate-image-description-flow";
import { useHintAction, generateWordWithTheme, updateUserTheme, getUserTheme } from "@/lib/actions";
import { ThemeSelector } from "@/components/theme-selector";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Keyboard } from "@/components/game/keyboard";
import { Lightbulb, RotateCw, XCircle, Award, PartyPopper, Clapperboard, Share, ArrowRight, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useGameSounds } from "@/hooks/use-game-sounds";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"; 
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc, updateDoc, increment, getDoc, serverTimestamp } from "firebase/firestore";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";
import type { UserProfile } from "@/lib/firebase-types";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Progress } from "@/components/ui/progress";
import ShareButton from "@/components/game/share-button";


type GameState = "playing" | "won" | "lost";
type Difficulty = "easy" | "medium" | "hard";
const MAX_INCORRECT_TRIES = 6;

export default function Home() {
  const { user } = useAuth();
  const firestore = useFirestore();
  const [gameState, setGameState] = useState<GameState>("playing");
  const [wordData, setWordData] = useState<WordData | null>(null);
  const [isGameLoading, setIsGameLoading] = useState(true);
  const [guessedLetters, setGuessedLetters] = useState<{ correct: string[]; incorrect: string[] }>({ correct: [], incorrect: [] });
  const [hint, setHint] = useState<string | null>(null);
  const [revealedByHint, setRevealedByHint] = useState<string[]>([]);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [isHintLoading, startHintTransition] = useTransition();
  const [isWatchingAd, setIsWatchingAd] = useState(false);
  const [adProgress, setAdProgress] = useState(0);
  const [visualHint, setVisualHint] = useState<string | null>(null);
  const [isVisualHintLoading, setIsVisualHintLoading] = useState(false);
  const transitionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [selectedTheme, setSelectedTheme] = useState<WordTheme>('current');
  const [isPremium, setIsPremium] = useState(false);

  const { playSound } = useGameSounds();

  const userProfileRef = useMemoFirebase(() => 
    user ? doc(firestore, "userProfiles", user.uid) : null
  , [firestore, user]);
  const { data: userProfile, isLoading: profileLoading } = useDoc<UserProfile>(userProfileRef);
  
  useEffect(() => {
    if(userProfile) {
      setScore(userProfile.totalScore);
      setLevel(userProfile.highestLevel);
    }
  }, [userProfile]);

  const { toast } = useToast();
  
  const getDifficultyForLevel = (level: number): Difficulty => {
    if (level <= 5) return 'easy';
    if (level <= 10) return 'medium';
    return 'hard';
  };

  const startNewGame = useCallback(async (currentLevel: number, currentWord?: string) => {
    console.log('[startNewGame] Starting new game at level:', currentLevel);
    
    // Reset all game state immediately
    setIsGameLoading(true);
    setGameState("playing");
    setGuessedLetters({ correct: [], incorrect: [] });
    setHint(null);
    setRevealedByHint([]);
    setVisualHint(null);
    setWordData(null); // Clear old word data immediately
    
    const difficulty = getDifficultyForLevel(currentLevel);
    let newWordData: WordData | null = null;
    
    try {
        let attempts = 0;
        const maxAttempts = 2; // Reduce from 3 to 2 for faster loading
        while(attempts < maxAttempts) { 
            console.log(`[startNewGame] Attempt ${attempts + 1} to generate word with theme:`, selectedTheme);
            try {
                // Use new word generation with theme and used words tracking
                const result = await generateWordWithTheme({
                    difficulty,
                    theme: selectedTheme,
                    userId: user?.uid || null,
                });
                
                console.log('[startNewGame] Generated word result:', result);
                
                if (!result.success || !result.word) {
                    console.error('[startNewGame] Invalid result from generateWordWithTheme:', result);
                    attempts++;
                    continue;
                }
                
                console.log('[startNewGame] Generated word:', result.word);
                if (result.word.toLowerCase() !== currentWord?.toLowerCase()) {
                    newWordData = { 
                        word: result.word, 
                        definition: result.definition || '', 
                        difficulty,
                        theme: selectedTheme 
                    };
                    break;
                }
                console.log('[startNewGame] Word matches previous, trying again...');
            } catch (genError: any) {
                console.error(`[startNewGame] Attempt ${attempts + 1} failed:`, genError);
                console.error('[startNewGame] Generation error details:', {
                    message: genError?.message,
                    stack: genError?.stack,
                    name: genError?.name
                });
            }
            attempts++;
        }
        if (!newWordData) {
            throw new Error("Failed to generate a new word after 3 attempts.");
        }
    } catch (error: any) {
        console.error("[startNewGame] Failed to generate word:", error);
        console.error("[startNewGame] Error details:", {
            message: error?.message,
            stack: error?.stack,
            name: error?.name
        });
        toast({
            variant: "destructive",
            title: "Word Generation Error",
            description: error?.message || "Could not generate a new word. Please check your connection and API key."
        });
        newWordData = null;
    }

    if(newWordData) {
        console.log('[startNewGame] Setting new word data:', newWordData.word);
        setWordData(newWordData);
    } else {
        console.error('[startNewGame] No word data available, game cannot continue');
    }
    setIsGameLoading(false);
    console.log('[startNewGame] Game loading complete');
  }, [toast, selectedTheme, user]);

  // Load user's theme preference
  useEffect(() => {
    if (user?.uid) {
      getUserTheme(user.uid).then(({ theme, isPremium: premium }) => {
        setSelectedTheme(theme);
        setIsPremium(premium);
      });
    }
  }, [user]);

  useEffect(() => {
    startNewGame(1);
  }, [startNewGame]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (transitionTimeoutRef.current) {
        console.log('[Game] Cleaning up transition timeout on unmount');
        clearTimeout(transitionTimeoutRef.current);
      }
    };
  }, []);


  const handleGuess = useCallback((letter: string) => {
    const lowerLetter = letter.toLowerCase();

    if (gameState !== "playing" || guessedLetters.correct.includes(lowerLetter) || guessedLetters.incorrect.includes(lowerLetter) || revealedByHint.includes(lowerLetter)) {
      return;
    }

    if (wordData?.word.toLowerCase().includes(lowerLetter)) {
      setGuessedLetters(prev => ({ ...prev, correct: [...prev.correct, lowerLetter] }));
      playSound('correct');
    } else {
      setGuessedLetters(prev => ({ ...prev, incorrect: [...prev.incorrect, lowerLetter] }));
      playSound('incorrect');
    }
  }, [wordData, gameState, guessedLetters, playSound, revealedByHint]);

  const getHint = async (isFree: boolean = false) => {
    if (!wordData) return;
    if (!user && !isFree) {
        toast({
            variant: "destructive",
            title: "Login Required",
            description: "You must be logged in to use hints or watch ads.",
        });
        return;
    }
    
    startHintTransition(async () => {
      try {
        console.log('[getHint] Starting hint generation...');
        
        // Add timeout to prevent infinite loading
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Hint generation timed out. Please try again.')), 60000);
        });
        
        const hintPromise = useHintAction({
            userId: user ? user.uid : null,
            word: wordData.word,
            wordLength: wordData.word.length,
            incorrectGuesses: guessedLetters.incorrect.join(''),
            lettersToReveal: revealedByHint.length + 1,
            isFree,
        });
        
        const result = await Promise.race([hintPromise, timeoutPromise]) as any;
        
        console.log('[getHint] Hint result:', result);

        if (result && result.success && result.hint) {
          setHint(result.hint);
          const newHintedLetters = result.hint.split('').filter((char: string) => char !== '_').map((char: string) => char.toLowerCase());
          setRevealedByHint(newHintedLetters);
          playSound('hint');
          console.log('[getHint] Hint applied successfully');
        } else {
           throw new Error(result.message || "Invalid response from server.");
        }
      } catch (error: any) {
         console.error('[getHint] Error:', error);
         toast({
            variant: "destructive",
            title: "Hint Error",
            description: error.message || 'Failed to get a hint. Please try again.',
          });
      }
    });
  };

  const handleRewardedAd = () => {
    if (!user) {
        toast({ variant: "destructive", title: "Login Required", description: "You must log in to watch an ad for a hint."});
        return;
    }
    setIsWatchingAd(true);
    setAdProgress(0);

    const interval = setInterval(() => {
      setAdProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setIsWatchingAd(false);
            getHint(true); 
          }, 500);
          return 100;
        }
        return prev + 10;
      });
    }, 300);
  };

  const getVisualHint = async () => {
    if (!wordData) return;
    setIsVisualHintLoading(true);
    try {
      const result = await generateImageDescription({ word: wordData.word });
      setVisualHint(result.description);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Visual Hint Error",
        description: "Failed to generate visual description.",
      });
    }
    setIsVisualHintLoading(false);
  };

  const displayedWord = useMemo<{ char: string; revealed: boolean }[]>(() => {
    if (!wordData) return [];
    const wordChars = wordData.word.split('');
    return wordChars.map((char: string) => {
      const lowerChar = char.toLowerCase();
      const isGuessed = guessedLetters.correct.includes(lowerChar);
      const isHinted = revealedByHint.includes(lowerChar);
      if (isGuessed || isHinted) {
        return { char, revealed: true };
      }
      return { char, revealed: false };
    });
  }, [wordData, guessedLetters.correct, revealedByHint]);

  const updateFirestoreUser = useCallback(async (scoreGained: number, newLevel: number) => {
    if (user && firestore) {
        const userRef = doc(firestore, "userProfiles", user.uid);
        
        const userDoc = await getDoc(userRef);
        const currentScore = userDoc.data()?.totalScore ?? 0;
        const newTotalScore = currentScore + scoreGained;
        const newRank = getRankForScore(newTotalScore);
        
        const updateData = {
            totalScore: increment(scoreGained),
            highestLevel: newLevel,
            rank: newRank,
            updatedAt: serverTimestamp(),
        };

        updateDoc(userRef, updateData)
          .catch(() => {
                const permissionError = new FirestorePermissionError({
                    path: userRef.path,
                    operation: 'update',
                    requestResourceData: updateData,
                });
                errorEmitter.emit('permission-error', permissionError);
            });
    }
  }, [user, firestore]);

  useEffect(() => {
    if (!wordData) return;
    
    // Only check win/loss conditions when in playing state
    if (gameState !== "playing") return;
  
    const isWon = displayedWord.every(item => item.revealed);
    
    if (isWon) {
      console.log('[Game] Player won! Starting transition to next level...');
      setGameState("won");
      playSound('win');
      
      const difficulty = getDifficultyForLevel(level);
      const scoreGained = (difficulty === 'easy' ? 10 : difficulty === 'medium' ? 20 : 30);
      
      const newLevel = level + 1;
      if (user) {
        updateFirestoreUser(scoreGained, newLevel);
      }
      setScore(s => s + scoreGained);
      
      console.log(`[Game] Player won! Waiting for user to continue...`);
      
      // Don't auto-advance - let user click "Next Level" button
      // The button will call startNewGame manually
  
    } else if (guessedLetters.incorrect.length >= MAX_INCORRECT_TRIES) {
      setGameState("lost");
      playSound('incorrect');
    }
  }, [guessedLetters, wordData, level, playSound, startNewGame, updateFirestoreUser, gameState, displayedWord, user]);

  const gameContent = () => {
    if (isGameLoading || !wordData) {
        return <div className="text-center p-8 animate-pulse">Loading your next case...</div>;
    }

    const incorrectTriesLeft = MAX_INCORRECT_TRIES - guessedLetters.incorrect.length;
    const allLettersGuessed = wordData && displayedWord.every(item => item.revealed);
    const hintDisabled = isHintLoading || allLettersGuessed || !user || profileLoading;

    const shareText = "I'm playing Definition Detective! Can you beat my high score?";

    return (
        <div className="w-full max-w-4xl mx-auto space-y-8">
          <div className="flex justify-between items-center">
              <div className="flex items-center gap-2 text-lg">
              <Award className="h-6 w-6 text-primary" />
              Score: <span className="font-bold">{(user ? score : 0).toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-2 text-lg">
              <Lightbulb className="h-6 w-6 text-yellow-400" />
              Hints: <span className="font-bold">{profileLoading ? '...' : userProfile?.hints ?? 0}</span>
              </div>
              <div className="flex items-center gap-2 text-lg">
              Level: <span className="font-bold">{user ? level : 1}</span>
              </div>
          </div>

          <Card>
              <CardHeader>
              <CardTitle className="text-center">Definition</CardTitle>
              </CardHeader>
              <CardContent>
              <p className="text-center text-lg italic text-muted-foreground p-4 bg-muted/50 rounded-md">{wordData.definition}</p>
              </CardContent>
          </Card>

          {visualHint && (
            <Card className="bg-muted/30 border-dashed">
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Visual Clue</CardTitle></CardHeader>
              <CardContent>
                <p className="italic">{visualHint}</p>
              </CardContent>
            </Card>
          )}

          <div className="flex justify-center items-center gap-2 md:gap-4 my-8">
              {displayedWord.map(({ char, revealed }, index) => (
              <div key={index} className="flex items-center justify-center h-12 w-12 md:h-16 md:w-16 border-b-4 border-primary text-3xl md:text-4xl font-bold uppercase bg-muted/30 rounded-md">
                  {revealed && <span className="animate-in fade-in zoom-in-50 duration-500">{char}</span>}
              </div>
              ))}
          </div>
          
          {(gameState === "won" || gameState === "lost") ? (
              <Alert variant={gameState === 'won' ? 'default' : 'destructive'} className="text-center">
              {gameState === 'won' ? <PartyPopper className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
              <AlertTitle className="text-2xl font-bold">
                  {gameState === 'won' ? "You solved it!" : "Case closed... incorrectly."}
              </AlertTitle>
              <AlertDescription>
                  {gameState === 'won' ? (
                    <>
                      The word was "{wordData?.word}". 
                      {isGameLoading ? ' Loading next case...' : ' Ready for next case!'}
                    </>
                  ) : (
                    `The word was "${wordData?.word}". Better luck next time.`
                  )}
              </AlertDescription>

              <div className="mt-4 flex justify-center gap-4">
                  {gameState === 'won' && (
                      <Button 
                        onClick={() => {
                          console.log('[Next Case Button] Clicked, current level:', level);
                          const newLevel = level + 1;
                          console.log('[Next Case Button] Setting new level:', newLevel);
                          setLevel(newLevel);
                          setGameState("playing");
                          console.log('[Next Case Button] Calling startNewGame');
                          startNewGame(newLevel, wordData?.word);
                        }}
                        disabled={isGameLoading}
                      >
                          {isGameLoading ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Loading...
                            </>
                          ) : (
                            <>
                              <ArrowRight className="mr-2 h-4 w-4" />
                              Next Case
                            </>
                          )}
                      </Button>
                  )}
                  {gameState === 'lost' && (
                      <Button onClick={() => {
                        console.log('[Retry Button] Clicked, retrying level:', level);
                        setGameState("playing");
                        startNewGame(level, wordData?.word);
                      }}>
                          <RotateCw className="mr-2 h-4 w-4" /> Retry Level
                      </Button>
                  )}
              </div>
              </Alert>
          ) : (
              <>
              <div className="flex flex-wrap justify-center gap-4">
                  <Button onClick={() => getHint(false)} disabled={hintDisabled}>
                  <Lightbulb className={cn("mr-2 h-4 w-4", isHintLoading && !isWatchingAd && "animate-spin")} />
                  {isHintLoading && !isWatchingAd ? 'Getting Hint...' : 'Use a Hint'}
                  </Button>
                  <Button onClick={handleRewardedAd} disabled={isHintLoading || allLettersGuessed} variant="outline">
                  <Clapperboard className={cn("mr-2 h-4 w-4", isWatchingAd && "animate-spin")} />
                  {isWatchingAd ? 'Loading Ad...' : 'Watch Ad for Hint'}
                  </Button>
                  <Button onClick={getVisualHint} disabled={isVisualHintLoading || !!visualHint} variant="secondary">
                    <Share className={cn("mr-2 h-4 w-4", isVisualHintLoading && "animate-spin")} />
                    {isVisualHintLoading ? 'Generating...' : 'Visual Clue'}
                  </Button>
              </div>
              {!user && <p className="text-center text-sm text-muted-foreground">Please log in to use hints and save progress.</p>}
              <p className="text-center text-muted-foreground">Incorrect Guesses: {guessedLetters.incorrect.join(', ').toUpperCase()} ({incorrectTriesLeft} left)</p>
              <Keyboard onKeyClick={handleGuess} guessedLetters={guessedLetters} revealedByHint={revealedByHint} />
              </>
          )}

          <div className="mt-12 pt-8 border-t border-dashed">
              <p className="text-sm font-medium flex items-center justify-center gap-2 mb-4 text-muted-foreground"><Share className="h-4 w-4" /> Share The Game!</p>
              <div className="flex justify-center gap-2">
              <ShareButton platform="whatsapp" text={shareText} />
              <ShareButton platform="facebook" text={shareText} />
              <ShareButton platform="x" text={shareText} />
              </div>
          </div>
        </div>
    );
  }

  return (
    <div className="container mx-auto flex flex-col items-center justify-center gap-8 py-8 md:py-12">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight text-primary sm:text-5xl lg:text-6xl font-headline">
          Definition Detective
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-foreground/80">
          Unscramble the definition and guess the word. Put your vocabulary to the test!
        </p>
      </div>

      {/* Theme Selector */}
      {user && (
        <div className="w-full max-w-md">
          <ThemeSelector
            selectedTheme={selectedTheme}
            onThemeChange={async (theme) => {
              setSelectedTheme(theme);
              if (user?.uid) {
                await updateUserTheme({ userId: user.uid, theme });
                // Restart game with new theme
                await startNewGame(level);
              }
            }}
            isPremium={isPremium}
            onUpgradeClick={() => {
              // Navigate to subscription page with Paystack payment
              window.location.href = '/subscribe';
            }}
          />
        </div>
      )}

      {gameContent()}
      
      <AlertDialog open={isWatchingAd}>
        <AlertDialogContent>
            <AlertDialogHeader>
            <AlertDialogTitle>Your hint is sponsored by...</AlertDialogTitle>
            <AlertDialogDescription>
                This ad will finish shortly. Thanks for your support!
            </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="flex flex-col items-center justify-center space-y-4 py-8">
            <div className="w-full h-32 bg-muted rounded-md flex items-center justify-center">
                <p className="text-muted-foreground">Video Ad Simulation</p>
            </div>
            <Progress value={adProgress} className="w-full" />
            </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

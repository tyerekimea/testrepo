
"use client";

import { useState, useEffect, useCallback, useMemo, useTransition } from "react";
import { getWordByDifficulty, type WordData, getRankForScore } from "@/lib/game-data";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Keyboard } from "@/components/game/keyboard";
import { Lightbulb, RotateCw, XCircle, Award, PartyPopper, Clapperboard, Share } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getHintAction, getSoundAction } from "@/lib/actions";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc, updateDoc, increment, getDoc } from "firebase/firestore";
import { useSound } from "@/hooks/use-sound";
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
import { Facebook, Twitter } from "lucide-react";

type GameState = "playing" | "won" | "lost";
type Difficulty = "easy" | "medium" | "hard";
const MAX_INCORRECT_TRIES = 6;

type SoundMap = {
  [key: string]: string | null;
}

const ShareButton = ({ platform, text, url }: { platform: 'whatsapp' | 'facebook' | 'x', text: string, url: string }) => {
  const platforms = {
    whatsapp: {
      url: `https://api.whatsapp.com/send?text=${encodeURIComponent(text + ' ' + url)}`,
      icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>,
      label: "WhatsApp"
    },
    facebook: {
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(text)}`,
      icon: <Facebook className="h-4 w-4" />,
      label: "Facebook"
    },
    x: {
      url: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
      icon: <Twitter className="h-4 w-4" />,
      label: "X"
    }
  }

  const handleShare = () => {
    window.open(platforms[platform].url, '_blank');
  }

  return (
    <Button onClick={handleShare} variant="outline" size="sm">
      {platforms[platform].icon}
      <span className="ml-2">{platforms[platform].label}</span>
    </Button>
  )
}

export default function GameClient() {
  const { user } = useAuth();
  const firestore = useFirestore();
  const [gameState, setGameState] = useState<GameState>("playing");
  const [wordData, setWordData] = useState<WordData | null>(null);
  const [definition, setDefinition] = useState<string>("");
  const [guessedLetters, setGuessedLetters] = useState<{ correct: string[]; incorrect: string[] }>({ correct: [], incorrect: [] });
  const [hint, setHint] = useState<string | null>(null);
  const [revealedByHint, setRevealedByHint] = useState<string[]>([]);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [isHintLoading, startHintTransition] = useTransition();
  const [isWatchingAd, setIsWatchingAd] = useState(false);
  const [adProgress, setAdProgress] = useState(0);
  const [appUrl, setAppUrl] = useState("");

  const [sounds, setSounds] = useState<SoundMap>({});
  const { playSound } = useSound();

  const userProfileRef = useMemoFirebase(() => 
    user ? doc(firestore, "userProfiles", user.uid) : null
  , [firestore, user]);
  const { data: userProfile } = useDoc<UserProfile>(userProfileRef);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setAppUrl(window.location.origin);
    }
  }, []);
  
  useEffect(() => {
    if(userProfile) {
      setScore(userProfile.totalScore);
      setLevel(userProfile.highestLevel);
    }
  }, [userProfile]);

  useEffect(() => {
    const fetchSounds = async () => {
      const soundKeys = ['correct', 'incorrect', 'win'];
      const soundPromises = soundKeys.map(key => getSoundAction(key));
      const results = await Promise.all(soundPromises);
      const newSounds: SoundMap = {};
      results.forEach((result, index) => {
        if (result.soundDataUri) {
          newSounds[soundKeys[index]] = result.soundDataUri;
        }
      });
      setSounds(newSounds);
    };
    fetchSounds();
  }, []);

  const { toast } = useToast();

  const getDifficultyForLevel = (level: number): Difficulty => {
    if (level <= 5) return 'easy';
    if (level <= 10) return 'medium';
    return 'hard';
  };

  const startNewGame = useCallback((currentLevel: number, currentWord?: string) => {
    const difficulty = getDifficultyForLevel(currentLevel);
    let newWordData: WordData;
    do {
      newWordData = getWordByDifficulty(difficulty);
    } while (newWordData.word === currentWord);
    
    setWordData(newWordData);
    setDefinition(newWordData.definition);
    setGuessedLetters({ correct: [], incorrect: [] });
    setHint(null);
    setRevealedByHint([]);
    setGameState("playing");
  }, []);

  useEffect(() => {
    startNewGame(level);
  }, [level, startNewGame]);

  const handleGuess = useCallback((letter: string) => {
    if (gameState !== "playing" || guessedLetters.correct.includes(letter) || guessedLetters.incorrect.includes(letter) || revealedByHint.includes(letter.toLowerCase())) {
      return;
    }

    const lowerLetter = letter.toLowerCase();
    if (wordData?.word.toLowerCase().includes(lowerLetter)) {
      setGuessedLetters(prev => ({ ...prev, correct: [...prev.correct, lowerLetter] }));
      if (sounds.correct) playSound(sounds.correct);
    } else {
      setGuessedLetters(prev => ({ ...prev, incorrect: [...prev.incorrect, lowerLetter] }));
      if (sounds.incorrect) playSound(sounds.incorrect);
    }
  }, [wordData, gameState, guessedLetters, sounds, playSound, revealedByHint]);

  const getHint = async (isFree: boolean = false) => {
    if (!wordData || !userProfileRef) return;
    
    if (!isFree) {
      if (userProfile && userProfile.hints > 0) {
         updateDoc(userProfileRef, { hints: increment(-1) }).catch((err) => console.error(err));
      } else {
        toast({
          variant: "destructive",
          title: "Out of Hints",
          description: "You don't have any hints left. Watch an ad or buy more in the store.",
        });
        return;
      }
    }

    startHintTransition(async () => {
      const lettersToRevealCount = revealedByHint.length + 2;
      const { hint: newHint, error } = await getHintAction({
        word: wordData.word,
        incorrectGuesses: guessedLetters.incorrect.join(''),
        lettersToReveal: lettersToRevealCount,
      });

      if (error) {
        toast({
          variant: "destructive",
          title: "Hint Error",
          description: error,
        });
         // If AI fails, refund the hint
        if (!isFree) {
          updateDoc(userProfileRef, { hints: increment(1) }).catch((err) => console.error(err));
        }
      } else if (newHint) {
        setHint(newHint);
        const newHintedLetters = newHint.split('').filter(char => char !== '_').map(char => char.toLowerCase());
        setRevealedByHint(newHintedLetters);
      }
    });
  };

  const handleRewardedAd = () => {
    setIsWatchingAd(true);
    setAdProgress(0);

    const interval = setInterval(() => {
      setAdProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setIsWatchingAd(false);
            getHint(true); // Grant a free hint
          }, 500);
          return 100;
        }
        return prev + 10;
      });
    }, 300);
  };

  const displayedWord = useMemo(() => {
    if (!wordData) return [];
    const wordChars = wordData.word.split('');
    return wordChars.map((char, index) => {
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
        
        // We need to get the current score to calculate the new rank
        const userDoc = await getDoc(userRef);
        const currentScore = userDoc.data()?.totalScore ?? 0;
        const newTotalScore = currentScore + scoreGained;
        const newRank = getRankForScore(newTotalScore);
        
        const updateData = {
            totalScore: increment(scoreGained),
            highestLevel: newLevel,
            rank: newRank,
            updatedAt: new Date().toISOString(),
        };

        updateDoc(userRef, updateData)
            .catch((serverError) => {
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
    if (!wordData || gameState !== "playing") return;
  
    const isWon = displayedWord.every(item => item.revealed);
    
    if (isWon) {
      setGameState("won");
      if (sounds.win) playSound(sounds.win);
      
      const difficulty = getDifficultyForLevel(level);
      const scoreGained = (difficulty === 'easy' ? 10 : difficulty === 'medium' ? 20 : 30);
      
      const newLevel = level + 1;
      updateFirestoreUser(scoreGained, newLevel);
      setScore(s => s + scoreGained);
      
      setTimeout(() => {
        setLevel(newLevel);
        startNewGame(newLevel, wordData.word);
      }, 3000);
  
    } else if (guessedLetters.incorrect.length >= MAX_INCORRECT_TRIES) {
      setGameState("lost");
    }
  }, [guessedLetters, wordData, level, sounds, playSound, startNewGame, updateFirestoreUser, gameState, displayedWord, hint, revealedByHint]);

  const incorrectTriesLeft = MAX_INCORRECT_TRIES - guessedLetters.incorrect.length;
  const allLettersGuessed = wordData && (wordData.word.length === (guessedLetters.correct.length + revealedByHint.length));
  const hintDisabled = isHintLoading || allLettersGuessed || !user || (userProfile?.hints ?? 0) === 0;

  const shareText = "I'm playing Definition Detective! Can you beat my high score?";

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2 text-lg">
          <Award className="h-6 w-6 text-primary" />
          Score: <span className="font-bold">{score.toLocaleString()}</span>
        </div>
        <div className="flex items-center gap-2 text-lg">
          <Lightbulb className="h-6 w-6 text-yellow-400" />
          Hints: <span className="font-bold">{userProfile?.hints ?? 0}</span>
        </div>
        <div className="flex items-center gap-2 text-lg">
          Level: <span className="font-bold">{level}</span>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-center">Definition</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-lg italic text-muted-foreground p-4 bg-muted/50 rounded-md">{definition}</p>
        </CardContent>
      </Card>

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
            {gameState === 'won' ? `The word was "${wordData?.word}". Loading next case...` : `The word was "${wordData?.word}". Better luck next time.`}
          </AlertDescription>

          {gameState === 'lost' && (
             <div className="mt-4 flex justify-center gap-4">
                <Button onClick={() => startNewGame(level, wordData?.word)}>
                    <RotateCw className="mr-2 h-4 w-4" /> Retry Level
                </Button>
            </div>
          )}
        </Alert>
      ) : (
        <>
          <div className="flex justify-center gap-4">
            <Button onClick={() => getHint(false)} disabled={hintDisabled}>
              <Lightbulb className={cn("mr-2 h-4 w-4", isHintLoading && !isWatchingAd && "animate-spin")} />
              {isHintLoading && !isWatchingAd ? 'Getting Hint...' : 'Use a Hint'}
            </Button>
             <Button onClick={handleRewardedAd} disabled={isHintLoading || allLettersGuessed || !user} variant="outline">
              <Clapperboard className={cn("mr-2 h-4 w-4", isWatchingAd && "animate-spin")} />
              {isWatchingAd ? 'Loading Ad...' : 'Watch Ad for Hint'}
            </Button>
          </div>
          {!user && <p className="text-center text-destructive text-sm">Please log in to use hints and save progress.</p>}
          <p className="text-center text-muted-foreground">Incorrect Guesses: {guessedLetters.incorrect.join(', ').toUpperCase()} ({incorrectTriesLeft} left)</p>
          <Keyboard onKeyClick={handleGuess} guessedLetters={guessedLetters} revealedByHint={revealedByHint} />
        </>
      )}

      <div className="mt-12 pt-8 border-t border-dashed">
        <p className="text-sm font-medium flex items-center justify-center gap-2 mb-4 text-muted-foreground"><Share className="h-4 w-4" /> Share The Game!</p>
        <div className="flex justify-center gap-2">
          <ShareButton platform="whatsapp" text={shareText} url={appUrl} />
          <ShareButton platform="facebook" text={shareText} url={appUrl} />
          <ShareButton platform="x" text={shareText} url={appUrl} />
        </div>
      </div>

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

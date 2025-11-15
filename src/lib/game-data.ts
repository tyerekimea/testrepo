export type WordData = {
  word: string;
  definition: string;
  difficulty: 'easy' | 'medium' | 'hard';
};

// This static list is no longer used for gameplay but is kept as a fallback or for reference.
export const wordList: WordData[] = [
  // Detective/Mystery Theme
  { word: "mystery", definition: "Something that is difficult or impossible to understand or explain.", difficulty: "easy" },
  { word: "detective", definition: "A person, especially a police officer, whose occupation is to investigate and solve crimes.", difficulty: "easy" },
  { word: "puzzle", definition: "A game, toy, or problem designed to test ingenuity or knowledge.", difficulty: "easy" },
  { word: "solution", definition: "A means of solving a problem or dealing with a difficult situation.", difficulty: 'easy' },
  { word: 'evidence', definition: 'The available body of facts or information indicating whether a belief or proposition is true or valid.', difficulty: 'easy' },
  { word: "enigma", definition: "A person or thing that is mysterious, puzzling, or difficult to understand.", difficulty: "medium" },
  { word: "conundrum", definition: "A confusing and difficult problem or question.", difficulty: "medium" },
  { word: "investigate", definition: "Carry out a systematic or formal inquiry to discover and examine the facts of (an incident, allegation, etc.) so as to establish the truth.", difficulty: 'medium' },
  { word: 'alibi', definition: 'A claim or piece of evidence that one was elsewhere when an act, typically a criminal one, is alleged to have taken place.', difficulty: 'medium' },
  { word: 'deduction', definition: 'The action of deducting or subtracting something.', difficulty: 'medium'},
  { word: "paradox", definition: "A seemingly absurd or self-contradictory statement or proposition that when investigated or explained may prove to be well founded or true.", difficulty: "hard" },
  { word: "cryptic", definition: "Having a meaning that is mysterious or obscure.", difficulty: "hard" },
  { word: 'forensic', definition: 'Relating to or denoting the application of scientific methods and techniques to the investigation of crime.', difficulty: 'hard' },
  { word: 'interrogation', definition: 'The action of interrogating or the process of being interrogated.', difficulty: 'hard' },
  { word: 'obfuscate', definition: 'To deliberately make something unclear or difficult to understand.', difficulty: 'hard' },
];

export const getRankForScore = (score: number): string => {
  if (score < 100) return "Rookie Detective";
  if (score < 500) return "Junior Investigator";
  if (score < 1000) return "Seasoned Sleuth";
  if (score < 2000) return "Master Detective";
  return "Legendary Detective";
};

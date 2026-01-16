import { wordList, getRankForScore } from '../game-data';

describe('game-data', () => {
  describe('wordList', () => {
    it('should have properly formatted definitions', () => {
      wordList.forEach((wordData) => {
        // Check that definitions don't have scrambled word patterns
        // Scrambled text typically has multiple single letters followed by spaces
        const scrambledPattern = /\b\w\s+\w\s+\w\b/;
        expect(wordData.definition).not.toMatch(scrambledPattern);
        
        // Check that definitions start with a capital letter
        expect(wordData.definition[0]).toMatch(/[A-Z]/);
        
        // Check that definitions end with a period
        expect(wordData.definition).toMatch(/\.$/);
        
        // Check that word is lowercase
        expect(wordData.word).toBe(wordData.word.toLowerCase());
      });
    });

    it('should have valid difficulty levels', () => {
      const validDifficulties = ['easy', 'medium', 'hard'];
      wordList.forEach((wordData) => {
        expect(validDifficulties).toContain(wordData.difficulty);
      });
    });

    it('should have non-empty words and definitions', () => {
      wordList.forEach((wordData) => {
        expect(wordData.word.length).toBeGreaterThan(0);
        expect(wordData.definition.length).toBeGreaterThan(0);
      });
    });
  });

  describe('getRankForScore', () => {
    it('should return correct rank for score ranges', () => {
      expect(getRankForScore(0)).toBe('Rookie Detective');
      expect(getRankForScore(50)).toBe('Rookie Detective');
      expect(getRankForScore(99)).toBe('Rookie Detective');
      
      expect(getRankForScore(100)).toBe('Junior Investigator');
      expect(getRankForScore(250)).toBe('Junior Investigator');
      expect(getRankForScore(499)).toBe('Junior Investigator');
      
      expect(getRankForScore(500)).toBe('Seasoned Sleuth');
      expect(getRankForScore(750)).toBe('Seasoned Sleuth');
      expect(getRankForScore(999)).toBe('Seasoned Sleuth');
      
      expect(getRankForScore(1000)).toBe('Master Detective');
      expect(getRankForScore(1500)).toBe('Master Detective');
      expect(getRankForScore(1999)).toBe('Master Detective');
      
      expect(getRankForScore(2000)).toBe('Legendary Detective');
      expect(getRankForScore(5000)).toBe('Legendary Detective');
      expect(getRankForScore(10000)).toBe('Legendary Detective');
    });
  });
});

import { BuiltinWordList } from '../types';

const topSchoolsWords: string[] = require('../../assets/lists/top-schools.json');
const grade1MinimumWords: string[] = require('../../assets/lists/grade-1-minimum.json');
const grade2CommonWords: string[] = require('../../assets/lists/grade-2-common.json');
const grade3ChallengeWords: string[] = require('../../assets/lists/grade-3-challenge.json');
const sightWordsK1Words: string[] = require('../../assets/lists/sight-words-k1.json');
const animalsWords: string[] = require('../../assets/lists/animals.json');

export const BUILTIN_LISTS: BuiltinWordList[] = [
  {
    id: 'sight-words-k1',
    name: 'Sight Words K1',
    type: 'builtin',
    words: sightWordsK1Words,
    wordCount: sightWordsK1Words.length,
  },
  {
    id: 'grade-1-minimum',
    name: 'Grade 1 Minimum',
    type: 'builtin',
    words: grade1MinimumWords,
    wordCount: grade1MinimumWords.length,
  },
  {
    id: 'grade-2-common',
    name: 'Grade 2 Common',
    type: 'builtin',
    words: grade2CommonWords,
    wordCount: grade2CommonWords.length,
  },
  {
    id: 'grade-3-challenge',
    name: 'Grade 3 Challenge',
    type: 'builtin',
    words: grade3ChallengeWords,
    wordCount: grade3ChallengeWords.length,
  },
  {
    id: 'top-schools',
    name: 'Top Schools',
    type: 'builtin',
    words: topSchoolsWords,
    wordCount: topSchoolsWords.length,
  },
  {
    id: 'animals',
    name: 'Animals',
    type: 'builtin',
    words: animalsWords,
    wordCount: animalsWords.length,
  },
];

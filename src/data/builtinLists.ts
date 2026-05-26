import { BuiltinWordList } from '../types';

const topSchoolsWords: string[] = require('../../assets/lists/top-schools.json');
const grade1MinimumWords: string[] = require('../../assets/lists/grade-1-minimum.json');
const grade2CommonWords: string[] = require('../../assets/lists/grade-2-common.json');
const grade3ChallengeWords: string[] = require('../../assets/lists/grade-3-challenge.json');
const sightWordsK1Words: string[] = require('../../assets/lists/sight-words-k1.json');
const animalsWords: string[] = require('../../assets/lists/animals.json');

// Blitz sets
const blitzEasy = require('../../assets/lists/blitz-easy.json');
const blitzMedium = require('../../assets/lists/blitz-medium.json');
const blitzHard = require('../../assets/lists/blitz-hard.json');

// Grade folders
const gradeK1Easy = require('../../assets/lists/grade-k1-easy.json');
const gradeK2Easy = require('../../assets/lists/grade-k2-easy.json');
const gradeP1Easy = require('../../assets/lists/grade-p1-easy.json');
const gradeP2Easy = require('../../assets/lists/grade-p2-easy.json');
const gradeP3Easy = require('../../assets/lists/grade-p3-easy.json');
const gradeP4Easy = require('../../assets/lists/grade-p4-easy.json');
const gradeP5Easy = require('../../assets/lists/grade-p5-easy.json');
const gradeP6Easy = require('../../assets/lists/grade-p6-easy.json');

export const BLITZ_LISTS: BuiltinWordList[] = [
  {
    id: blitzEasy.id,
    name: blitzEasy.name,
    type: 'builtin',
    words: blitzEasy.words,
    wordCount: blitzEasy.wordCount,
  },
  {
    id: blitzMedium.id,
    name: blitzMedium.name,
    type: 'builtin',
    words: blitzMedium.words,
    wordCount: blitzMedium.wordCount,
  },
  {
    id: blitzHard.id,
    name: blitzHard.name,
    type: 'builtin',
    words: blitzHard.words,
    wordCount: blitzHard.wordCount,
  },
];

export const GRADE_LISTS: Record<string, BuiltinWordList[]> = {
  K1: [
    {
      id: gradeK1Easy.id,
      name: gradeK1Easy.name,
      type: 'builtin',
      words: gradeK1Easy.words,
      wordCount: gradeK1Easy.wordCount,
    },
  ],
  K2: [
    {
      id: gradeK2Easy.id,
      name: gradeK2Easy.name,
      type: 'builtin',
      words: gradeK2Easy.words,
      wordCount: gradeK2Easy.wordCount,
    },
  ],
  P1: [
    {
      id: gradeP1Easy.id,
      name: gradeP1Easy.name,
      type: 'builtin',
      words: gradeP1Easy.words,
      wordCount: gradeP1Easy.wordCount,
    },
  ],
  P2: [
    {
      id: gradeP2Easy.id,
      name: gradeP2Easy.name,
      type: 'builtin',
      words: gradeP2Easy.words,
      wordCount: gradeP2Easy.wordCount,
    },
  ],
  P3: [
    {
      id: gradeP3Easy.id,
      name: gradeP3Easy.name,
      type: 'builtin',
      words: gradeP3Easy.words,
      wordCount: gradeP3Easy.wordCount,
    },
  ],
  P4: [
    {
      id: gradeP4Easy.id,
      name: gradeP4Easy.name,
      type: 'builtin',
      words: gradeP4Easy.words,
      wordCount: gradeP4Easy.wordCount,
    },
  ],
  P5: [
    {
      id: gradeP5Easy.id,
      name: gradeP5Easy.name,
      type: 'builtin',
      words: gradeP5Easy.words,
      wordCount: gradeP5Easy.wordCount,
    },
  ],
  P6: [
    {
      id: gradeP6Easy.id,
      name: gradeP6Easy.name,
      type: 'builtin',
      words: gradeP6Easy.words,
      wordCount: gradeP6Easy.wordCount,
    },
  ],
};

export const ALL_GRADE_LISTS: BuiltinWordList[] = Object.values(GRADE_LISTS).flat();

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
  ...BLITZ_LISTS,
  ...ALL_GRADE_LISTS,
];

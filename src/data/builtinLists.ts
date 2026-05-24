import { BuiltinWordList } from '../types';

const topSchoolsWords: string[] = require('../../assets/lists/top-schools.json');
const grade1MinimumWords: string[] = require('../../assets/lists/grade-1-minimum.json');

export const BUILTIN_LISTS: BuiltinWordList[] = [
  {
    id: 'top-schools',
    name: 'Top Schools',
    type: 'builtin',
    words: topSchoolsWords,
    wordCount: topSchoolsWords.length,
  },
  {
    id: 'grade-1-minimum',
    name: 'Grade 1 Minimum',
    type: 'builtin',
    words: grade1MinimumWords,
    wordCount: grade1MinimumWords.length,
  },
];

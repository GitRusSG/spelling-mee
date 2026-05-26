// Basic profanity word list — catches common inappropriate words
const PROFANITY_LIST = [
  'ass', 'bastard', 'bitch', 'bloody', 'bollocks', 'bugger', 'crap',
  'damn', 'dick', 'fuck', 'hell', 'idiot', 'jerk', 'piss', 'prick',
  'shit', 'slut', 'stupid', 'twat', 'wanker', 'whore',
];

/**
 * Checks if a word contains profanity.
 * Returns true if the word is inappropriate.
 */
export function containsProfanity(word: string): boolean {
  const lower = word.toLowerCase().trim();
  return PROFANITY_LIST.some(bad => lower.includes(bad));
}

/**
 * Checks if a list name contains profanity.
 */
export function nameContainsProfanity(name: string): boolean {
  const lower = name.toLowerCase().trim();
  return PROFANITY_LIST.some(bad => lower.includes(bad));
}

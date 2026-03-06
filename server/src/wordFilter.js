const badWords = [
  'fuck', 'shit', 'damn', 'ass', 'bitch', 'bastard', 'crap',
  'dick', 'piss', 'hell', 'slut', 'whore', 'fag', 'nigger',
  'retard', 'cunt', 'cock', 'pussy'
];

const pattern = new RegExp(
  badWords.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'),
  'gi'
);

export function filterMessage(text) {
  return text.replace(pattern, match => '*'.repeat(match.length));
}

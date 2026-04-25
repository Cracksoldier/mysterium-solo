import { GameSession } from '../models/game-session.model';
import { EvidenceCard, VisionCard } from '../models/card.model';

export function renderMarkdown(
  session: GameSession,
  evidenceCards: EvidenceCard[],
  visionCards: VisionCard[]
): string {
  const find = (id: string) => evidenceCards.find(c => c.id === id);
  const findV = (id: string) => visionCards.find(v => v.id === id);
  const date = new Date(session.createdAt).toLocaleDateString('en-GB', { dateStyle: 'long' });

  const lines: string[] = [
    `# Mysterium Solo — Session Report`,
    `**Date:** ${date}`,
    `**Title:** ${session.title}`,
    `**Difficulty:** ${cap(session.difficulty)}`,
    `**Outcome:** ${session.outcome ? session.outcome.toUpperCase() : 'IN PROGRESS'}`,
    '',
    '---',
    '',
    '## Players',
    ...session.psychics.map(p => `- ${p.name}`),
    '',
  ];

  for (const psychic of session.psychics) {
    const sol = session.solution[psychic.id];
    lines.push(
      `## Solution for ${psychic.name}`,
      `- **Suspect:** ${find(sol.suspect)?.name ?? sol.suspect}`,
      `- **Location:** ${find(sol.location)?.name ?? sol.location}`,
      `- **Weapon:** ${find(sol.weapon)?.name ?? sol.weapon}`,
      ''
    );
  }

  lines.push('---', '', '## Round-by-Round Log', '');

  for (const entry of session.log) {
    const psychic = session.psychics.find(p => p.id === entry.psychicId);
    const guess = entry.guess ? find(entry.guess) : null;
    const result = entry.correct === true ? '✓' : entry.correct === false ? '✗ (incorrect — 1 round used)' : '(vote)';
    lines.push(
      `### Round ${entry.round} — ${cap(entry.target)} Clue for ${psychic?.name}`,
      '**Vision Cards Shown:**',
      ...entry.cardsShown.map(id => {
        const vc = findV(id);
        return vc ? `- *${vc.title}* — ${vc.scene}` : `- ${id}`;
      }),
      '',
      `**Guess:** ${guess?.name ?? entry.guess ?? 'None'} ${result}`,
      ''
    );
  }

  if (session.phase === 'final' || session.phase === 'result') {
    lines.push('---', '', '## Final Phase');
    if (session.finalVisionCards) {
      lines.push(
        '**Final Vision Cards:**',
        `- Suspect: *${findV(session.finalVisionCards.suspect)?.title ?? session.finalVisionCards.suspect}*`,
        `- Location: *${findV(session.finalVisionCards.location)?.title ?? session.finalVisionCards.location}*`,
        `- Weapon: *${findV(session.finalVisionCards.weapon)?.title ?? session.finalVisionCards.weapon}*`,
        ''
      );
    }
  }

  const totalRounds = session.round;
  const totalIncorrect = session.psychics.reduce((s, p) => s + p.incorrectGuesses, 0);
  const totalCardsSeen = new Set(session.log.flatMap(e => e.cardsShown)).size;

  lines.push(
    '---',
    '',
    '## Statistics',
    `- Rounds used: ${totalRounds} / 7`,
    `- Incorrect guesses: ${totalIncorrect}`,
    `- Vision cards seen: ${totalCardsSeen}`,
    ''
  );

  return lines.join('\n');
}

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

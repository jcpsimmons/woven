import { analyzeStory } from '../src/analyzer';
import { Story } from '../src/types';

describe('Analyzer', () => {
  it('should detect dead ends', () => {
    const deadEndStory: Story = {
      version: 1,
      entryKnot: 'intro',
      knots: {
        intro: {
          id: 'intro',
          entryNode: 'start',
          nodes: {
            start: {
              id: 'start',
              text: 'Start',
              choices: [{ id: 'go', label: 'Go', target: { node: 'dead' } }],
            },
            dead: {
              id: 'dead',
              text: 'This is a dead end.',
              // No choices, no ending
            },
          },
        },
      },
    };

    const res = analyzeStory(deadEndStory);
    const issue = res.issues.find((i) => i.code === 'DEAD_END');
    expect(issue).toBeDefined();
    expect(issue?.pathExample).toContain('dead');
  });

  it('should detect unreachable nodes', () => {
    const unreachableStory: Story = {
      version: 1,
      entryKnot: 'intro',
      knots: {
        intro: {
          id: 'intro',
          entryNode: 'start',
          nodes: {
            start: {
              id: 'start',
              text: 'Start',
              ending: { id: 'end' },
            },
            hidden: {
              id: 'hidden',
              text: "Can't get here.",
            },
          },
        },
      },
    };

    const res = analyzeStory(unreachableStory);
    const issue = res.issues.find((i) => i.code === 'UNREACHABLE');
    expect(issue).toBeDefined();
  });

  it('should detect inescapable loops', () => {
    const loopStory: Story = {
      version: 1,
      entryKnot: 'intro',
      knots: {
        intro: {
          id: 'intro',
          entryNode: 'a',
          nodes: {
            a: {
              id: 'a',
              text: 'A',
              choices: [{ id: 'to-b', label: 'To B', target: { node: 'b' } }],
            },
            b: {
              id: 'b',
              text: 'B',
              choices: [{ id: 'to-a', label: 'To A', target: { node: 'a' } }],
            },
          },
        },
      },
    };

    const res = analyzeStory(loopStory);
    const issue = res.issues.find((i) => i.code === 'INESCAPABLE_LOOP');
    expect(issue).toBeDefined();
  });

  it('should ignore escapable loops', () => {
    const escapeStory: Story = {
      version: 1,
      entryKnot: 'intro',
      knots: {
        intro: {
          id: 'intro',
          entryNode: 'a',
          nodes: {
            a: {
              id: 'a',
              text: 'A',
              choices: [{ id: 'to-b', label: 'To B', target: { node: 'b' } }],
            },
            b: {
              id: 'b',
              text: 'B',
              choices: [
                { id: 'to-a', label: 'To A', target: { node: 'a' } },
                { id: 'out', label: 'Out', target: { node: 'end' } },
              ],
            },
            end: {
              id: 'end',
              ending: { id: 'fine' },
            },
          },
        },
      },
    };

    const res = analyzeStory(escapeStory);
    const issue = res.issues.find((i) => i.code === 'INESCAPABLE_LOOP');
    expect(issue).toBeUndefined();
  });
});

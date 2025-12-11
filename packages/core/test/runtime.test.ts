import { createRuntime } from '../src/runtime';
import { Story } from '../src/types';

// Sample Story
const story: Story<{ vigor?: number; health?: number }> = {
  version: 1,
  entryKnot: 'intro',
  knots: {
    intro: {
      id: 'intro',
      entryNode: 'start',
      nodes: {
        start: {
          id: 'start',
          text: 'You wake up.',
          choices: [
            {
              id: 'look',
              label: 'Look around',
              target: { node: 'look' },
              effect: { vigor: 1 },
            },
          ],
        },
        look: {
          id: 'look',
          text: 'You see a door.',
          effect: { vigor: 1 },
          choices: [
            {
              id: 'open',
              label: 'Open door',
              target: { knot: 'hallway', node: 'entry' },
            },
          ],
        },
      },
    },
    hallway: {
      id: 'hallway',
      entryNode: 'entry',
      nodes: {
        entry: {
          id: 'entry',
          text: 'It is dark.',
          ending: { id: 'end' },
        },
      },
    },
  },
};

describe('Runtime', () => {
  it('should initialize and return initial step', () => {
    const runtime = createRuntime(story);
    const step = runtime.current({});
    expect(step.text[0]).toBe('You wake up.');
    expect(step.choices).toHaveLength(1);
    expect(step.choices[0].id).toBe('look');
  });

  it('should handle choices and accumulate effects', () => {
    const runtime = createRuntime(story);
    const step = runtime.choose('look', {});
    // Expected: choice effect (vigor: 1) + node effect (vigor: 1)
    expect(step.text[0]).toBe('You see a door.');
    expect(step.effects).toHaveLength(2);
    expect(step.effects[0]).toEqual({ vigor: 1 });
    expect(step.effects[1]).toEqual({ vigor: 1 });
  });

  it('should handle diverting to another knot and ending', () => {
    const runtime = createRuntime(story);
    runtime.choose('look', {}); // advance to 'look'
    const step = runtime.choose('open', {});
    expect(step.text[0]).toBe('It is dark.');
    expect(step.knotId).toBe('hallway');
    expect(step.nodeId).toBe('entry');
    expect(step.ending).toBeDefined();
    expect(step.ending?.id).toBe('end');
  });
});

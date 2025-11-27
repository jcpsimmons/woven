import { createRuntime } from '../src/runtime';
import { Story, RuntimeOptions } from '../src/types';

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

  describe('error handling', () => {
    it('should throw when choosing non-existent choice', () => {
      const runtime = createRuntime(story);
      expect(() => runtime.choose('nonexistent', {})).toThrow(
        'Choice "nonexistent" not found in node "start".'
      );
    });

    it('should throw when diverting to non-existent node', () => {
      const runtime = createRuntime(story);
      expect(() => runtime.divert({ node: 'fake' }, {})).toThrow(
        'Node "fake" in knot "intro" not found.'
      );
    });

    it('should throw when diverting to non-existent knot', () => {
      const runtime = createRuntime(story);
      expect(() => runtime.divert({ knot: 'fake', node: 'start' }, {})).toThrow(
        'Knot "fake" not found.'
      );
    });
  });

  describe('condition hooks', () => {
    const conditionalStory: Story = {
      version: 1,
      entryKnot: 'main',
      knots: {
        main: {
          id: 'main',
          entryNode: 'start',
          nodes: {
            start: {
              id: 'start',
              text: 'Choose wisely.',
              choices: [
                {
                  id: 'secret',
                  label: 'Secret door',
                  target: { node: 'end' },
                  condition: { type: 'hook', name: 'hasKey' },
                },
                {
                  id: 'normal',
                  label: 'Normal door',
                  target: { node: 'end' },
                },
              ],
            },
            end: {
              id: 'end',
              text: 'Done.',
              ending: { id: 'done' },
            },
          },
        },
      },
    };

    it('should filter choices based on condition hooks', () => {
      const options: RuntimeOptions<{ hasKey: boolean }> = {
        conditionHooks: {
          hasKey: (state) => state.hasKey,
        },
      };

      const runtime = createRuntime(conditionalStory, options);

      // Without key, only normal door visible
      const stepNoKey = runtime.current({ hasKey: false });
      expect(stepNoKey.choices).toHaveLength(1);
      expect(stepNoKey.choices[0].id).toBe('normal');

      // With key, both doors visible
      const stepWithKey = runtime.current({ hasKey: true });
      expect(stepWithKey.choices).toHaveLength(2);
    });

    it('should throw when condition hook is missing', () => {
      const runtime = createRuntime(conditionalStory); // no options
      expect(() => runtime.current({})).toThrow(
        'Condition hook "hasKey" not found. Register it via RuntimeOptions.conditionHooks.'
      );
    });

    it('should throw when choosing unavailable conditional choice', () => {
      const options: RuntimeOptions<{ hasKey: boolean }> = {
        conditionHooks: {
          hasKey: (state) => state.hasKey,
        },
      };

      const runtime = createRuntime(conditionalStory, options);
      expect(() => runtime.choose('secret', { hasKey: false })).toThrow(
        'Choice "secret" is not available due to condition.'
      );
    });
  });

  describe('expression evaluator', () => {
    const exprStory: Story = {
      version: 1,
      entryKnot: 'main',
      knots: {
        main: {
          id: 'main',
          entryNode: 'start',
          nodes: {
            start: {
              id: 'start',
              text: 'Test.',
              choices: [
                {
                  id: 'gated',
                  label: 'Gated',
                  target: { node: 'end' },
                  condition: { type: 'expression', expr: 'level >= 5' },
                },
              ],
            },
            end: {
              id: 'end',
              text: 'End.',
              ending: { id: 'done' },
            },
          },
        },
      },
    };

    it('should throw when expression evaluator is missing', () => {
      const runtime = createRuntime(exprStory);
      expect(() => runtime.current({})).toThrow(
        'Expression evaluator not provided for expr: "level >= 5". Register it via RuntimeOptions.expressionEvaluator.'
      );
    });

    it('should evaluate expressions with provided evaluator', () => {
      const options: RuntimeOptions<{ level: number }> = {
        expressionEvaluator: (expr, state) => {
          if (expr === 'level >= 5') return state.level >= 5;
          return false;
        },
      };

      const runtime = createRuntime(exprStory, options);

      const lowLevel = runtime.current({ level: 3 });
      expect(lowLevel.choices).toHaveLength(0);

      const highLevel = runtime.current({ level: 5 });
      expect(highLevel.choices).toHaveLength(1);
    });
  });

  describe('getPosition and getStory', () => {
    it('should return current position', () => {
      const runtime = createRuntime(story);
      const pos = runtime.getPosition();
      expect(pos.knotId).toBe('intro');
      expect(pos.nodeId).toBe('start');

      runtime.choose('look', {});
      const pos2 = runtime.getPosition();
      expect(pos2.nodeId).toBe('look');
    });

    it('should return the story object', () => {
      const runtime = createRuntime(story);
      expect(runtime.getStory()).toBe(story);
    });
  });

  describe('divert', () => {
    it('should allow direct divert to any node', () => {
      const runtime = createRuntime(story);
      const step = runtime.divert({ knot: 'hallway', node: 'entry' }, {});
      expect(step.knotId).toBe('hallway');
      expect(step.nodeId).toBe('entry');
      expect(step.ending?.id).toBe('end');
    });

    it('should stay in current knot if knot not specified', () => {
      const runtime = createRuntime(story);
      const step = runtime.divert({ node: 'look' }, {});
      expect(step.knotId).toBe('intro');
      expect(step.nodeId).toBe('look');
    });
  });

  describe('text handling', () => {
    it('should handle array text', () => {
      const multiTextStory: Story = {
        version: 1,
        entryKnot: 'main',
        knots: {
          main: {
            id: 'main',
            entryNode: 'start',
            nodes: {
              start: {
                id: 'start',
                text: ['Line one.', 'Line two.', 'Line three.'],
                ending: { id: 'end' },
              },
            },
          },
        },
      };

      const runtime = createRuntime(multiTextStory);
      const step = runtime.current({});
      expect(step.text).toEqual(['Line one.', 'Line two.', 'Line three.']);
    });

    it('should handle missing text gracefully', () => {
      const noTextStory: Story = {
        version: 1,
        entryKnot: 'main',
        knots: {
          main: {
            id: 'main',
            entryNode: 'start',
            nodes: {
              start: {
                id: 'start',
                ending: { id: 'end' },
              },
            },
          },
        },
      };

      const runtime = createRuntime(noTextStory);
      const step = runtime.current({});
      expect(step.text).toEqual([]);
    });
  });

  describe('tags', () => {
    it('should return node tags', () => {
      const taggedStory: Story = {
        version: 1,
        entryKnot: 'main',
        knots: {
          main: {
            id: 'main',
            entryNode: 'start',
            nodes: {
              start: {
                id: 'start',
                text: 'Tagged node.',
                tags: ['important', 'intro', 'tutorial'],
                ending: { id: 'end' },
              },
            },
          },
        },
      };

      const runtime = createRuntime(taggedStory);
      const step = runtime.current({});
      expect(step.tags).toEqual(['important', 'intro', 'tutorial']);
    });

    it('should return empty array when no tags', () => {
      const runtime = createRuntime(story);
      const step = runtime.current({});
      expect(step.tags).toEqual([]);
    });
  });
});

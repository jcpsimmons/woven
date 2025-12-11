import React, { useState } from 'react';
import { createRuntime, Story, StepResult } from '@storyloom/core';

// Example Story
const exampleStory: Story<{ health?: number; vigor?: number }> = {
  version: 1,
  entryKnot: 'intro',
  knots: {
    intro: {
      id: 'intro',
      entryNode: 'start',
      nodes: {
        start: {
          id: 'start',
          text: 'You wake up in a strange room.',
          choices: [
            {
              id: 'look-around',
              label: 'Look around',
              target: { node: 'look' },
              effect: { vigor: 1 },
            },
            {
              id: 'go-back-to-sleep',
              label: 'Go back to sleep',
              target: { node: 'sleep-ending' },
              effect: { health: 2 },
            },
          ],
        },
        look: {
          id: 'look',
          text: 'You see a door. It is slightly open.',
          effect: { vigor: 1 },
          choices: [
            {
              id: 'open-door',
              label: 'Open the door',
              target: { knot: 'hallway', node: 'entry' },
            },
          ],
        },
        'sleep-ending': {
          id: 'sleep-ending',
          text: 'You fall into a dreamless sleep.',
          ending: { id: 'sleep', label: 'You chose oblivion' },
        },
      },
    },
    hallway: {
      id: 'hallway',
      entryNode: 'entry',
      nodes: {
        entry: {
          id: 'entry',
          text: 'You are in a dark hallway.',
          ending: { id: 'to-be-continued', label: 'To be continued...' },
        },
      },
    },
  },
};

type GameState = { health: number; vigor: number };

function App() {
  const [runtime] = useState(() => createRuntime<any, GameState>(exampleStory));
  const [gameState, setGameState] = useState<GameState>({ health: 10, vigor: 0 });

  const [step, setStep] = useState<StepResult<any>>(() => {
    return runtime.current(gameState);
  });

  function applyEffects(effects: any[]) {
    setGameState((prev) => {
      const next = { ...prev };
      for (const eff of effects) {
        if (eff.health != null) next.health += eff.health;
        if (eff.vigor != null) next.vigor += eff.vigor;
      }
      return next;
    });
  }

  function handleChoice(id: string) {
    try {
      const nextStep = runtime.choose(id, gameState);
      applyEffects(nextStep.effects);
      setStep(nextStep);
    } catch (e) {
      console.error(e);
      alert((e as Error).message);
    }
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>Knotwork Dev UI</h1>

      <div style={{ display: 'flex', gap: '20px' }}>
        <div style={{ flex: 1, border: '1px solid #ccc', padding: '20px' }}>
          <h2>Story</h2>
          {step.text.map((t, i) => (
            <p key={i}>{t}</p>
          ))}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '20px' }}>
            {step.choices.map((c) => (
              <button key={c.id} onClick={() => handleChoice(c.id)} style={{ padding: '10px' }}>
                {c.label}
              </button>
            ))}
          </div>

          {step.ending && (
            <div style={{ marginTop: '20px', fontWeight: 'bold' }}>
              Ending: {step.ending.label || step.ending.id}
            </div>
          )}
        </div>

        <div style={{ width: '300px', border: '1px solid #ccc', padding: '20px' }}>
          <h2>State</h2>
          <pre>{JSON.stringify(gameState, null, 2)}</pre>

          <h3>Current Step Debug</h3>
          <pre style={{ fontSize: '0.8em', overflow: 'auto' }}>
            {JSON.stringify({ ...step, choices: step.choices.map((c) => c.id) }, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}

export default App;

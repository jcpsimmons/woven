import React, { useState } from 'react';
import { createRuntime, Story, StepResult } from '@storyloom/core';
import { Button, Card, Navbar, NavbarGroup, NavbarHeading } from '@blueprintjs/core';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

// Example Story - Prison Escape Adventure
const exampleStory: Story<{
  health?: number;
  stealth?: number;
  hasKey?: boolean;
  hasWeapon?: boolean;
  disguise?: boolean;
}> = {
  version: 1,
  entryKnot: 'cell',
  knots: {
    cell: {
      id: 'cell',
      entryNode: 'awakening',
      nodes: {
        awakening: {
          id: 'awakening',
          text: 'You wake in a cold stone cell. Moonlight streams through barred windows high above. Your head throbs from whatever knocked you out. How did you end up here?',
          choices: [
            {
              id: 'examine-cell',
              label: 'Examine the cell carefully',
              target: { node: 'search' },
              effect: { stealth: 1 },
            },
            {
              id: 'test-door',
              label: 'Test the cell door',
              target: { node: 'door-check' },
            },
            {
              id: 'rest',
              label: 'Rest and recover your strength',
              target: { node: 'rested' },
              effect: { health: 3 },
            },
          ],
        },
        search: {
          id: 'search',
          text: 'You search the cell methodically. Behind a loose stone, you find a rusty shiv someone left behind. In the corner, you spot ventilation grate that looks weak.',
          effect: { hasWeapon: true },
          choices: [
            {
              id: 'take-shiv',
              label: 'Keep the shiv hidden',
              target: { node: 'armed' },
            },
            {
              id: 'examine-vent',
              label: 'Examine the ventilation grate',
              target: { node: 'vent-option' },
            },
          ],
        },
        'door-check': {
          id: 'door-check',
          text: 'The heavy wooden door is locked, but you notice something - the lock mechanism is old and corroded. With the right tool, you might be able to pick it.',
          choices: [
            {
              id: 'search-tools',
              label: 'Search for something to pick the lock',
              target: { node: 'search' },
            },
            {
              id: 'bang-door',
              label: 'Bang on the door and call for help',
              target: { node: 'guard-attention' },
            },
          ],
        },
        rested: {
          id: 'rested',
          text: 'You lean against the cold wall and close your eyes. When you wake, you feel stronger, but you hear footsteps approaching.',
          choices: [
            {
              id: 'pretend-sleep',
              label: 'Pretend to still be asleep',
              target: { node: 'guard-visit' },
              effect: { stealth: 2 },
            },
            {
              id: 'stand-ready',
              label: 'Stand up and face whoever is coming',
              target: { node: 'guard-visit' },
            },
          ],
        },
        armed: {
          id: 'armed',
          text: "The shiv isn't much, but it's better than nothing. You feel more confident now.",
          choices: [
            {
              id: 'wait-guard',
              label: 'Wait for a guard to pass',
              target: { node: 'guard-visit' },
            },
            {
              id: 'check-vent',
              label: 'Check the ventilation grate',
              target: { node: 'vent-option' },
            },
          ],
        },
        'vent-option': {
          id: 'vent-option',
          text: 'The grate is loose. With some effort, you could probably squeeze through, though you have no idea where it leads.',
          choices: [
            {
              id: 'vent-escape',
              label: 'Pry open the grate and crawl through',
              target: { knot: 'vents', node: 'crawl' },
              effect: { stealth: 2 },
            },
            {
              id: 'reconsider',
              label: 'Too risky - wait for another opportunity',
              target: { node: 'armed' },
            },
          ],
        },
        'guard-attention': {
          id: 'guard-attention',
          text: 'A guard appears at the door, annoyed. "Shut it, prisoner!" He unlocks the door and steps in with his club raised.',
          effect: { health: -2 },
          choices: [
            {
              id: 'attack-guard',
              label: 'Rush the guard while the door is open',
              target: { knot: 'corridor', node: 'guard-fight' },
            },
            {
              id: 'submit',
              label: 'Back down and apologize',
              target: { node: 'beaten' },
              effect: { health: -3 },
            },
          ],
        },
        'guard-visit': {
          id: 'guard-visit',
          text: 'The guard stops at your cell. "Food time, scum." He slides a tray under the door, but carelessly drops his key ring. It clatters near the bars.',
          choices: [
            {
              id: 'grab-keys',
              label: 'Quickly grab the keys through the bars',
              target: { node: 'keys-grabbed' },
              effect: { hasKey: true, stealth: 1 },
            },
            {
              id: 'eat-wait',
              label: 'Eat and wait for him to notice',
              target: { node: 'guard-retrieves' },
            },
          ],
        },
        'keys-grabbed': {
          id: 'keys-grabbed',
          text: 'You snatch the keys just before the guard notices! "Hey!" He fumbles with his belt, but you already have them.',
          choices: [
            {
              id: 'unlock-escape',
              label: 'Quickly unlock the door and run',
              target: { knot: 'corridor', node: 'escape-run' },
            },
            {
              id: 'unlock-ambush',
              label: 'Unlock quietly and ambush the guard',
              target: { knot: 'corridor', node: 'ambush-guard' },
              effect: { stealth: 2 },
            },
          ],
        },
        'guard-retrieves': {
          id: 'guard-retrieves',
          text: '"Lucky I noticed," the guard mutters, picking up his keys. He leaves you alone with your meal.',
          choices: [
            {
              id: 'back-to-planning',
              label: 'Eat and plan your next move',
              target: { node: 'search' },
              effect: { health: 1 },
            },
          ],
        },
        beaten: {
          id: 'beaten',
          text: 'The guard beats you thoroughly. You collapse, bloodied and broken.',
          ending: { id: 'beaten-ending', label: 'Too Direct' },
        },
      },
    },
    vents: {
      id: 'vents',
      entryNode: 'crawl',
      nodes: {
        crawl: {
          id: 'crawl',
          text: 'You squeeze through the narrow vent shaft. Metal groans beneath you. Left leads to voices and light. Right descends into darkness.',
          choices: [
            {
              id: 'go-left',
              label: 'Crawl toward the voices',
              target: { node: 'barracks-vent' },
            },
            {
              id: 'go-right',
              label: 'Descend into the darkness',
              target: { node: 'armory-vent' },
            },
          ],
        },
        'barracks-vent': {
          id: 'barracks-vent',
          text: "You peer through a grate into the guards' barracks. Two guards play cards, their uniforms hung nearby. One is about your size.",
          choices: [
            {
              id: 'wait-sleep',
              label: 'Wait for them to sleep, then steal a uniform',
              target: { node: 'disguise-acquired' },
              effect: { disguise: true, stealth: 3 },
            },
            {
              id: 'find-another-way',
              label: 'Too risky - find another route',
              target: { node: 'crawl' },
            },
          ],
        },
        'armory-vent': {
          id: 'armory-vent',
          text: 'The shaft opens into a small armory. Weapons line the walls. You drop down quietly.',
          effect: { hasWeapon: true },
          choices: [
            {
              id: 'grab-weapon',
              label: 'Grab a proper weapon and some gear',
              target: { knot: 'armory', node: 'armed-up' },
            },
          ],
        },
        'disguise-acquired': {
          id: 'disguise-acquired',
          text: 'Hours later, they finally sleep. You slip in, take the uniform, and change quickly. The disguise might just work.',
          choices: [
            {
              id: 'walk-out',
              label: 'Walk out confidently as a guard',
              target: { knot: 'courtyard', node: 'disguised-entry' },
            },
          ],
        },
      },
    },
    corridor: {
      id: 'corridor',
      entryNode: 'escape-run',
      nodes: {
        'escape-run': {
          id: 'escape-run',
          text: 'You burst into the corridor and run. Alarms sound. Guards shout behind you. Ahead: a stairwell leading up, and a door marked "ARMORY".',
          choices: [
            {
              id: 'take-stairs',
              label: 'Sprint up the stairwell',
              target: { knot: 'courtyard', node: 'loud-entry' },
            },
            {
              id: 'armory-door',
              label: 'Duck into the armory',
              target: { knot: 'armory', node: 'hasty-entry' },
            },
          ],
        },
        'ambush-guard': {
          id: 'ambush-guard',
          text: 'You unlock the door silently and spring at the guard. He goes down hard. You take his club and uniform.',
          effect: { disguise: true, hasWeapon: true },
          choices: [
            {
              id: 'don-disguise',
              label: 'Put on the uniform and walk out',
              target: { knot: 'courtyard', node: 'disguised-entry' },
            },
          ],
        },
        'guard-fight': {
          id: 'guard-fight',
          text: "You charge the surprised guard. It's a desperate struggle!",
          effect: { health: -4 },
          choices: [
            {
              id: 'win-fight',
              label: 'Fight with everything you have',
              target: { node: 'fight-won' },
            },
            {
              id: 'flee-wounded',
              label: 'Break away and run',
              target: { node: 'escape-run' },
              effect: { health: -2 },
            },
          ],
        },
        'fight-won': {
          id: 'fight-won',
          text: 'You overpower the guard and take his keys and club. But the commotion has attracted attention. You hear running footsteps.',
          effect: { hasWeapon: true, hasKey: true },
          choices: [
            {
              id: 'run-now',
              label: 'Run before reinforcements arrive',
              target: { node: 'escape-run' },
            },
          ],
        },
      },
    },
    armory: {
      id: 'armory',
      entryNode: 'armed-up',
      nodes: {
        'armed-up': {
          id: 'armed-up',
          text: 'You equip yourself properly: a sword, leather armor, and a few supplies. Now you look dangerous.',
          effect: { hasWeapon: true, health: 2 },
          choices: [
            {
              id: 'proceed-confident',
              label: 'Head to the courtyard, ready for anything',
              target: { knot: 'courtyard', node: 'armed-entry' },
            },
          ],
        },
        'hasty-entry': {
          id: 'hasty-entry',
          text: 'You slam the armory door behind you and grab the first weapon you see. Guards are right behind you.',
          effect: { hasWeapon: true },
          choices: [
            {
              id: 'barricade',
              label: 'Barricade the door and find another exit',
              target: { node: 'find-exit' },
            },
            {
              id: 'stand-fight',
              label: 'Make your stand here',
              target: { node: 'last-stand' },
            },
          ],
        },
        'find-exit': {
          id: 'find-exit',
          text: 'You spot a window! The guards are breaking through the barricade.',
          choices: [
            {
              id: 'window-escape',
              label: 'Smash through the window',
              target: { knot: 'courtyard', node: 'dramatic-entry' },
              effect: { health: -3 },
            },
          ],
        },
        'last-stand': {
          id: 'last-stand',
          text: 'You fight bravely, but there are too many. They overwhelm you.',
          ending: { id: 'last-stand-ending', label: 'Died Fighting' },
        },
      },
    },
    courtyard: {
      id: 'courtyard',
      entryNode: 'armed-entry',
      nodes: {
        'armed-entry': {
          id: 'armed-entry',
          text: 'You enter the moonlit courtyard. The main gate is ahead, heavily guarded. To the right, stables. The walls could be climbed with effort.',
          choices: [
            {
              id: 'steal-horse',
              label: 'Steal a horse from the stables',
              target: { node: 'horse-escape' },
            },
            {
              id: 'climb-wall',
              label: 'Climb the wall under cover of darkness',
              target: { node: 'wall-climb' },
              effect: { stealth: 2 },
            },
            {
              id: 'fight-gate',
              label: 'Fight your way through the main gate',
              target: { node: 'gate-assault' },
            },
          ],
        },
        'disguised-entry': {
          id: 'disguised-entry',
          text: 'In the guard uniform, you walk confidently into the courtyard. Other guards nod at you. The main gate stands open for the changing of shifts.',
          choices: [
            {
              id: 'walk-out',
              label: 'Simply walk out through the gate',
              target: { node: 'smooth-escape' },
            },
            {
              id: 'steal-horse-disguised',
              label: 'Take a horse for faster escape',
              target: { node: 'horse-escape' },
            },
          ],
        },
        'loud-entry': {
          id: 'loud-entry',
          text: 'You burst into the courtyard with guards in pursuit. Chaos erupts. The alarm bells ring.',
          effect: { health: -2 },
          choices: [
            {
              id: 'desperate-climb',
              label: 'Desperately scale the wall',
              target: { node: 'desperate-wall' },
            },
            {
              id: 'fight-through',
              label: 'Fight your way to the gate',
              target: { node: 'gate-assault' },
            },
          ],
        },
        'dramatic-entry': {
          id: 'dramatic-entry',
          text: 'You crash through the window into the courtyard, rolling to your feet. Glass cuts sting, but you are outside.',
          choices: [
            {
              id: 'quick-wall',
              label: 'Quickly climb the nearest wall',
              target: { node: 'wall-climb' },
            },
            {
              id: 'grab-horse',
              label: 'Sprint to the stables',
              target: { node: 'horse-escape' },
            },
          ],
        },
        'horse-escape': {
          id: 'horse-escape',
          text: 'You mount a horse and ride hard for the gate. Arrows fly past you.',
          effect: { health: -1 },
          choices: [
            {
              id: 'break-through',
              label: 'Break through the gate at full gallop',
              target: { node: 'freedom-horse' },
            },
          ],
        },
        'wall-climb': {
          id: 'wall-climb',
          text: 'You scale the wall, stones rough under your hands. Below, guards scramble to stop you.',
          choices: [
            {
              id: 'reach-top',
              label: 'Push yourself to reach the top',
              target: { node: 'freedom-wall' },
              effect: { stealth: 1 },
            },
          ],
        },
        'desperate-wall': {
          id: 'desperate-wall',
          text: "You climb frantically. Arrows thud into the stone around you. It's now or never!",
          effect: { health: -3 },
          choices: [
            {
              id: 'keep-climbing',
              label: 'Keep climbing despite the danger',
              target: { node: 'freedom-wounded' },
            },
          ],
        },
        'gate-assault': {
          id: 'gate-assault',
          text: 'You charge the gate guards. They draw weapons. This will be a fight to the death.',
          effect: { health: -5 },
          choices: [
            {
              id: 'all-in',
              label: 'Give everything you have',
              target: { node: 'pyrrhic-victory' },
            },
          ],
        },
        'smooth-escape': {
          id: 'smooth-escape',
          text: 'You walk right through the gate, nodding at the guards. They never suspect. Once outside, you disappear into the night.',
          ending: { id: 'perfect-escape', label: 'The Perfect Escape - Master of Stealth!' },
        },
        'freedom-horse': {
          id: 'freedom-horse',
          text: 'Your horse crashes through the wooden gate. You ride into the forest, free at last. Behind you, the prison fades into the distance.',
          ending: { id: 'horse-ending', label: 'Freedom Rider - Daring Escape!' },
        },
        'freedom-wall': {
          id: 'freedom-wall',
          text: 'You drop down the other side of the wall and vanish into the shadows. The prison cannot hold you.',
          ending: { id: 'wall-ending', label: 'Shadow Escape - Silent and Free!' },
        },
        'freedom-wounded': {
          id: 'freedom-wounded',
          text: 'Wounded but alive, you drop over the wall and stumble into freedom. You will carry scars, but you are free.',
          ending: {
            id: 'wounded-ending',
            label: 'Wounded But Free - Survival Against Odds!',
          },
        },
        'pyrrhic-victory': {
          id: 'pyrrhic-victory',
          text: 'You fight like a demon and somehow break through. Badly wounded, you stagger through the gate to freedom. You may not survive the night, but you died free.',
          ending: { id: 'pyrrhic-ending', label: "Freedom at Any Cost - Warrior's Escape!" },
        },
      },
    },
  },
};

type GameState = {
  health: number;
  stealth: number;
  hasKey: boolean;
  hasWeapon: boolean;
  disguise: boolean;
};

function App() {
  const [runtime] = useState(() => createRuntime<any, GameState>(exampleStory));
  const [gameState, setGameState] = useState<GameState>({
    health: 10,
    stealth: 0,
    hasKey: false,
    hasWeapon: false,
    disguise: false,
  });

  const [step, setStep] = useState<StepResult<any>>(() => {
    return runtime.current(gameState);
  });

  function applyEffects(effects: any[]) {
    setGameState((prev) => {
      const next = { ...prev };
      for (const eff of effects) {
        if (eff.health != null) next.health += eff.health;
        if (eff.stealth != null) next.stealth += eff.stealth;
        if (eff.hasKey != null) next.hasKey = eff.hasKey;
        if (eff.hasWeapon != null) next.hasWeapon = eff.hasWeapon;
        if (eff.disguise != null) next.disguise = eff.disguise;
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
    <div className="bp5-dark app-container">
      {/* Navigation Header */}
      <div className="app-header">
        <div className="header-content">
          <div className="header-brand">
            <h1 className="header-title">Storyloom</h1>
            <p className="header-subtitle">Interactive Storytelling Engine</p>
          </div>
          <div className="header-actions">
            <Button
              icon="git-repo"
              text="GitHub"
              onClick={() => window.open('https://github.com/jcpsimmons/woven', '_blank')}
              large
            />
            <Button
              icon="edit"
              text="Blog"
              onClick={() => window.open('https://blog.drjoshcsimmons.com', '_blank')}
              large
            />
          </div>
        </div>
      </div>

      <div className="content-wrapper">
        <Card className="story-panel" elevation={2}>
          <div className="story-section">
            <h2>Story</h2>
            {step.text.map((t, i) => (
              <p key={i}>{t}</p>
            ))}

            <div className="choice-buttons">
              {step.choices.map((c) => (
                <Button
                  key={c.id}
                  intent="primary"
                  large
                  onClick={() => handleChoice(c.id)}
                  text={c.label}
                />
              ))}
            </div>

            {step.ending && (
              <div className="ending-display">
                <h2>The End</h2>
                <p>{step.ending.label || step.ending.id}</p>
              </div>
            )}
          </div>
        </Card>

        <Card className="state-panel" elevation={2}>
          <div className="debug-section">
            <h2>State</h2>
            <SyntaxHighlighter
              language="json"
              style={vscDarkPlus}
              customStyle={{
                margin: 0,
                borderRadius: '4px',
                fontSize: '13px',
                lineHeight: '1.6',
              }}
            >
              {JSON.stringify(gameState, null, 2)}
            </SyntaxHighlighter>
          </div>

          <div className="debug-section">
            <h3>Current Step Debug</h3>
            <SyntaxHighlighter
              language="json"
              style={vscDarkPlus}
              customStyle={{
                margin: 0,
                borderRadius: '4px',
                fontSize: '13px',
                lineHeight: '1.6',
              }}
            >
              {JSON.stringify({ ...step, choices: step.choices.map((c) => c.id) }, null, 2)}
            </SyntaxHighlighter>
          </div>
        </Card>
      </div>
    </div>
  );
}

export default App;

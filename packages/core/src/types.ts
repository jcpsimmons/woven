// User defines this per game
export type EffectPayload = {
  // arbitrary fields...
  [key: string]: any;
};

// Internal ids
export type NodeId = string;
export type KnotId = string;

export interface Story<TEffect = unknown> {
  version: 1;
  entryKnot: KnotId;
  knots: Record<KnotId, Knot<TEffect>>;
}

export interface Knot<TEffect> {
  id: KnotId;
  entryNode: NodeId;
  nodes: Record<NodeId, Node<TEffect>>;
}

export interface Node<TEffect> {
  id: NodeId;

  // Text generated for this beat
  text?: string | string[];

  // Tags for metadata, not gameplay
  tags?: string[];

  // Choices that leave this node
  choices?: Choice<TEffect>[];

  // Optional local effect at this beat
  effect?: TEffect;

  // Mark this node as an ending
  ending?: {
    id: string; // "good", "bad", "neutral", etc
    label?: string; // human readable
  };
}

export interface Choice<TEffect> {
  id: string;
  label: string;

  // Where do we go
  target: {
    knot?: KnotId; // optional, if omitted stay in current knot
    node: NodeId;
  };

  // Optional effect at choice-time
  effect?: TEffect;

  // Optional condition hook name or expression string
  condition?: Condition;
}

export type Condition = { type: 'expression'; expr: string } | { type: 'hook'; name: string };

export interface StepResult<TEffect> {
  nodeId: NodeId;
  knotId: KnotId;
  text: string[];
  tags: string[];
  ending?: { id: string; label?: string };

  // Choices available after applying conditions
  choices: Array<{
    id: string;
    label: string;
  }>;

  // All effects triggered by arriving at this node
  // plus taking the chosen choice (if any)
  effects: TEffect[];
}

export interface StoryRuntime<TEffect = unknown, TState = unknown> {
  getStory(): Story<TEffect>;

  // Where are we
  getPosition(): { knotId: KnotId; nodeId: NodeId };

  // Return current node without moving
  current(state: TState): StepResult<TEffect>;

  // Choose an option and advance
  choose(choiceId: string, state: TState): StepResult<TEffect>;

  // Jump directly
  divert(to: { knot?: KnotId; node: NodeId }, state: TState): StepResult<TEffect>;
}

export interface RuntimeOptions<TState> {
  // Optional: evaluate conditions against game state
  conditionHooks?: Record<string, (state: TState) => boolean>;
  expressionEvaluator?: (expr: string, state: TState) => boolean;
}

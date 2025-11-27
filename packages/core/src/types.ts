/**
 * User-defined effect payload type. Define this per game to match your effect structure.
 *
 * @example
 * ```typescript
 * type MyEffect = {
 *   health?: number;
 *   gold?: number;
 *   hasKey?: boolean;
 * };
 * ```
 */
export type EffectPayload = {
  /** Arbitrary fields defined by the user */
  [key: string]: unknown;
};

/** Unique identifier for a node within a knot */
export type NodeId = string;

/** Unique identifier for a knot within a story */
export type KnotId = string;

/**
 * Complete story definition.
 *
 * A story consists of one or more knots, each containing nodes that represent
 * story beats. The story starts at the entryKnot's entryNode.
 *
 * @typeParam TEffect - The type of effects that can be applied in this story
 */
export interface Story<TEffect = unknown> {
  version: 1;
  entryKnot: KnotId;
  knots: Record<KnotId, Knot<TEffect>>;
}

/**
 * A knot is a collection of nodes that form a logical section of the story.
 * Knots allow organizing complex stories into manageable sections.
 *
 * @typeParam TEffect - The type of effects used in nodes within this knot
 */
export interface Knot<TEffect> {
  /** Unique identifier for this knot */
  id: KnotId;
  /** The node ID where this knot starts */
  entryNode: NodeId;
  /** All nodes contained in this knot, keyed by node ID */
  nodes: Record<NodeId, Node<TEffect>>;
}

/**
 * A node represents a single story beat - a moment where text is displayed
 * and choices may be presented to the player.
 *
 * @typeParam TEffect - The type of effects that can be applied at this node
 */
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

/**
 * A choice presented to the player at a node.
 *
 * @typeParam TEffect - The type of effect that can be applied when this choice is made
 */
export interface Choice<TEffect> {
  /** Unique identifier for this choice */
  id: string;
  /** Display text shown to the player */
  label: string;

  /** Target location to navigate to when this choice is selected */
  target: {
    /** Optional knot ID - if omitted, stays in current knot */
    knot?: KnotId;
    /** Node ID to navigate to */
    node: NodeId;
  };

  /** Optional effect applied when this choice is selected */
  effect?: TEffect;

  /** Optional condition that must be true for this choice to be available */
  condition?: Condition;
}

/**
 * Condition for conditional choices. Can be either a hook function or an expression string.
 */
export type Condition = { type: 'expression'; expr: string } | { type: 'hook'; name: string };

/**
 * Result returned when querying the current step or making a choice.
 *
 * Contains all information about the current story position, including
 * available choices (after condition filtering), text to display, and
 * any effects that were triggered.
 *
 * @typeParam TEffect - The type of effects in this result
 */
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

/**
 * Runtime interface for navigating and interacting with a story.
 *
 * @typeParam TEffect - The type of effects used in the story
 * @typeParam TState - The type of game state used for condition evaluation
 */
export interface StoryRuntime<TEffect = unknown, TState = unknown> {
  /**
   * Returns the story definition used by this runtime.
   * @returns The story object
   */
  getStory(): Story<TEffect>;

  /**
   * Gets the current position in the story.
   * @returns Object containing the current knot and node IDs
   */
  getPosition(): { knotId: KnotId; nodeId: NodeId };

  /**
   * Returns the current story step without advancing.
   * Choices are filtered based on conditions evaluated against the provided state.
   *
   * @param state - Current game state for condition evaluation
   * @returns Current step result with available choices
   */
  current(state: TState): StepResult<TEffect>;

  /**
   * Makes a choice and advances the story to the target node.
   * Throws an error if the choice doesn't exist or isn't available.
   *
   * @param choiceId - ID of the choice to make
   * @param state - Current game state for condition evaluation
   * @returns Step result after advancing
   * @throws Error if choice not found or condition not met
   */
  choose(choiceId: string, state: TState): StepResult<TEffect>;

  /**
   * Jumps directly to a specific knot and node.
   * Useful for save/load, debugging, or special navigation.
   *
   * @param to - Target location (knot optional, defaults to current)
   * @param state - Current game state for condition evaluation
   * @returns Step result at the new location
   * @throws Error if target knot or node doesn't exist
   */
  divert(to: { knot?: KnotId; node: NodeId }, state: TState): StepResult<TEffect>;
}

/**
 * Options for configuring runtime behavior.
 *
 * @typeParam TState - The type of game state used for condition evaluation
 */
export interface RuntimeOptions<TState> {
  /**
   * Map of condition hook names to evaluation functions.
   * Used when choices have `condition: { type: 'hook', name: 'hookName' }`.
   *
   * @example
   * ```typescript
   * conditionHooks: {
   *   hasKey: (state) => state.inventory.includes('key'),
   *   isHealthy: (state) => state.health > 50
   * }
   * ```
   */
  conditionHooks?: Record<string, (state: TState) => boolean>;

  /**
   * Function to evaluate expression strings.
   * Used when choices have `condition: { type: 'expression', expr: 'level >= 5' }`.
   *
   * @example
   * ```typescript
   * expressionEvaluator: (expr, state) => {
   *   // Implement your expression parser here
   *   return eval(expr.replace(/level/g, state.level.toString()));
   * }
   * ```
   */
  expressionEvaluator?: (expr: string, state: TState) => boolean;
}

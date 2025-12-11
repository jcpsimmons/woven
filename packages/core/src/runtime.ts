import { Story, StoryRuntime, RuntimeOptions, StepResult, KnotId, NodeId, Choice } from './types';

export function createRuntime<TEffect, TState>(
  story: Story<TEffect>,
  options?: RuntimeOptions<TState>
): StoryRuntime<TEffect, TState> {
  let currentKnotId: KnotId = story.entryKnot;
  let currentNodeId: NodeId = story.knots[currentKnotId].entryNode;

  function getStory() {
    return story;
  }

  function getPosition() {
    return { knotId: currentKnotId, nodeId: currentNodeId };
  }

  function getNode(knotId: KnotId, nodeId: NodeId) {
    const knot = story.knots[knotId];
    if (!knot) {
      throw new Error(`Knot "${knotId}" not found.`);
    }
    const node = knot.nodes[nodeId];
    if (!node) {
      throw new Error(`Node "${nodeId}" in knot "${knotId}" not found.`);
    }
    return node;
  }

  function evaluateCondition(condition: Choice<TEffect>['condition'], state: TState): boolean {
    if (!condition) return true;

    if (condition.type === 'hook') {
      const hook = options?.conditionHooks?.[condition.name];
      if (hook) {
        return hook(state);
      }
      // If hook missing, what to do? Default to false? Or throw?
      // Assuming false for safety, or we could warn.
      console.warn(`Condition hook "${condition.name}" not found.`);
      return false;
    } else if (condition.type === 'expression') {
      const evaluator = options?.expressionEvaluator;
      if (evaluator) {
        return evaluator(condition.expr, state);
      }
      console.warn(`Expression evaluator not provided for expr: "${condition.expr}"`);
      return false;
    }
    return true;
  }

  function buildStepResult(
    knotId: KnotId,
    nodeId: NodeId,
    state: TState,
    extraEffects: TEffect[] = []
  ): StepResult<TEffect> {
    const node = getNode(knotId, nodeId);
    const text = typeof node.text === 'string' ? [node.text] : node.text || [];
    const tags = node.tags || [];
    const ending = node.ending;

    const choices = (node.choices || [])
      .filter((choice) => evaluateCondition(choice.condition, state))
      .map((choice) => ({
        id: choice.id,
        label: choice.label,
      }));

    const nodeEffects = node.effect ? [node.effect] : [];
    const allEffects = [...extraEffects, ...nodeEffects];

    return {
      nodeId,
      knotId,
      text,
      tags,
      ending,
      choices,
      effects: allEffects,
    };
  }

  function current(state: TState): StepResult<TEffect> {
    return buildStepResult(currentKnotId, currentNodeId, state, []);
  }

  function choose(choiceId: string, state: TState): StepResult<TEffect> {
    const node = getNode(currentKnotId, currentNodeId);
    const choice = node.choices?.find((c) => c.id === choiceId);

    if (!choice) {
      throw new Error(`Choice "${choiceId}" not found in node "${currentNodeId}".`);
    }

    if (!evaluateCondition(choice.condition, state)) {
      throw new Error(`Choice "${choiceId}" is not available due to condition.`);
    }

    const choiceEffects = choice.effect ? [choice.effect] : [];

    // Update position
    const targetKnotId = choice.target.knot || currentKnotId;
    const targetNodeId = choice.target.node;

    // Verify target exists
    getNode(targetKnotId, targetNodeId);

    currentKnotId = targetKnotId;
    currentNodeId = targetNodeId;

    return buildStepResult(currentKnotId, currentNodeId, state, choiceEffects);
  }

  function divert(to: { knot?: KnotId; node: NodeId }, state: TState): StepResult<TEffect> {
    const targetKnotId = to.knot || currentKnotId;
    const targetNodeId = to.node;

    // Verify target exists
    getNode(targetKnotId, targetNodeId);

    currentKnotId = targetKnotId;
    currentNodeId = targetNodeId;

    return buildStepResult(currentKnotId, currentNodeId, state, []);
  }

  return {
    getStory,
    getPosition,
    current,
    choose,
    divert,
  };
}

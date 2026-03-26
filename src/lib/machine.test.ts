import { describe, expect, it } from 'vitest';
import { detectFormat, parseSketchCode, parseXStateMachineCode } from './machine';

describe('detectFormat', () => {
  it('detects Sketch DSL before any explicit mode selection', () => {
    expect(
      detectFormat(`Fetch App*
  idle*
    FETCH -> loading
  loading`),
    ).toBe('sketch');
  });

  it('detects Mermaid diagrams', () => {
    expect(
      detectFormat(`stateDiagram-v2
[*] --> idle
idle --> loading: FETCH`),
    ).toBe('mermaid');
  });
});

describe('parseSketchCode', () => {
  it('creates a machine from sketch DSL', () => {
    const result = parseSketchCode(`Fetch App*
  idle*
    FETCH -> loading
  loading`);

    expect(result.error).toBeNull();
    expect(result.machines).toHaveLength(1);
    expect(result.machines[0]?.id).toBe('Fetch App');
  });
});

describe('parseXStateMachineCode', () => {
  it('parses top-level exported machine declarations', () => {
    const result = parseXStateMachineCode(`
export const machine = setup({}).createMachine({
  id: 'test',
  initial: 'idle',
  states: {
    idle: {},
  },
});
`);

    expect(result.error).toBeNull();
    expect(result.machines).toHaveLength(1);
    expect(result.machines[0]?.id).toBe('test');
  });

  it('parses export default createMachine', () => {
    const result = parseXStateMachineCode(`
export default createMachine({
  id: 'defaultExport',
  initial: 'idle',
  states: {
    idle: {},
  },
});
`);

    expect(result.error).toBeNull();
    expect(result.machines).toHaveLength(1);
    expect(result.machines[0]?.id).toBe('defaultExport');
  });

  it('parses export default setup().createMachine', () => {
    const result = parseXStateMachineCode(`
export default setup({}).createMachine({
  id: 'defaultSetup',
  initial: 'idle',
  states: {
    idle: {},
  },
});
`);

    expect(result.error).toBeNull();
    expect(result.machines).toHaveLength(1);
    expect(result.machines[0]?.id).toBe('defaultSetup');
  });

  it('parses code with export list at the end', () => {
    const result = parseXStateMachineCode(`
const machine = createMachine({
  id: 'exportList',
  initial: 'idle',
  states: {
    idle: {},
  },
});

export { machine };
`);

    expect(result.error).toBeNull();
    expect(result.machines).toHaveLength(1);
    expect(result.machines[0]?.id).toBe('exportList');
  });

  it('parses code with re-exports stripped', () => {
    const result = parseXStateMachineCode(`
export * from 'some-module';

const machine = createMachine({
  id: 'reExport',
  initial: 'idle',
  states: {
    idle: {},
  },
});
`);

    expect(result.error).toBeNull();
    expect(result.machines).toHaveLength(1);
    expect(result.machines[0]?.id).toBe('reExport');
  });

  it('parses exported function containing createMachine', () => {
    const result = parseXStateMachineCode(`
export function getMachine() {
  return createMachine({
    id: 'fromFunction',
    initial: 'idle',
    states: {
      idle: {},
    },
  });
}

getMachine();
`);

    expect(result.error).toBeNull();
    expect(result.machines).toHaveLength(1);
    expect(result.machines[0]?.id).toBe('fromFunction');
  });

  it('parses non-exported machine declarations', () => {
    const result = parseXStateMachineCode(`
const machine = createMachine({
  id: 'noExport',
  initial: 'idle',
  states: {
    idle: {},
  },
});
`);

    expect(result.error).toBeNull();
    expect(result.machines).toHaveLength(1);
    expect(result.machines[0]?.id).toBe('noExport');
  });
});

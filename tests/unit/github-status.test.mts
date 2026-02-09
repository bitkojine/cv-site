import { describe, expect, it } from 'vitest';
import { resolveWorkflowBadge } from '../../src/lib/github-status.mts';

describe('resolveWorkflowBadge', () => {
  it('maps queued and in_progress to Running', () => {
    expect(resolveWorkflowBadge('queued', null)).toEqual({
      state: 'running',
      label: 'Running',
    });
    expect(resolveWorkflowBadge('in_progress', 'success')).toEqual({
      state: 'running',
      label: 'Running',
    });
  });

  it('maps completed success and failure', () => {
    expect(resolveWorkflowBadge('completed', 'success')).toEqual({
      state: 'success',
      label: 'Success',
    });
    expect(resolveWorkflowBadge('completed', 'failure')).toEqual({
      state: 'failure',
      label: 'Failure',
    });
  });

  it('falls back to Unknown for other states', () => {
    expect(resolveWorkflowBadge('completed', null)).toEqual({
      state: 'unknown',
      label: 'Unknown',
    });
    expect(resolveWorkflowBadge('completed', 'cancelled')).toEqual({
      state: 'unknown',
      label: 'Unknown',
    });
  });
});

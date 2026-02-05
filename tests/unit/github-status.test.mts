import { describe, expect, it } from 'vitest';
import {
  getWorkflowStatusClass,
  getWorkflowStatusLabel,
} from '../../src/lib/github-status.mts';

describe('getWorkflowStatusLabel', () => {
  it('returns Running for queued or in_progress', () => {
    expect(getWorkflowStatusLabel('queued', null)).toBe('Running');
    expect(getWorkflowStatusLabel('in_progress', 'success')).toBe('Running');
  });

  it('returns conclusion for completed runs', () => {
    expect(getWorkflowStatusLabel('completed', 'success')).toBe('success');
    expect(getWorkflowStatusLabel('completed', 'failure')).toBe('failure');
  });

  it('falls back to Unknown when conclusion missing', () => {
    expect(getWorkflowStatusLabel('completed', null)).toBe('Unknown');
  });
});

describe('getWorkflowStatusClass', () => {
  it('maps running statuses', () => {
    expect(getWorkflowStatusClass('queued', null)).toBe('status-running');
    expect(getWorkflowStatusClass('in_progress', 'success')).toBe(
      'status-running'
    );
  });

  it('maps completed conclusions', () => {
    expect(getWorkflowStatusClass('completed', 'success')).toBe(
      'status-success'
    );
    expect(getWorkflowStatusClass('completed', 'failure')).toBe(
      'status-failure'
    );
  });

  it('returns empty string for other conclusions', () => {
    expect(getWorkflowStatusClass('completed', 'cancelled')).toBe('');
  });
});

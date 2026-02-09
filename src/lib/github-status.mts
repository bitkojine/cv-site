export type WorkflowStatus = 'completed' | 'in_progress' | 'queued';
export type WorkflowConclusion = string | null;

export type WorkflowBadgeState = 'running' | 'success' | 'failure' | 'unknown';

export interface WorkflowBadgeResolved {
  state: WorkflowBadgeState;
  label: 'Running' | 'Success' | 'Failure' | 'Unknown';
}

export const resolveWorkflowBadge = (
  status: WorkflowStatus,
  conclusion: WorkflowConclusion
): WorkflowBadgeResolved => {
  if (status === 'in_progress' || status === 'queued') {
    return { state: 'running', label: 'Running' };
  }

  if (status === 'completed' && conclusion === 'success') {
    return { state: 'success', label: 'Success' };
  }

  if (status === 'completed' && conclusion === 'failure') {
    return { state: 'failure', label: 'Failure' };
  }

  return { state: 'unknown', label: 'Unknown' };
};

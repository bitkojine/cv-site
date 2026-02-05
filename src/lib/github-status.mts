export type WorkflowStatus = 'completed' | 'in_progress' | 'queued';
export type WorkflowConclusion = string | null;

export const getWorkflowStatusLabel = (
  status: WorkflowStatus,
  conclusion: WorkflowConclusion
) =>
  status === 'in_progress' || status === 'queued'
    ? 'Running'
    : conclusion || 'Unknown';

export const getWorkflowStatusClass = (
  status: WorkflowStatus,
  conclusion: WorkflowConclusion
) => {
  if (status === 'in_progress' || status === 'queued') {
    return 'status-running';
  }
  if (conclusion === 'success') {
    return 'status-success';
  }
  if (conclusion === 'failure') {
    return 'status-failure';
  }
  return '';
};

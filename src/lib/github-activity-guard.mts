type RecordLike = Record<string, unknown>;

type GitHubActivityEvent = {
  type: string;
  created_at: string;
  repo: { name: string } & RecordLike;
  payload?: {
    commits?: Array<{ message: string } & RecordLike>;
    ref?: string;
    ref_type?: string;
    action?: string;
    pull_request?: { title?: string } & RecordLike;
  } & RecordLike;
} & RecordLike;

const isRecordLike = (value: unknown): value is RecordLike =>
  typeof value === 'object' && value !== null;

export const isGitHubActivityEvent = (
  value: unknown
): value is GitHubActivityEvent => {
  if (!isRecordLike(value)) return false;
  if (typeof value.type !== 'string') return false;
  if (typeof value.created_at !== 'string') return false;

  if (!isRecordLike(value.repo) || typeof value.repo.name !== 'string') {
    return false;
  }

  if (value.payload === undefined) return true;
  if (!isRecordLike(value.payload)) return false;

  const payload = value.payload;

  if (payload.commits !== undefined) {
    if (!Array.isArray(payload.commits)) return false;
    if (
      !payload.commits.every(
        (commit) => isRecordLike(commit) && typeof commit.message === 'string'
      )
    ) {
      return false;
    }
  }

  if (payload.ref !== undefined && typeof payload.ref !== 'string')
    return false;
  if (payload.ref_type !== undefined && typeof payload.ref_type !== 'string') {
    return false;
  }
  if (payload.action !== undefined && typeof payload.action !== 'string') {
    return false;
  }
  if (payload.pull_request !== undefined) {
    if (!isRecordLike(payload.pull_request)) return false;
    if (
      payload.pull_request.title !== undefined &&
      typeof payload.pull_request.title !== 'string'
    ) {
      return false;
    }
  }

  return true;
};

export const parseGitHubActivityEvents = (
  value: unknown
): GitHubActivityEvent[] | null => {
  if (!Array.isArray(value)) return null;
  return value.every((event) => isGitHubActivityEvent(event)) ? value : null;
};

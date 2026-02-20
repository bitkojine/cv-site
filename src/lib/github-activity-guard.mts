type RecordLike = Record<string, unknown>;

type GitHubActivityEvent = {
  type: string;
  created_at: string;
  repo: { name: string } & RecordLike;
  payload?: {
    commits?: ({ message: string } & RecordLike)[];
    ref?: string;
    ref_type?: string;
    action?: string;
    pull_request?: { title?: string } & RecordLike;
  } & RecordLike;
} & RecordLike;

const isRecordLike = (value: unknown): value is RecordLike =>
  typeof value === 'object' && value !== null;

const hasStringProp = (value: RecordLike, key: string) =>
  typeof value[key] === 'string';

const hasOptionalStringProp = (value: RecordLike, key: string) =>
  value[key] === undefined || typeof value[key] === 'string';

const isCommit = (value: unknown) =>
  isRecordLike(value) && typeof value.message === 'string';

const hasValidCommits = (payload: RecordLike) =>
  payload.commits === undefined ||
  (Array.isArray(payload.commits) && payload.commits.every(isCommit));

const hasValidPullRequest = (payload: RecordLike) => {
  if (payload.pull_request === undefined) {
    return true;
  }
  if (!isRecordLike(payload.pull_request)) {
    return false;
  }
  return hasOptionalStringProp(payload.pull_request, 'title');
};

const hasValidPayloadShape = (payload: unknown) => {
  if (payload === undefined) {
    return true;
  }
  if (!isRecordLike(payload)) {
    return false;
  }

  return (
    hasValidCommits(payload) &&
    hasOptionalStringProp(payload, 'ref') &&
    hasOptionalStringProp(payload, 'ref_type') &&
    hasOptionalStringProp(payload, 'action') &&
    hasValidPullRequest(payload)
  );
};

export const isGitHubActivityEvent = (
  value: unknown
): value is GitHubActivityEvent => {
  if (!isRecordLike(value)) {
    return false;
  }
  if (!hasStringProp(value, 'type')) {
    return false;
  }
  if (!hasStringProp(value, 'created_at')) {
    return false;
  }

  return (
    isRecordLike(value.repo) &&
    hasStringProp(value.repo, 'name') &&
    hasValidPayloadShape(value.payload)
  );
};

export const parseGitHubActivityEvents = (
  value: unknown
): GitHubActivityEvent[] | null => {
  if (!Array.isArray(value)) {
    return null;
  }
  return value.every((event) => isGitHubActivityEvent(event)) ? value : null;
};

import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

type SonarSeverity = 'BLOCKER' | 'CRITICAL' | 'MAJOR' | 'MINOR' | 'INFO';
type SonarType = 'BUG' | 'VULNERABILITY' | 'CODE_SMELL';

interface SonarIssue {
  key: string;
  rule: string;
  severity: SonarSeverity;
  type: SonarType;
  component: string;
  project: string;
  message: string;
  line?: number;
}

interface WorkItem {
  rule: string;
  file: string;
  count: number;
  topSeverity: SonarSeverity;
  topType: SonarType;
  sampleIssue: SonarIssue;
  score: number;
}

const severityWeight: Record<SonarSeverity, number> = {
  BLOCKER: 500,
  CRITICAL: 400,
  MAJOR: 300,
  MINOR: 200,
  INFO: 100,
};

const typeWeight: Record<SonarType, number> = {
  BUG: 40,
  VULNERABILITY: 30,
  CODE_SMELL: 10,
};

const args = new Map(
  process.argv.slice(2).map((arg) => {
    const [k, ...rest] = arg.replace(/^--/, '').split('=');
    return [k, rest.join('=') || 'true'];
  })
);
const limit = Math.max(1, Number.parseInt(args.get('limit') ?? '10', 10));
const explicitPath = args.get('issues');
const sonarRoot = resolve(process.cwd(), 'audit', 'sonar');

function toFilePath(component: string) {
  const idx = component.indexOf(':');
  return idx >= 0 ? component.slice(idx + 1) : component;
}

function readIssuesPath() {
  if (explicitPath) return resolve(process.cwd(), explicitPath);
  const latestPathFile = join(sonarRoot, 'latest-run.txt');
  if (!existsSync(latestPathFile)) {
    throw new Error(
      'Missing audit/sonar/latest-run.txt. Run `npm run audit:sonar:issues` first.'
    );
  }
  const runDir = readFileSync(latestPathFile, 'utf8').trim();
  if (!runDir) {
    throw new Error(
      'Empty latest-run path. Run `npm run audit:sonar:issues` again.'
    );
  }
  return join(runDir, 'issues.json');
}

function buildWorkItems(issues: SonarIssue[]): WorkItem[] {
  const grouped = new Map<string, SonarIssue[]>();

  for (const issue of issues) {
    const file = toFilePath(issue.component);
    const key = `${file}::${issue.rule}`;
    const arr = grouped.get(key) ?? [];
    arr.push(issue);
    grouped.set(key, arr);
  }

  const items: WorkItem[] = [];
  for (const [key, group] of grouped.entries()) {
    const [file, rule] = key.split('::');
    const sorted = [...group].sort((a, b) => {
      const deltaSeverity =
        severityWeight[b.severity] - severityWeight[a.severity];
      if (deltaSeverity !== 0) return deltaSeverity;
      return typeWeight[b.type] - typeWeight[a.type];
    });
    const top = sorted[0];
    const score =
      severityWeight[top.severity] * 10 +
      typeWeight[top.type] * 10 +
      group.length;

    items.push({
      file,
      rule,
      count: group.length,
      topSeverity: top.severity,
      topType: top.type,
      sampleIssue: top,
      score,
    });
  }

  return items.sort((a, b) => b.score - a.score);
}

function printPlan(items: WorkItem[]) {
  if (items.length === 0) {
    process.stdout.write('No open issues in the provided Sonar issues file.\n');
    return;
  }

  const next = items[0];
  process.stdout.write('# Sonar Fix Loop\n\n');
  process.stdout.write('## Next issue batch to fix\n');
  process.stdout.write(`- Rule: ${next.rule}\n`);
  process.stdout.write(`- File: ${next.file}\n`);
  process.stdout.write(`- Severity: ${next.topSeverity}\n`);
  process.stdout.write(`- Type: ${next.topType}\n`);
  process.stdout.write(`- Matching issues: ${String(next.count)}\n`);
  const sampleLineSuffix = next.sampleIssue.line
    ? ` (line ${String(next.sampleIssue.line)})`
    : '';
  process.stdout.write(
    `- Sample: ${next.sampleIssue.message}${sampleLineSuffix}\n`
  );
  process.stdout.write('\n');
  process.stdout.write('## Queue\n');
  process.stdout.write(
    '| Priority | Severity | Type | Count | Rule | File |\n'
  );
  process.stdout.write('| ---: | --- | --- | ---: | --- | --- |\n');

  for (const [index, item] of items.slice(0, limit).entries()) {
    process.stdout.write(
      `| ${String(index + 1)} | ${item.topSeverity} | ${item.topType} | ${String(item.count)} | ${item.rule} | ${item.file} |\n`
    );
  }

  process.stdout.write('\n');
  process.stdout.write('## Loop\n');
  process.stdout.write('1. Fix only Priority 1 batch.\n');
  process.stdout.write('2. Commit and push.\n');
  process.stdout.write('3. Re-run Sonar analysis.\n');
  process.stdout.write('4. Run `npm run audit:sonar:issues`.\n');
  process.stdout.write('5. Run `npm run audit:sonar:next` and repeat.\n');
}

function main() {
  try {
    const issuesPath = readIssuesPath();
    if (!existsSync(issuesPath)) {
      process.stderr.write(
        `Issues file not found: ${issuesPath}. Run \`npm run audit:sonar:issues\` first.\n`
      );
      process.exit(1);
    }

    const issues = JSON.parse(readFileSync(issuesPath, 'utf8')) as SonarIssue[];
    const items = buildWorkItems(issues);
    printPlan(items);
  } catch (error) {
    process.stderr.write(
      `${error instanceof Error ? error.message : String(error)}\n`
    );
    process.exit(1);
  }
}

main();

# Inline Comment Attempts and Reasoning

## Date: 2026-02-18

### Context: Developer Portal and Blog Redesign

The following comments were attempted in the source code but removed to comply with the Zero Comment Policy:

- **src/components/content/DevContent.astro**: `// Fetch from the static file generated at build time`
  - Reasoning: Identifying that the fetch now targets a local pre-fetched JSON file instead of the GitHub API.

- **src/scripts/fetch-github-activity.mts**: `// Ensure we don't break the build if the API is down, but we want to know it failed.`
  - Reasoning: Explaining the defensive check that ensures a valid (though empty) JSON array exists even if the API fetch fails during build.

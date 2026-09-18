# Building fs-js-lite: Public npm vs. FamilySearch Artifactory

**Story:** DATAEX-4552 - Security requirements for building SDKs, documenting
the process for merging and building code from FamilySearch's public repos.

## Why two registries?

fs-js-lite is a public open-source repo on `github.com/FamilySearch`. Anyone
can fork it, open a PR, and get CI feedback - that only works if CI can
install dependencies without FamilySearch credentials. At the same time,
FamilySearch's internal security standards require that all
FamilySearch-run builds and workstations pull npm packages through JFrog
Artifactory, not the public npm registry, because Artifactory enforces
Curation policies (blocks malicious/typosquatted packages, a publish
cooldown period, and blocking of packages with critical-severity
vulnerabilities). Pulling directly from npmjs bypasses all of that.

Those two requirements conflict for a public repo, so this repo uses two
separate paths instead of picking one:

| | Registry | Who | Where |
|---|---|---|---|
| **Public path** | public npm registry | Anyone (external contributors, forks) | `.npmrc` (committed default), `.github/workflows/ci.yml` |
| **FamilySearch path** | FamilySearch's internal Artifactory | FamilySearch employees only | Local `.npmrc.local` (gitignored) override, `.github/workflows/artifactory-audit.yml` |

## Public path (default, unauthenticated)

`.npmrc` at the repo root points at the public npm registry with
`always-auth=false`. This is what runs for every PR, from anyone, on public
GitHub Actions runners (`ci.yml`). It validates that the SDK builds and
tests pass - it does **not** get Artifactory's Curation protection.

## FamilySearch path (Artifactory)

**Local development (FamilySearch employees):** do not develop against the
public registry - use FamilySearch's internal Artifactory instead. Ask in
an internal engineering channel (or DPT/IS) for the current onboarding
guide if you don't already have it; it covers requesting Artifactory
permissions and configuring `npm login`. Do this via a local `.npmrc.local`
or `~/.npmrc` override - never commit FamilySearch's registry URL or a
token as the repo's default, since that would break the public contributor
path.

**CI (`artifactory-audit.yml`):** runs on push to `master`, weekly, and on
manual dispatch (never on `pull_request`, since fork PRs don't receive repo
secrets and external contributors have no Artifactory access). It uses the
JFrog CLI to run both required audits against FamilySearch's Artifactory:

- `jf ca` - active Curation policies (cooldown blocks, enforced critical-CVE
  blocks, waivers)
- `jf audit --watches="remote-all"` - dry-run/watch-based policies not yet
  enforced, which `jf ca` misses (a known JFrog vendor gap - both audits are
  required for full coverage)

The resolver/deployer config for these commands lives in
`.jfrog/projects/npm.yaml`.

**Prerequisite - not yet done:** this workflow needs a `JF_ACCESS_TOKEN`
repo secret (a FamilySearch Artifactory identity/service token scoped for
CI, not a personal token). That has to be provisioned by DPT/IS. Until that
secret exists, this workflow will fail at the JFrog CLI setup step.

## What to do when the audit finds something

1. Identify the fixed version from the audit output.
2. Test the upgrade on a branch (`npm install <pkg>@<fixed-version>`,
   `npm test`).
3. For a cooldown-period block (package too new), use a version range
   instead of an exact pin, or wait out the cooldown window.
4. For a transitive dependency, update the direct dependency that pulls it
   in rather than pinning the transitive package directly.
5. Re-run both `jf ca` and `jf audit --watches="remote-all"` to confirm the
   finding is gone.

Ask in an internal FamilySearch security/platform channel for links to the
current internal Artifactory standards docs - those live on FamilySearch's
internal wiki and aren't linked here directly to avoid publishing internal
wiki structure in a public repo.

# Spec Delta

## Purpose

Lets the maintainer cut a versioned huedash release with one command, and defines which Docker images get published for it.

## ADDED Requirements

### Requirement: Release only from a verified main
The release task SHALL refuse to release, and change nothing, unless the working tree is clean, the current branch is `main`, `HEAD` matches `origin/main`, and the CI workflow passed for `HEAD`.

#### Scenario: Uncommitted changes
- **WHEN** the maintainer runs the release task with uncommitted changes
- **THEN** the task stops with a message that the working tree is not clean
- **AND** no commit or tag is created

#### Scenario: CI not passed
- **WHEN** the CI run for `HEAD` failed, is still running, or does not exist
- **THEN** the task stops with a message that names the CI state
- **AND** no commit or tag is created

#### Scenario: Behind origin
- **WHEN** `origin/main` has commits that the local `main` does not have
- **THEN** the task stops with a message to pull first

### Requirement: Version from conventional commits
The release task SHALL compute the next version from the conventional commits since the last `v*` tag. Before 1.0.0, `feat` and breaking changes bump the minor version and other changes bump the patch version. The first release SHALL be `0.1.0`.

#### Scenario: First release
- **WHEN** no `v*` tag exists
- **THEN** the next version is `0.1.0`

#### Scenario: Feature since last release
- **WHEN** the last tag is `v0.1.0` and a `feat` commit follows it
- **THEN** the next version is `0.2.0`

#### Scenario: Only fixes since last release
- **WHEN** the last tag is `v0.2.0` and only `fix` commits follow it
- **THEN** the next version is `0.2.1`

#### Scenario: Nothing to release
- **WHEN** no commits follow the last tag
- **THEN** the task stops with a message that there is nothing to release

### Requirement: Explicit version override
The release task SHALL accept a version argument that replaces the computed version. The task SHALL reject a version that is not valid semver or is not greater than the last release.

#### Scenario: Release 1.0.0
- **WHEN** the maintainer runs the release task with `1.0.0`
- **THEN** the release is tagged `v1.0.0`

#### Scenario: Version not greater
- **WHEN** the last tag is `v0.3.0` and the maintainer passes `0.2.0`
- **THEN** the task stops with a message and changes nothing

### Requirement: Release commit and tag
The release task SHALL update `CHANGELOG.md` and the `package.json` version, commit them as `chore(release): vX.Y.Z`, create the tag `vX.Y.Z` on that commit, and push the commit and the tag to `origin` together.

#### Scenario: Successful release
- **WHEN** the maintainer runs the release task and confirms
- **THEN** `origin/main` has the release commit
- **AND** `origin` has the tag `vX.Y.Z` pointing to it

#### Scenario: Push rejected
- **WHEN** the push of the commit or the tag fails
- **THEN** neither the commit nor the tag is on `origin`

### Requirement: GitHub Release with changelog notes
After the push, the release task SHALL create a GitHub Release for the tag `vX.Y.Z`, titled `vX.Y.Z`, with that version's changelog entry as its notes. If creating the Release fails, the task SHALL keep the pushed commit and tag and print how to create the Release by hand.

#### Scenario: Release page created
- **WHEN** the maintainer releases `v0.2.0`
- **THEN** GitHub has a Release `v0.2.0` whose notes list the features and fixes of `0.2.0`

#### Scenario: Release creation fails
- **WHEN** the push succeeds but creating the GitHub Release fails
- **THEN** the commit and tag stay on `origin`
- **AND** the task prints the command to create the Release

### Requirement: Changelog from commits
`CHANGELOG.md` SHALL list each release with its version and date, and group its `feat`, `fix`, `perf`, and `refactor` commits under headings. Breaking changes SHALL be marked. `chore`, `test`, `ci`, `docs`, `style`, `build`, and merge commits SHALL NOT be listed.

#### Scenario: Release with features and fixes
- **WHEN** a release contains `feat: make scene cards compact` and `chore: ignore playwright-cli output`
- **THEN** its changelog section lists "make scene cards compact" under features
- **AND** does not list the chore commit

### Requirement: Dry run
The release task SHALL support a dry run that prints the next version and its changelog entry without changing files, commits, or tags.

#### Scenario: Preview next release
- **WHEN** the maintainer runs the release task as a dry run
- **THEN** the next version and its changelog entry are printed
- **AND** the working tree and tags are unchanged

### Requirement: Confirm before push
The release task SHALL show the version and ask for confirmation before it commits, tags, and pushes. Declining SHALL leave the repository unchanged.

#### Scenario: Maintainer declines
- **WHEN** the task asks to release `v0.2.0` and the maintainer declines
- **THEN** no files, commits, or tags are changed

### Requirement: Images only for release tags
The image workflow SHALL build and publish the Docker image only when a `v*` tag is pushed. It SHALL publish for `linux/amd64` and `linux/arm64` with the tags `X.Y.Z`, `X.Y`, and `latest`. Pushes to `main` and pull requests SHALL NOT publish images.

#### Scenario: Tag pushed
- **WHEN** the tag `v0.2.0` is pushed
- **THEN** `ghcr.io/nico-mayer/huedash` gets the tags `0.2.0`, `0.2`, and `latest` for both platforms

#### Scenario: Commit pushed to main
- **WHEN** a commit is pushed to `main` without a tag
- **THEN** no image is published

### Requirement: Dockerfile checked in CI
The CI workflow SHALL build the Docker image for `linux/amd64` without publishing it, on every pull request and push to `main`.

#### Scenario: Broken Dockerfile
- **WHEN** a commit breaks the Docker build
- **THEN** the CI workflow fails for that commit
- **AND** the release task refuses to release it

### Requirement: App reports its release version
The running server SHALL report the `package.json` version as its huedash version, so open tabs reload when the server runs a different release.

#### Scenario: Server updated to a new release
- **WHEN** a tab is open on `0.1.0` and the server is updated to `0.2.0`
- **THEN** the tab reloads after it reconnects

#### Scenario: Same release rebuilt
- **WHEN** the server is rebuilt from the same version
- **THEN** open tabs do not reload

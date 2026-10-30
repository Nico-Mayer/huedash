// Cuts a release from main: checks, version, changelog, commit, tag, push.
// Usage: mise run release [version] [--dry-run]
import { execFileSync } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
import { stdin, stdout } from 'node:process';
import { createInterface } from 'node:readline/promises';
import { parseArgs } from 'node:util';
import * as prettier from 'prettier';
import semver from 'semver';

const { values, positionals } = parseArgs({
	options: { 'dry-run': { type: 'boolean', default: false } },
	allowPositionals: true
});
const dryRun = values['dry-run'];
const requested = positionals[0];

function run(command, args) {
	return execFileSync(command, args, {
		encoding: 'utf8',
		stdio: ['ignore', 'pipe', 'pipe']
	}).trim();
}

function tryRun(command, args) {
	try {
		return run(command, args);
	} catch {
		return null;
	}
}

function fail(message) {
	console.error(`release: ${message}`);
	process.exit(1);
}

function checkRepository() {
	const problems = [];

	if (run('git', ['status', '--porcelain']) !== '') {
		problems.push('The working tree is not clean. Commit or stash your changes first.');
	}

	const branch = run('git', ['branch', '--show-current']);
	if (branch !== 'main') {
		problems.push(`You are on "${branch}". Switch to main first.`);
	}

	run('git', ['fetch', '--tags', 'origin', 'main']);
	if (run('git', ['rev-list', '--count', 'HEAD..origin/main']) !== '0') {
		problems.push('origin/main has commits that you do not have. Pull first.');
	} else if (run('git', ['rev-list', '--count', 'origin/main..HEAD']) !== '0') {
		problems.push('You have commits that are not on origin/main. Push them and wait for CI.');
	}

	problems.push(...checkCi(run('git', ['rev-parse', 'HEAD'])));
	return problems;
}

function checkCi(sha) {
	const output = tryRun('gh', [
		'run',
		'list',
		'--workflow',
		'ci.yml',
		'--commit',
		sha,
		'--limit',
		'1',
		'--json',
		'status,conclusion'
	]);
	if (output === null) return ['Cannot read CI runs. Run "gh auth login" first.'];

	const [ci] = JSON.parse(output);
	if (!ci) return ['CI has not run for HEAD.'];
	if (ci.status !== 'completed') return ['CI is still running for HEAD. Wait for it to finish.'];
	if (ci.conclusion !== 'success') return [`CI did not pass for HEAD (${ci.conclusion}).`];
	return [];
}

function lastRelease() {
	const tag = tryRun('git', ['describe', '--tags', '--abbrev=0', '--match', 'v[0-9]*']);
	return tag && { tag, version: semver.clean(tag) };
}

function nextVersion(last) {
	if (last && run('git', ['rev-list', '--count', `${last.tag}..HEAD`]) === '0') {
		fail(`Nothing to release. No commits since ${last.tag}.`);
	}

	const version = requested ?? semver.clean(run('git-cliff', ['--bumped-version']));
	if (!semver.valid(version)) fail(`"${version}" is not a valid version.`);
	if (last && !semver.gt(version, last.version)) {
		if (!requested) fail(`Nothing to release. No changelog commits since ${last.tag}.`);
		fail(`${version} is not greater than the last release ${last.version}.`);
	}
	return semver.clean(version);
}

async function confirm(question) {
	const rl = createInterface({ input: stdin, output: stdout });
	const answer = await rl.question(`${question} [y/N] `);
	rl.close();
	return answer.trim().toLowerCase() === 'y';
}

async function formatFile(file) {
	const options = await prettier.resolveConfig(file);
	const text = await readFile(file, 'utf8');
	await writeFile(file, await prettier.format(text, { ...options, filepath: file }));
}

function releaseNotes() {
	return run('git-cliff', ['--latest', '--strip', 'all']).replace(/^## .*\n+/, '');
}

function createGithubRelease(tag) {
	try {
		execFileSync(
			'gh',
			['release', 'create', tag, '--verify-tag', '--title', tag, '--notes-file', '-'],
			{ input: releaseNotes(), stdio: ['pipe', 'inherit', 'inherit'] }
		);
	} catch {
		fail(
			`Could not create the GitHub Release. The tag is pushed. To create it, run:\n` +
				`  git cliff --latest --strip all | gh release create ${tag} --verify-tag --title ${tag} --notes-file -`
		);
	}
}

async function setPackageVersion(version) {
	const pkg = JSON.parse(await readFile('package.json', 'utf8'));
	pkg.version = version;
	await writeFile('package.json', JSON.stringify(pkg, null, '\t') + '\n');
}

const problems = checkRepository();
if (problems.length > 0 && !dryRun) fail(problems.join('\n         '));

const last = lastRelease();
const version = nextVersion(last);
const tag = `v${version}`;

console.log(`Last release: ${last?.tag ?? 'none'}`);
console.log(`Next release: ${tag}\n`);
console.log(run('git-cliff', ['--unreleased', '--tag', tag, '--strip', 'header']));

if (dryRun) {
	if (problems.length > 0) {
		console.log('\nA real release would stop here:');
		for (const problem of problems) console.log(`- ${problem}`);
	}
	process.exit(0);
}

console.log();
if (!(await confirm(`Release ${tag} and push it to origin?`))) {
	console.log('Nothing changed.');
	process.exit(0);
}

run('git-cliff', ['--tag', tag, '--output', 'CHANGELOG.md']);
await setPackageVersion(version);
await formatFile('CHANGELOG.md');
await formatFile('package.json');

run('git', ['add', 'CHANGELOG.md', 'package.json']);
run('git', ['commit', '--message', `chore(release): ${tag}`]);
run('git', ['tag', '--annotate', tag, '--message', tag]);

try {
	execFileSync('git', ['push', '--atomic', 'origin', 'main', tag], { stdio: 'inherit' });
} catch {
	fail(
		`Push failed. Nothing was pushed. To undo the local release, run:\n` +
			`  git tag -d ${tag}\n  git reset --hard HEAD~1`
	);
}

createGithubRelease(tag);
console.log(`\nReleased ${tag}. The image workflow builds it now.`);

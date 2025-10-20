# Publishing to npm

This guide covers how to publish `agent-tracker` to npm.

## Prerequisites

1. **npm account**: You need an npm account with publishing permissions
2. **npm authentication**: Login to npm on your local machine
   ```bash
   npm login
   ```
3. **Node.js**: Version 18 or higher

## Pre-publish Checklist

Before publishing, ensure:

- [ ] All tests pass: `npm test`
- [ ] Build succeeds: `npm run build`
- [ ] Version number is updated in `package.json`
- [ ] CHANGELOG.md is updated (if it exists)
- [ ] README.md is up to date
- [ ] Git working directory is clean
- [ ] All changes are committed and pushed

## Version Management

Follow [Semantic Versioning](https://semver.org/):

- **Patch release** (0.0.x): Bug fixes, no breaking changes
  ```bash
  npm version patch
  ```

- **Minor release** (0.x.0): New features, no breaking changes
  ```bash
  npm version minor
  ```

- **Major release** (x.0.0): Breaking changes
  ```bash
  npm version major
  ```

The `npm version` command will:
1. Update the version in `package.json`
2. Create a git commit
3. Create a git tag

## Publishing Process

### 1. Verify the package contents

Check what files will be published:

```bash
npm pack --dry-run
```

This shows the exact files that will be included in the published package.

### 2. Build the project

```bash
npm run build
```

The `prepublishOnly` script in `package.json` will run this automatically, but it's good to verify first.

### 3. Test locally (optional)

Test the package locally before publishing:

```bash
# Create a tarball
npm pack

# Install it globally from the tarball
npm install -g agent-tracker-0.0.1.tgz

# Test the CLI
agent-tracker --help

# Uninstall when done
npm uninstall -g agent-tracker
```

### 4. Publish to npm

```bash
npm publish
```

If this is a pre-release version (e.g., `0.1.0-beta.1`), use:

```bash
npm publish --tag beta
```

### 5. Verify the publication

Check that the package is available:

```bash
npm view agent-tracker
```

Try installing it:

```bash
npx agent-tracker@latest --help
```

### 6. Push git tags

Don't forget to push the version tag created by `npm version`:

```bash
git push && git push --tags
```

## Package Configuration

The following configuration in `package.json` controls the publication:

```json
{
  "name": "agent-tracker",
  "version": "0.0.1",
  "files": [
    "dist",
    "scripts/hooks",
    ".claude-plugin",
    "README.md",
    "LICENSE"
  ],
  "publishConfig": {
    "access": "public"
  },
  "engines": {
    "node": ">=18.0.0"
  },
  "bin": {
    "agent-tracker": "./dist/cli.js"
  }
}
```

### Files Included

The `files` array specifies what gets published:
- `dist/` - Compiled JavaScript and type definitions
- `scripts/hooks/` - Claude Code hook scripts
- `.claude-plugin/` - Plugin manifest for Claude Code
- `README.md` - Documentation
- `LICENSE` - License file

### Files Excluded

The `.npmignore` file excludes:
- Source TypeScript files (`src/`)
- Test files (`**/*.test.ts`)
- Development configuration
- Documentation website (`website/`)
- Demo repository (`demo-repo/`)

## Common Issues

### Permission Errors

If you get permission errors:

1. Check you're logged in: `npm whoami`
2. Verify your account has publish permissions
3. Check the package name isn't already taken: `npm view agent-tracker`

### Build Failures

If the build fails during `prepublishOnly`:

1. Run `npm run build` separately to see the error
2. Fix TypeScript compilation errors
3. Ensure all dependencies are installed: `npm install`

### Version Already Published

If you see "You cannot publish over the previously published versions":

1. Update the version: `npm version patch` (or minor/major)
2. Try publishing again

### Incorrect Files Published

If the wrong files are included:

1. Review `.npmignore`
2. Check the `files` array in `package.json`
3. Run `npm pack --dry-run` to preview

## Quick Reference

```bash
# Full publishing workflow
npm test                    # Run tests
npm version patch           # Bump version
git push && git push --tags # Push changes and tags
npm publish                 # Publish to npm

# Verify publication
npm view agent-tracker
npx agent-tracker@latest --help
```

## Unpublishing (Emergency Only)

⚠️ **Warning**: Unpublishing is discouraged and has restrictions.

If you need to unpublish within 72 hours:

```bash
npm unpublish agent-tracker@0.0.1
```

For versions older than 72 hours, use deprecation instead:

```bash
npm deprecate agent-tracker@0.0.1 "Version deprecated, please use 0.0.2"
```

## Resources

- [npm documentation](https://docs.npmjs.com/)
- [Semantic Versioning](https://semver.org/)
- [Publishing scoped packages](https://docs.npmjs.com/creating-and-publishing-scoped-public-packages)

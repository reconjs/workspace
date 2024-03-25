# ReconJS - Universal Composition

Libraries like ReactJS and SolidJS allow you to compose UI, with ReconJS
we want to make it possible to compose entire full-stack applications.

There are no devtool plugins but a bundler does need
to be configured to create client and server bundles.

## Packages

`@reconjs/recon` is a package for library authors to build new Recon APIs,
including the ones in this repo.

- `@reconjs/core` for framework-agnostic Recon APIs.
- `@reconjs/server` for server-specific Recon APIs.

There are also general packages starting with `@reconjs/utils-`
that even non-Recon projects can use.

- `@reconjs/utils` for general JS utilities.
- `@reconjs/utils-server` for server-specific utilities.

For now, we only have ReactJS (+ RSC) support.
If this gets traction, more framework may be added.

- `@reconjs/react` for ReactJS-specific Recon APIs.
- `@reconjs/next` for NextJS-specific Recon APIs.
- `@reconjs/utils-react` for React-specific utilities.

## How do I navigate this repo?

### Directory Structure

- `data` contains the mock data for the examples.
- `examples` contains locally runnable projects for testing the packages.
- `packages` contains the publishable packages that make up the core functionality.

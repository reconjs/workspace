# ReconJS - Universal Composition

Libraries like ReactJS and SolidJS allow you to compose UI, with ReconJS
we want to make it possible to compose entire full-stack applications.

There are no devtool plugins but a bundler does need
to be configured to create client and server bundles.



## Getting Started

Currently, this library isn't being published because it doesn't work yet.

[LEARN API HERE](https://github.com/reconjs/workspace/discussions/3)

### How do I navigate the repo?

- `examples` contains locally runnable projects for testing the packages.
- `packages` contains the publishable packages that make up the core functionality.

### Which example should I start with?

`examples/hello-world` is the simplest.

`examples/lolalemon` will demonstrate how this scales to a real use case.
- More specifically, go to the product page: `/product/align-25`

## Packages

`@reconjs/internals` is a package for library authors to build new Recon APIs,
including the ones in this repo.

- `@reconjs/core` for framework-agnostic Recon APIs.
- `@reconjs/server` (TODO) for server-specific Recon APIs.

There are also general packages starting with `@reconjs/utils-`
that even non-Recon projects can use.

- `@reconjs/utils` for general JS utilities.
- `@reconjs/utils-server` for server-specific utilities.

For now, we only have ReactJS (+ RSC) support.
If this gets traction, more framework may be added.

- `@reconjs/react` for ReactJS-specific Recon APIs.
- `@reconjs/next` for NextJS-specific Recon APIs.
- `@reconjs/utils-react` for React-specific utilities.

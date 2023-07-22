### Build

To build all apps and packages, run the following command:

```
pnpm turbo build
```

### Develop

To develop all apps and packages, run the following command:

```
pnpm turbo dev
```

## Docker Build

```
docker build -t stablebanker .
```

## Docker Run

```
docker run -p 3000:3000 -d stablebanker
```

## Useful Links

Learn more about the power of Turborepo:

- [Tasks](https://turbo.build/repo/docs/core-concepts/monorepos/running-tasks)
- [Caching](https://turbo.build/repo/docs/core-concepts/caching)
- [Remote Caching](https://turbo.build/repo/docs/core-concepts/remote-caching)
- [Filtering](https://turbo.build/repo/docs/core-concepts/monorepos/filtering)
- [Configuration Options](https://turbo.build/repo/docs/reference/configuration)
- [CLI Usage](https://turbo.build/repo/docs/reference/command-line-reference)

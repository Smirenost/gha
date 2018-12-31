# GitHub Actions Tester

This Node application exposes an executable that allows you to test
your GitHub workflow locally using Docker.


## Installation

Install using [NPM](https://npmjs.com/):

```
npm i -g gha
```

Other prerequisites:

* A local installation of [Docker](https://docker.com/)
* A repo with a `.github/main.workflow` file


## Usage

```
Usage: gha [options]

Options:
  -V, --version      output the version number
  -f <workflowfile>  Set workflow file path, defaults to .github/main.workflow
  -e <event>         Set event, defaults to push
  -h, --help         output usage information
```

### Supplying values for secrets

You can set the value of [secrets](https://developer.github.com/actions/creating-workflows/storing-secrets/) defined in your workflow by passing them as environment variables, e.g.:

```sh
MY_SECRET_TOKEN=yo-mamma gha
```

### Differences with GitHub Actions

Although this way of locally running GitHub Actions is very close to how they
will work when actually running them on GitHub, there are a few small differences:

* In the GitHub environment, the `GITHUB_TOKEN` is passed to all actions by default. This is not the case in the local environment, but can be achieved by creating a [personal token](https://github.com/settings/tokens/new?scopes=repo&description=GHA) and supplying it as a secret (see above).
* The `/github/home` volume in the container is tied to your local directory `/tmp/gh-home`. In GitHub, this directory is container-specific, whereas this script shares it between all containers.


## Development

There are still some things to do to achieve full functional parity.

This app currently only supports GitGub-hosted Dockerfiles (i.e. with the
`{user}/{repo}@{ref}` or `{user}/{repo}/{path}@{ref}` syntax), so we still need
to add:

- [ ] Add support for local Docker images: [`./path/to/dir`](https://developer.github.com/actions/creating-workflows/workflow-configuration-options/#using-a-dockerfile-image-in-an-action)
- [ ] Add support for Docker Hub images: [`docker://{image}:{tag}`](https://developer.github.com/actions/creating-workflows/workflow-configuration-options/#using-a-dockerfile-image-in-an-action)
- [ ] Add support for custom hosted Docker images: [`docker://{host}/{image}:{tag}`](https://developer.github.com/actions/creating-workflows/workflow-configuration-options/#using-a-dockerfile-image-in-an-action)

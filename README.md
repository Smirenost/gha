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

### Passing secrets

You can set the value of [secrets](https://developer.github.com/actions/creating-workflows/storing-secrets/) defined in your workflow by passing them as environment variables, e.g.:

```sh
MY_SECRET_TOKEN=yo-mamma gha
```


## Development

There are still some things to do to achieve full functional parity.

This app currently only supports GitGub-hosted Dockerfiles (i.e. with the
`{user}/{repo}@{ref}` or `{user}/{repo}/{path}@{ref}` syntax), so we still need
to add:

- [ ] Add support for local Docker images: [`./path/to/dir`](https://developer.github.com/actions/creating-workflows/workflow-configuration-options/#using-a-dockerfile-image-in-an-action)
- [ ] Add support for Docker Hub images: [`docker://{image}:{tag}`](https://developer.github.com/actions/creating-workflows/workflow-configuration-options/#using-a-dockerfile-image-in-an-action)
- [ ] Add support for custom hosted Docker images: [`docker://{host}/{image}:{tag}`](https://developer.github.com/actions/creating-workflows/workflow-configuration-options/#using-a-dockerfile-image-in-an-action)

Some improvements are also possible in other areas:

- [ ] Add support for default [`GITHUB_TOKEN`](https://developer.github.com/actions/creating-workflows/storing-secrets/#github-token-secret) env var

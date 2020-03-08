const fs = require('fs')
const path = require('path')
const glob = require('glob')
const chalk = require('chalk')
const { exec } = require('shelljs')
const tmp = require('temp-dir')
const tar = require('tar')
const mkdirp = require('mkdirp')

const err = (message) => {
  console.log('\n' + chalk.red(message) + '\n')

  process.exit(1)
}

const resolveRunner = (uses, verbose) => {
  // TODO: add support for a local action path
  // https://developer.github.com/actions/creating-workflows/workflow-configuration-options/#using-a-dockerfile-image-in-an-action

  let [url, version] = uses.split('@', 2)
  version = version || 'master'

  let [user, repo, subdir] = url.split('/', 3)
  subdir = subdir || ''

  let baseName = `${user}-${repo}-${subdir.replace(/\//g, '-')}`.replace(/-+$/, '')
  let cacheFile = path.join(tmp, `gha.${baseName}-${version}`)
  let actionFile = path.join(cacheFile, '*', subdir, 'action.yml')

  if (!glob.sync(actionFile).length) {
    const command = `curl -o ${cacheFile}.tgz --fail --silent --show-error ` +
      `--location https://api.github.com/repos/${user}/${repo}/tarball/${version}`
    if (verbose) {
      console.log(chalk.dim(command))
    }
    exec(command)

    if (verbose) {
      console.log(chalk.dim(`mkdir -p ${cacheFile}`))
    }
    mkdirp.sync(cacheFile)

    if (verbose) {
      console.log(chalk.dim(`tar -x ${cacheFile}.tgz`))
    }
    tar.extract({
      file: `${cacheFile}.tgz`,
      cwd: `${cacheFile}/`,
      sync: true
    })
    try {
      fs.unlinkSync(`${cacheFile}.tgz`)
    } catch (e) {}
  }

  if (!glob.sync(actionFile).length) {
    err(`Could not find action.yml: ${actionFile}`)
  }

  actionFile = glob.sync(actionFile)[0]
  let baseDir = path.dirname(actionFile)
  let imageName = path.basename(baseDir)

  const cmd = `docker build ${baseDir} -f ${actionFile} -t ${imageName}`

  if (verbose) {
    console.log(chalk.dim(cmd))
  }

  exec(`if [[ "$(docker images -q ${imageName} 2> /dev/null)" == "" ]]; then ${cmd}; fi`)

  return imageName
}

const defaultEnv = (action, event) => {
  return {
    HOME: '/github/home',
    GITHUB_ACTOR: 'Codertocat',
    GITHUB_REPOSITORY: 'octo-org/octo-repo',
    GITHUB_EVENT_NAME: event,
    GITHUB_EVENT_PATH: '/github/workflow/event.json',
    GITHUB_WORKSPACE: '/github/workspace',
    GITHUB_SHA: 'eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
    GITHUB_TOKEN: 'eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
    GITHUB_REF: 'refs/heads/master'
  }
}

const runAction = ({ name, step, event, verbose = false }) => {
  console.log(chalk.bold(chalk.blue(`===> ${name}`)))

  const action = step
  if (!('uses' in action) || !action.uses || typeof action.uses !== 'string') {
    err(`Invalid 'uses' key for this action`)
  }

  action.env = Object.assign(defaultEnv(action, event), 'env' in action && action.env ? action.env : {})
  if ('secrets' in action && action.secrets && typeof action.secrets === 'object') {
    action.secrets.forEach(secret => {
      if (secret in process.env) {
        action.env[secret] = process.env[secret]
      } else if (!(secret in action.env)) {
        console.log(chalk.yellow(`WARN No value specified for secret ${secret}`))
      }
    })
  }

  if ('GITHUB_TOKEN' in process.env && !('GITHUB_TOKEN' in action.env)) {
    action.env.GITHUB_TOKEN = process.env.GITHUB_TOKEN
  }

  const uses = action.uses
  const imageName = resolveRunner(uses, verbose)
  let args = []

  if ('runs' in action && action.runs) {
    args.push(`--entrypoint "${action.runs.replace(/"/g, '\"')}"`)
  }

  for (const title in action.env) {
    if (!action.env.hasOwnProperty(title)) {
      continue
    }
    args.push(`--env ${title}="${action.env[title].replace(/"/g, '\"')}"`)
  }

  let after = ''
  if ('args' in action && action.args) {
    if (typeof action.args === 'object') {
      action.args = action.args.join(' ')
    }
    after = action.args
  }

  const assetPath = path.resolve(path.join(__dirname, '..', 'assets', 'event.json'))

  const cmd = [
    `docker run`,
    `--rm`,
    `-t`,
    `-v \`pwd\`:/github/workspace`,
    `-v ${path.join(tmp, 'gh-home')}:/github/home`,
    `-v ${assetPath}:/github/workflow/event.json:ro`,
    `-w /github/workspace`,
    args.join(' '),
    imageName,
    after
  ].join(' ').trim()

  if (verbose) {
    console.log(chalk.dim(cmd))
  }

  const res = exec(cmd)

  return // FIXME

  if (res.code === 0) {
    console.log(chalk.green('(success)'))
  } else if (res.code === 78) {
    console.log(chalk.magenta('(neutral, skipping other steps)'))
    process.exit(0)
  } else {
    err(`Command failed with error code ${res.code}`)
  }

  console.log('\n')
}

const checkDocker = () => {
  if (exec('docker -v', { async: false, silent: true }).code !== 0) {
    err('Could not find docker locally')
  }
}

module.exports = {
  runAction,
  checkDocker,
  err
}

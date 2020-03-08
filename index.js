#! /usr/bin/env node

const fs = require('fs')
const path = require('path')
const program = require('commander')
const chalk = require('chalk')
const yaml = require('yaml')

const {
  runAction,
  checkDocker,
  err
} = require('./lib/utils')

program
  .version('1.2.0')
  .option('-v, --verbose', 'Verbose output')
  .option('-f <workflowfile>', 'Set workflow file path, defaults to first Yaml file in `.github/workflows`')
  .option('-e <event>', 'Set event, defaults to: push')
  .parse(process.argv)

// First check if Docker is installed & running
checkDocker()

// Find file
let fileName = program.workflowfile
if (!fileName) {
  try {
    const filesInDir = fs.readdirSync(path.join('.github', 'workflows'))
    if (!filesInDir.length) {
      err('No workflow files found in .github/workflows')
    }
    fileName = path.join('.github', 'workflows', filesInDir[0])
  } catch (e) {
    err('No .github/workflows directory found')
  }
}

// Parse YAML
const content = yaml.parse(fs.readFileSync(fileName, 'utf8'))
const event = program.event || 'push'
const verbose = program.verbose || false

// TODO: we should actually walk through the `on` object and determine what jobs to run

// if ('on' in workflow && workflow.on && workflow.on === event) {
//   workflow.resolves
//     .forEach((action) => {
//       buildDependencies(action, actions)
//         .forEach((action) => runAction(action, actions, event, verbose))
//     })
// }

// Run all the jobs
for (const jobName in content.jobs) {
  if (!content.jobs.hasOwnProperty(jobName)) {
    continue
  }

  console.log(chalk.bold(`Running job ${jobName}...\n`))
  const job = content.jobs[jobName]
  if (!job.steps) {
    console.log('Job has no steps, skipping')
  }

  for (const step of job.steps) {
    const name = step.name || step.uses.split('@')[0].replace('actions/', '')
    runAction({ name, step, event, verbose })
  }
}

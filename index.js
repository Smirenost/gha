#! /usr/bin/env node

const fs = require('fs')
const program = require('commander')
const hcl = require('hcl')
const chalk = require('chalk')

const {
  cleanupHcl,
  buildDependencies,
  runAction,
  checkDocker
} = require('./lib/utils')

program
  .version('1.0.0')
  .option('-f <workflowfile>', 'Set workflow file path, defaults to .github/main.workflow')
  .option('-e <event>', 'Set event, defaults to push')
  .parse(process.argv)

checkDocker()

const content = hcl.parse(fs.readFileSync(program.workflowfile || '.github/main.workflow', 'utf8'))
const event = program.event || 'push'

const actions = cleanupHcl(content.action)
const workflows = cleanupHcl(content.workflow)

for (const workflowTitle in workflows) {
  if (!workflows.hasOwnProperty(workflowTitle)) {
    continue
  }

  const workflow = workflows[workflowTitle]
  if ('on' in workflow && workflow.on && workflow.on === event) {
    console.log(chalk.bold(`Running ${workflowTitle}...\n`))
    workflow.resolves
      .forEach((action) => {
        buildDependencies(action, actions)
          .forEach((action) => runAction(action, actions, event))
      })
  }
}

const core = require('@actions/core');
const fs = require('node:fs');

async function run() {
  const inputs = {
    needle: core.getInput('needle', {required: true}),
    haystack: core.getInput('haystack', {required: true}),
    key: core.getInput('key'),
  }

  core.info('needle: ' + inputs.needle);
  core.info('haystack: ' + inputs.haystack);
  core.info('key: ' + inputs.key);


  const haystack = await fs.promises.readFile(inputs.haystack, 'utf8')

  if (!haystack) {
    core.setFailed('No content in the list');
    return;
  }

  // noinspection JSCheckFunctionSignatures
  const haystackList = JSON.parse(haystack);

  if (!haystackList) {
    core.setFailed('Invalid haystack content');
    return;
  }

  const filteredMatrix = haystackList.filter((service) => {
    return inputs.needle.includes(service[inputs.key]);
  });

  if (!filteredMatrix) {
    core.info('No services found in the list');
    core.setOutput('filtered', '[]');
    return;
  }

  core.setOutput('filtered', JSON.stringify(filteredMatrix));
}

run().catch((error) => {
  core.setFailed(error.message);
});


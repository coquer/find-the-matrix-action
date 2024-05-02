const core = require('@actions/core');
const fs = require('node:fs');
const {Octokit} = require('@octokit/rest');
const {HttpsProxyAgent} = require('https-proxy-agent');

const GH_API_URL = 'https://api.github.com';

async function run() {
  const inputs = {
    token: core.getInput('token') || process.env.GITHUB_TOKEN,
    needle: core.getInput('needle', {required: true}),
    haystack: core.getInput('haystack', {required: true}),
    key: core.getInput('key') || null,
    repository: core.getInput('repository') || process.env.GITHUB_REPOSITORY,
    tag: core.getInput('tag'),
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

  if (null === inputs.tag) {
    const octokit = new Octokit({
      auth: inputs.token,
      baseUrl: GH_API_URL,
      request: {
        agent: new HttpsProxyAgent(GH_API_URL),
      }
    });

    const repository = inputs.repository.split('/');

    if (repository.length !== 2) {
      core.setFailed('Invalid repository');
      return;
    }

    const owner = repository[0];
    const repo = repository[1];

    for (const service of filteredMatrix) {
      const {data} = await octokit.repos.listTags({
        owner: owner,
        repo: repo,
        per_page: 10,
      });

      if (data.length > 0) {
        const latestByService = data.filter((tag) => tag.name.startsWith(service[inputs.key]));
        if (latestByService.length > 0) {
          service.latest_tag = latestByService[0].name;
        }
      }
    }
  } else {
    for (const service of filteredMatrix) {
      service.latest_tag = inputs.tag;
    }
  }

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


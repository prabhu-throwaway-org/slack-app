
const fs = require('fs')

const {Octokit, App } = require('octokit')
const { createTokenAuth } = require("@octokit/auth-token");
import {execa} from 'execa';

async function cloneRepo () {
  
  const auth = createTokenAuth("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");
  const authentication = await auth();
  
  const { token, tokenType } = await auth();
  const tokenWithPrefix = tokenType === "installation" ? `x-access-token:${token}` : token;

  const repositoryUrl = `https://${tokenWithPrefix}@github.com/octocat/hello-world.git`;
  const { stdout } = await execa("git", ["push", repositoryUrl]);
  console.log(stdout);
}

// function addCreatedAt (record) {
//   const yesterday = new Date()
//   yesterday.setDate(yesterday.getDate() - 1)
//   const tomorrow = new Date()
//   tomorrow.setDate(tomorrow.getDate() + 1)
//   return {
//     ...record,
//     createdAt: new Date(yesterday),
//     expiresAt: new Date(tomorrow)
//   }
// }

module.exports = {
  cloneRepo
}

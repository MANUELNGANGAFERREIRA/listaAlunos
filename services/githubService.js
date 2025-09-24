const axios = require("axios");
require("dotenv").config();

const { GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO, GITHUB_FILE } = process.env;
const apiUrl = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${GITHUB_FILE}`;

async function getData() {
  try {
    const res = await axios.get(apiUrl, {
      headers: { Authorization: `token ${GITHUB_TOKEN}` }
    });

    const content = Buffer.from(res.data.content, "base64").toString("utf-8");
    return { sha: res.data.sha, data: JSON.parse(content) };
  } catch (err) {
    if (err.response && err.response.status === 404) {
      return { sha: null, data: [] }; // arquivo não existe ainda
    }
    throw err;
  }
}

async function saveData(newData, sha = null) {
  const encoded = Buffer.from(JSON.stringify(newData, null, 2)).toString("base64");

  await axios.put(
    apiUrl,
    {
      message: "Atualização de dados",
      content: encoded,
      sha: sha || undefined
    },
    {
      headers: { Authorization: `token ${GITHUB_TOKEN}` }
    }
  );
}

module.exports = { getData, saveData };

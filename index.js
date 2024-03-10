const path = require("node:path");
const fs = require("node:fs");
const axios = require("axios");

main();

function main() {
  try {
    const pkgJsonContent = readPkgJson();
    getNodeVersion(pkgJsonContent)
      .then((result) => {
        console.log("Dependencies and node versions map".toUpperCase(), result);
        getVersionMedian(result);
      })
      .catch((error) => {
        throw error;
      });
  } catch (error) {
    console.error("Error in main fn", error.message);
  }
}

async function getNodeVersion(pkgJsonContent) {
  try {
    const dependencies = pkgJsonContent.dependencies;
    const depAndNodeVersionMap = [];
    for (let [depName, versionString] of Object.entries(dependencies)) {
      const version = removeVersionPrefix(versionString);
      const res = await axios.get(
        `https://registry.npmjs.org/${depName}/${version}`
      );
      const nodeVersion =
        res.data._nodeVersion || removeVersionPrefix(res.data.engines.node);
      const depNodeVersionPair = {
        depName,
        nodeVersion,
      };
      depAndNodeVersionMap.push(depNodeVersionPair);
    }
    return depAndNodeVersionMap;
  } catch (error) {
    // console.error('Error in getNodeVersion fn', error.message);
    throw error;
  }
}

function readPkgJson() {
  try {
    const usersRepositoryPath = path.join(process.cwd(), "package.json");
    const data = fs.readFileSync(
      usersRepositoryPath,
      "utf8"
    );
    // console.log(data);
    return JSON.parse(data);
  } catch (err) {
    console.error("Error in readPkgJson fn", err.message);
    throw err;
  }
}

function removeVersionPrefix(versionString) {
  // Remove ^, ~, > prefixes from the version string
  return versionString.replace(/^[\^~>=]+/, "");
}

function getVersionMedian(data) {
  // Extract the nodeVersion values
  const nodeVersions = data.map((item) => parseFloat(item.nodeVersion));

  // Sort the array
  nodeVersions.sort((a, b) => a - b);

  // Calculate the median
  const length = nodeVersions.length;
  const middleIndex = Math.floor(length / 2);

  let median;

  if (length % 2 === 0) {
    // If the array has an even number of elements, average the middle two
    median = (nodeVersions[middleIndex - 1] + nodeVersions[middleIndex]) / 2;
  } else {
    // If the array has an odd number of elements, use the middle one
    median = nodeVersions[middleIndex];
  }

  console.log("Median of nodeVersion:".toUpperCase(), parseInt(median));
}

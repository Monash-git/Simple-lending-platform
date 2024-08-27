const fs = require('fs');
const path = require('path');

async function main() {
  const configPath = path.join(__dirname, '..', 'frontend', 'config.json');
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

  const tokenArtifactPath = path.join(__dirname, '..', 'artifacts', 'contracts', 'MockToken.sol', 'MockToken.json');
  const lendingPlatformArtifactPath = path.join(__dirname, '..', 'artifacts', 'contracts', 'LendingPlatform.sol', 'LendingPlatform.json');

  const tokenArtifact = JSON.parse(fs.readFileSync(tokenArtifactPath, 'utf8'));
  const lendingPlatformArtifact = JSON.parse(fs.readFileSync(lendingPlatformArtifactPath, 'utf8'));

  config.tokenABI = tokenArtifact.abi;
  config.lendingPlatformABI = lendingPlatformArtifact.abi;

  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  console.log("Contract ABIs added to frontend/config.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
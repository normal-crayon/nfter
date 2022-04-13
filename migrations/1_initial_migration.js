const config = require("../src/config");
const Migrations = artifacts.require("Migrations");

module.exports = function (deployer) {
  deployer.deploy(Migrations, {
    from:config.ERC721
  });
};

const PDOGStaking = artifacts.require("PDOGStaking");

module.exports = function (deployer) {
  deployer.deploy(PDOGStaking, "0x48AC0A7Ac7A488eEAC4D3E1e46c882033971D02B", 2);
};

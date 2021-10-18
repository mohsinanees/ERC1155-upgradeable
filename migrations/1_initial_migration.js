const PDOGStaking = artifacts.require("PDOGStaking");

module.exports = function (deployer) {
  /**
   * params - _stakeToken, _rewardToken, _rewardRateInWei, _blockLimit, _rewardIntervalInSeconds
   */
  deployer.deploy(PDOGStaking, "0xF40a07bc72d77BEAbaCAd5Ecbba12a82F0A8AD03", "0xF40a07bc72d77BEAbaCAd5Ecbba12a82F0A8AD03", "1000000000000000000", 13324950, 60);
};

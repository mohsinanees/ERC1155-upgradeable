const PDOGStaking = artifacts.require("PDOGStaking");
const PDOG = artifacts.require("PDOG");
const Web3 = require('web3');

module.exports = async function (deployer, network) {

  if (network === "development") {
    var web3 =  new Web3('HTTP://127.0.0.1:8545');
    await deployer.deploy(PDOG);
    let pdog = await PDOG.deployed();
    const currentTime = Math.floor(new Date().getTime() / 1000);
    /**
     * params - _stakeToken, _rewardToken, _rewardRateInPercentage, _startTime, _rewardIntervalInSeconds
     */
    await deployer.deploy(PDOGStaking, pdog.address, pdog.address, 20, currentTime, 60);
  }
  if(network === "testnet") {
    var web3 =  new Web3('https://data-seed-prebsc-1-s1.binance.org:8545');
    await deployer.deploy(PDOG);
    let pdog = await PDOG.deployed();
    /**
     * params - _stakeToken, _rewardToken, _rewardRateInWei, _blockLimit, _rewardIntervalInSeconds
     */
    await deployer.deploy(PDOGStaking, pdog.address, pdog.address, 20, 1635231236, 240);
  }
};

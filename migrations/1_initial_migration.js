const PDOGStaking = artifacts.require("PDOGStaking");
const PDOG = artifacts.require("PDOG");
const Web3 = require('web3');
const {deployProxy, upgradeProxy} = require("@openzeppelin/truffle-upgrades");

module.exports = async function (deployer, network) {

  if (network === "development") {
    var web3 =  new Web3('HTTP://127.0.0.1:8545');
    await deployer.deploy(PDOG);
    let pdog = await PDOG.deployed();
    const currentTime = Math.floor(new Date().getTime() / 1000);
    /**
     * params - _stakeToken, _rewardToken, _rewardRateInWei, _startTime, _rewardIntervalInSeconds
     */
    // await deployer.deploy(PDOGStaking, pdog.address, pdog.address, (20*(10**18)).toString(), currentTime, 60);
    await deployProxy(PDOGStaking, [pdog.address, pdog.address, (20*(10**18)).toString(), currentTime, 60], { deployer, initializer: 'initialize' });
  }
  if(network === "testnet") {
    var web3 =  new Web3('https://data-seed-prebsc-1-s1.binance.org:8545');
    await deployer.deploy(PDOG);
    let pdog = await PDOG.deployed();
    const currentTime = Math.floor(new Date().getTime() / 1000);
    /**
     * params - _stakeToken, _rewardToken, _rewardRateInWei, _startTime, _rewardIntervalInSeconds
     */
    await deployer.deploy(PDOGStaking, pdog.address, pdog.address, (20*(10**18)).toString(), currentTime, 60);
  }
  if(network === "testnet1") {
    var web3 =  new Web3('https://data-seed-prebsc-1-s1.binance.org:8545');
    await deployer.deploy(PDOG);
    // let pdog = await PDOG.deployed();
    const currentTime = Math.floor(new Date().getTime() / 1000);

    /**
     * params - _stakeToken, _rewardToken, _rewardRateInWei, _startTime, _rewardIntervalInSeconds
     */
    // await deployProxy(PDOGStaking, [pdog.address, pdog.address, (20*(10**18)).toString(), currentTime, 60], { deployer, initializer: 'initialize' });
    const upgraded = await upgradeProxy('0x3645D927D0Aa7b2bB2114e864c175Dbed814B5F5', PDOGStaking, { deployer });
  }
};

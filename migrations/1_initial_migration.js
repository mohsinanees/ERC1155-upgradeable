const PDOGStaking = artifacts.require("PDOGStaking");
const PDOG = artifacts.require("PDOG");
const StakingProxyAdmin = artifacts.require("StakingProxyAdmin");
const StakingProxy = artifacts.require("StakingProxy");
const Web3 = require('web3');
const {deployProxy} = require("@openzeppelin/truffle-upgrades/src/deploy-proxy");

module.exports = async function (deployer, network) {

  if (network === "development") {
    var web3 =  new Web3('HTTP://127.0.0.1:8545');
    await deployer.deploy(PDOG);
    let pdog = await PDOG.deployed();
    const currentTime = Math.floor(new Date().getTime() / 1000);
    /**
     * params - _stakeToken, _rewardToken, _rewardRateInWei, _startTime, _rewardIntervalInSeconds
     */
    await deployer.deploy(PDOGStaking, pdog.address, pdog.address, (20*(10**18)).toString(), currentTime, 60);
  }
  if(network === "testnet") {
    var web3 =  new Web3('https://data-seed-prebsc-1-s1.binance.org:8545');
    await deployer.deploy(PDOG);
    let pdog = await PDOG.deployed();
    const currentTime = Math.floor(new Date().getTime() / 1000);
    // Proxy
    await deployer.deploy(StakingProxyAdmin);
    let stakingAdmin = await StakingProxyAdmin.deployed();
    /**
     * params - _stakeToken, _rewardToken, _rewardRateInWei, _startTime, _rewardIntervalInSeconds
     */
    await deployer.deploy(PDOGStaking, pdog.address, pdog.address, (20*(10**18)).toString(), currentTime, 60);
    let pdogStaking = await PDOGStaking.deployed();

    await deployer. deploy(StakingProxy, pdogStaking.address, stakingAdmin.address,[]);
    let stakingProxy = await StakingProxy.deployed();
  }
  if(network === "testnet1") {
    var web3 =  new Web3('https://data-seed-prebsc-1-s1.binance.org:8545');
    await deployer.deploy(PDOG);
    let pdog = await PDOG.deployed();
    const currentTime = Math.floor(new Date().getTime() / 1000);

    /**
     * params - _stakeToken, _rewardToken, _rewardRateInWei, _startTime, _rewardIntervalInSeconds
     */
    await deployProxy(PDOGStaking, [pdog.address, pdog.address, (20*(10**18)).toString(), currentTime, 60], { deployer, initializer: 'initialize' });
    // let pdogStaking = await PDOGStaking.deployed();
  }
};

const PDOGStaking = artifacts.require("PDOGStaking");
const PDOG = artifacts.require("PDOG");
const Web3 = require('web3');
// const {mnemonic, apiKey, infuraKey} = require('./secret.json');
// var web3 = new web3(`https://rinkeby.infura.io/v3/${infuraKey}`);
var web3 =  new Web3('HTTP://127.0.0.1:8545');

module.exports = async function (deployer, network) {

  if (network === "development") {
    await deployer.deploy(PDOG);
    let pdog = await PDOG.deployed();
    /**
     * params - _stakeToken, _rewardToken, _rewardRateInWei, _blockLimit, _rewardIntervalInSeconds
     */
    await deployer.deploy(PDOGStaking, pdog.address, pdog.address, ((10 ** 18)).toString(), web3.eth.getBlockNumber(), 10);
  }
};

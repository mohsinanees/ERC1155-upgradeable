const ERC1155 = artifacts.require("AWSTERC1155");
const ERC1155_auto_inc = artifacts.require("AWSTERC1155_auto");
const Web3 = require("web3");
const { deployProxy, upgradeProxy } = require("@openzeppelin/truffle-upgrades");

module.exports = async function (deployer, network) {
    if (network === "development") {
        await deployer.deploy(ERC1155);
        let AWSTERC1155 = await deployProxy(ERC1155, [], {
            deployer,
            initializer: "initialize",
        });
        await deployer.deploy(ERC1155_auto_inc);
        let AWSTERC1155_auto = await deployProxy(ERC1155_auto_inc, [], {
            deployer,
            initializer: "initialize",
        });
    }
    if (network === "mumbai") {
        await deployer.deploy(ERC1155);

        // intailize: intiaizlizer function name
        let contract = await deployProxy(ERC1155, [], { deployer, initializer: "initialize" });
        // await upgradeProxy(PROXY_ADDRESS, ERC1155, { deployer });
    }
};

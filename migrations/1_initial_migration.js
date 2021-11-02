const ERC1155 = artifacts.require("AWSTERC1155");
const Web3 = require("web3");
const { deployProxy, upgradeProxy } = require("@openzeppelin/truffle-upgrades");

module.exports = async function (deployer, network) {
    if (network === "development") {
        await deployer.deploy(ERC1155);
        const contract = await deployProxy(ERC1155, [], {
            deployer,
            initializer: "initialize",
        });
    }
    if (network === "mumbai") {
        await deployer.deploy(ERC1155);

        // intailize: intiaizlizer function name
        const contract = await deployProxy(ERC1155, [], { deployer, initializer: "initialize" });
        // await upgradeProxy(PROXY_ADDRESS, ERC1155, { deployer });
    }
};

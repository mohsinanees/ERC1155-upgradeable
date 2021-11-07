const HDWalletProvider = require("truffle-hdwallet-provider"); //HD Wallet provider
const web3 = require("web3");
const MNEMONIC = "follow little mule digital eight film pilot where spoil steel swamp become"; //wallet MNEMONIC
const NFT_CONTRACT_ADDRESS = "0x540F3d2DfF4cD7ac440db1007BD16494358092ad"; //polygon (mumbai) testnet deployed
const OWNER_ADDRESS = "0x3600AC1F03480774f25F937c1E3Fb2f9e043d214"; // smart contract owner

// ABI used to encode information while interacting onchain smart contract functions
const AWST_ERC1155_ABI = require("./abi.json");


if (!MNEMONIC || !OWNER_ADDRESS) {
    console.error(
        "Please set a mnemonic, Alchemy/Infura key, owner, network, and contract address."
    );
    return;
}

let provider;
let web3Instance;
let nftContract;

let web3SocketInstance;
let nftContractS;

const setUpWeb3 = async function () {

    provider = new HDWalletProvider(
        MNEMONIC,
        "https://speedy-nodes-nyc.moralis.io/af271fa0290d1b4fdf0a5b35/polygon/mumbai" //RPC testnet endpoint
    );

    web3Instance = new web3(provider); //create a web3 instance
    // "wss://speedy-nodes-nyc.moralis.io/af271fa0290d1b4fdf0a5b35/polygon/mumbai/ws" //RPC testnet endpoint

    web3SocketInstance = new web3(new web3.providers.WebsocketProvider('wss://speedy-nodes-nyc.moralis.io/af271fa0290d1b4fdf0a5b35/polygon/mumbai/ws'));


    if (NFT_CONTRACT_ADDRESS) {

        nftContract = new web3Instance.eth.Contract(
            AWST_ERC1155_ABI,
            NFT_CONTRACT_ADDRESS
        );

        nftSocket = new web3SocketInstance.eth.Contract(
            AWST_ERC1155_ABI,
            NFT_CONTRACT_ADDRESS
        )

        // BatchMint event catch
        nftSocket.events.TransferBatch({}, (error, event) => {})
            .on('data', (event) => {
                console.log("ID's minted : " + JSON.stringify(event.returnValues.ids));
            }).on('changed', (event) => {
                console.log("Changed !!! ID's minted : " + JSON.stringify(event));
            }).on('error', console.error);

    } else {
        console.error(
            "Add NFT_CONTRACT_ADDRESS "
        );
    }
}

const mint = async function () {

    const currentID = await nftContract.methods.totalSupply().call();
    console.log("Staring token minting at ID", parseInt(currentID) + 1, "...");

    const baseURI = "QmW1nn4S4YEYsQASmmUM5MEGptZcNvbiAuqP1JAjjhTBzN"

    let values = []
    let count = 1;
    for (i = 0; i < count; i++) {
        values.push(i);
    }

    await nftContract.methods
        .mintBatch(OWNER_ADDRESS, count, values, baseURI, "0x0")
        .send({ from: OWNER_ADDRESS, chainId: 80001 })
        .then(result => console.log("https://mumbai.polygonscan.com/tx/" + result.transactionHash))
        .catch(error => console.log(error));
}


setUpWeb3();

mint();
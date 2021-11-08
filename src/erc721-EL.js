const Web3 = require("web3");
// const HDWalletProvider = require("truffle-hdwallet-provider"); //HD Wallet provider
const fs = require("fs");
const contractName = "AWSTERC1155";
const contractABI = require(`./${contractName}.json`);
const contractAddress = "0x7491176fe259ad949462e273a9f15295d795667c";

// const web3 = new Web3(
//     new Web3.providers.WebsocketProvider(`wss://polygon-mumbai.infura.io/ws/v3/63ded85a9a5442c6ae2b94c2e97fb8c4`)
// );
// const web3 = new Web3(
//     new Web3.providers.WebsocketProvider(`wss://rpc-mumbai.matic.today`)
// );
const web3 = new Web3(
    new Web3.providers.WebsocketProvider(
        `wss://speedy-nodes-nyc.moralis.io/e3771a4194ca1a8d20c96277/polygon/mainnet/ws`
    )
);

let contract = new web3.eth.Contract(contractABI, contractAddress);
// console.log(contract.events)
// contract.events
//     .TransferSingle({ fromBlock: 0 })
//     .on("data", function (event) {
//         console.log(event);

//     })
//     .on("error", (err) => console.log(err));

contract
    .getPastEvents("TransferSingle", {
        filter: { from: "0xed1B2b59163d081D6E71772286C3c07678493869" },
        fromBlock: 0,
        toBlock: "latest",
    })
    .then(async function (events) {
        console.log(events); // same results as the optional callback above
        let filteredEvents = [];
        await events.forEach((event) => {
            filteredEvents.push({
                transactionHash: event.transactionHash,
                blockHash: event.blockHash,
                from: event.returnValues.from,
                to: event.returnValues.to,
                id: event.returnValues.id,
            });
        });
        console.log(filteredEvents.length);
        await fs.writeFileSync("TransferEvents.json", JSON.stringify(filteredEvents, null, 2));
    });

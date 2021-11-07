const axios = require("axios");
const fs = require("fs");

const Web3 = require("web3");
const rawAbi = require("./abi.json");
const abi = JSON.parse(JSON.stringify(rawAbi));

let URIs = [];

async function fetchIds() {
    const contractAddress = "0x7491176fe259ad949462e273a9f15295d795667c";

    const provider = new Web3.providers.HttpProvider(
        "https://speedy-nodes-nyc.moralis.io/af271fa0290d1b4fdf0a5b35/polygon/mainnet"
    );
    const web3 = new Web3(provider);
    const contract = new web3.eth.Contract(abi, contractAddress);

    for (i = 1; i <= 10; i++) {
        let URI = await contract.methods.uri(i).call();
        console.log(i);
        URIs.push(URI);
    }
    // console.log(URIs);
    getMetadata(URIs);
}

async function getMetadata(URIs) {
    let metadataJSON = [];
    for (i = 0; i < URIs.length; i++) {
        let res = await axios.get(URIs[i]);
        console.log("ID: ", i, " ", URIs[i], res.data.external_uri);
        metadataJSON.push({ id: i, uri: URIs[i], external_uri: res.data.external_uri });
    }
    await fs.writeFileSync("ids.json", JSON.stringify(metadataJSON, null, 2));
}

fetchIds();

// module.exports = { filterDB };

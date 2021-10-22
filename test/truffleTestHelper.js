const fetch = require("node-fetch");

// moving timestamp
const advanceTime = async (time) => {
    await fetch("http://localhost:8545", {
        body: '{"id":1337,"jsonrpc":"2.0","method":"evm_increaseTime","params":['+time+']}',
        headers: {
            "Content-Type": "application/json"
        },
        method: "POST"
    });
}

// mining the block
const advanceBlock = async () => {
    await fetch("http://localhost:8545", {
        body: '{"id":1337,"jsonrpc":"2.0","method":"evm_mine"}',
        headers: {
            "Content-Type": "application/json"
        },
        method: "POST"
    })
}

module.exports = {advanceTime, advanceBlock}
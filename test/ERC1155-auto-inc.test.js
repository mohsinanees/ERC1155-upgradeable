const { assert } = require("chai");
const Web3 = require("web3");
const ERC1155 = artifacts.require("AWSTERC1155_auto");

// require("chai").use(require("chai-as-promised")).should();

contract("AWSTERC1155_auto_inc", (accounts) => {
    let contract;
    before(async () => {
        contract = await ERC1155.deployed();
    });

    describe("Deployment", async () => {
        it("deploys successfully", async () => {
            const address = contract.address;
            assert.notEqual(address, 0x0);
            assert.notEqual(address, "");
            assert.notEqual(address, null);
            assert.notEqual(address, undefined);
        });
    });

    describe("mint", async () => {
        it("should mint a token when called by the owner", async () => {
            const result = await contract.mint(accounts[0], 1, "uri0", "0x0");
            const totalSupply = await contract.balanceOf(accounts[0], 1);
            // is only one NFT of this type created in this account
            assert.equal(totalSupply.toNumber(), 1);
            // check NFT id, from address, to address
            const event = result.logs[0].args;
            assert.equal(event.id, 1, "id is correct");
            assert.equal(
                event.from,
                "0x0000000000000000000000000000000000000000",
                "from is correct"
            );
            assert.equal(event.to, accounts[0], "to is correct");
        });
        it("should fail when called by the non-owner", async () => {
            try {
                const result = await contract.mint(accounts[0], 2, "uri2", "0x0", {
                    from: accounts[1],
                });
            } catch (err) {
                assert.equal(err.reason, "Ownable: caller is not the owner");
            }
        });
    });

    describe("mintBatch: auto incremental", async () => {
        it("should mint the tokens in batch when called by the owner", async () => {
            let tokenCount = 9;
            let values = [1, 1, 1, 1, 1, 1, 1, 1, 1];
            let baseURI = "baseURI";
            let tx = await contract.mintBatch(accounts[0], tokenCount, baseURI, values, "0x0");
            const event = tx.logs[0].args;
            // just for the checking purpose
            let ids = [2, 3, 4, 5, 6, 7, 8, 9, 10];
            for (let i = 0; i < 9; i++) {
                assert.equal(ids[i], event.ids[i].toNumber());
                assert.equal(await contract.uri(ids[i]), `baseURI/${ids[i]}.json`);
            }
        });
        it("should fail when called by the non-owner", async () => {
            let tokenCount = 9;
            let values = [1, 1, 1, 1, 1, 1, 1, 1, 1];
            let baseURI = "baseURI";
            try {
                let tx = await contract.mintBatch(accounts[0], tokenCount, baseURI, values, "0x0", {
                    from: accounts[1],
                });
            } catch (err) {
                assert.equal(err.reason, "Ownable: caller is not the owner");
            }
        });
    });

    describe("uri", async () => {
        it("should correctly retrieve the token's URI", async () => {
            let result1 = await contract.uri(1);
            assert.equal(result1, "uri0");
            let result2 = await contract.uri(2);
            assert.equal(result2, "baseURI/2.json");
        });
    });

    describe("setURI", async () => {
        it("should set the single token's URI when called by the owner", async () => {
            await contract.setURI(1, "test1");
            let result3 = await contract.uri(1);
            assert.equal(result3, "test1");
        });
        // only owner of smart contract is able to change the uri of NFT
        it("fail when called by the non-owner", async () => {
            try {
                let res = await contract.setURI(2, "test2", { from: accounts[1] });
            } catch (err) {
                assert.equal(err.reason, "Ownable: caller is not the owner");
            }
        });
    });

    describe("setBatchURI", async () => {
        it("should set the token URIs of the batch when called by the owner", async () => {
            let ids = [2, 3, 4, 5, 6, 7, 8, 9, 10];
            let uris = [
                "test2",
                "test3",
                "test4",
                "test5",
                "test6",
                "test7",
                "test8",
                "test9",
                "test10",
            ];
            await contract.setBatchURI(ids, uris);
            for (let i = 0; i < 9; i++) {
                let fetchedUri = await contract.uri(ids[i]);
                assert.equal(fetchedUri, uris[i]);
            }
        });
        it("should fail when called by the non-owner", async () => {
            let ids = [2, 3, 4, 5, 6, 7, 8, 9, 10];
            let uris = [
                "test2",
                "test3",
                "test4",
                "test5",
                "test6",
                "test7",
                "test8",
                "test9",
                "test10",
            ];
            try {
                await contract.setBatchURI(ids, uris, { from: accounts[1] });
            } catch (err) {
                assert.equal(err.reason, "Ownable: caller is not the owner");
            }
        });
    });

    describe("safeTransfer", async () => {
        it("should pass when the token owner transfers the NFT", async () => {
            let result = await contract.safeTransfer(accounts[2], 1, 1, "0x0");
            const event = result.logs[0].args;
            assert.equal(event.to, accounts[2]);
        });
        it("should fail when other address transfers the NFT", async () => {
            try {
                let result = await contract.safeTransfer(accounts[2], 2, 1, "0x0", {
                    from: accounts[2],
                });
            } catch (err) {
                assert.equal(err.reason, "ERC1155: insufficient balance for transfer");
            }
        });
    });
});

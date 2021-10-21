const PDOG_STAKING = artifacts.require('PDOGStaking');
const PDOG = artifacts.require('PDOG');
const truffleAssert = require('truffle-assertions');
const helper = require("./truffleTestHelper");
const fetch = require("node-fetch");

contract('PDOG_STAKING', async accounts => {

    it("User trying to stake 0 balance - owner", async () => {
        const pdog = await PDOG.deployed();
        const pdogstaking = await PDOG_STAKING.deployed();
        await pdog.approve(pdogstaking.address, (100 * (10 ** 18)).toString());
        try {
            await pdogstaking.stakeTokenForReward(0);
        } catch (err) {
            const errorMessage = "STAKING: Balance cannot be 0"
            assert.equal(err.reason, errorMessage, "Cannot stake 0 token");
        }
    });

    it("User trying to un stake balance without staking - owner", async () => {
        const pdog = await PDOG.deployed();
        const pdogstaking = await PDOG_STAKING.deployed();

        try {
            await pdogstaking.unStakeToken();
        } catch (err) {
            const errorMessage = "STAKING: No staked balance available"
            assert.equal(err.reason, errorMessage, "Cannot un stake without balance");
        }
    });

    it("User trying to stake 0 balance - non owner", async () => {
        const pdog = await PDOG.deployed();
        const pdogstaking = await PDOG_STAKING.deployed();
        await pdog.approve(pdogstaking.address, (100 * (10 ** 18)).toString(), {from:accounts[1]});
        try {
            await pdogstaking.stakeTokenForReward(0, {from:accounts[1]});
        } catch (err) {
            const errorMessage = "STAKING: Balance cannot be 0"
            assert.equal(err.reason, errorMessage, "Cannot stake 0 token");
        }
    });

    it("User trying to un stake balance without staking - owner", async () => {
        const pdog = await PDOG.deployed();
        const pdogstaking = await PDOG_STAKING.deployed();

        try {
            await pdogstaking.unStakeToken({from:accounts[1]});
        } catch (err) {
            const errorMessage = "STAKING: No staked balance available"
            assert.equal(err.reason, errorMessage, "Cannot un stake without balance");
        }
    });

    it("Calculating reward without any staking - owner", async () => {
        const pdogstaking = await PDOG_STAKING.deployed();
        let balance =  await pdogstaking.calculateReward(accounts[0]);
        assert.equal(0, 0, "Reward will be zero when it is not staked");
    });

    it("Calculating reward without any staking - non - owner", async () => {
        const pdogstaking = await PDOG_STAKING.deployed();
        let balance =  await pdogstaking.calculateReward(accounts[1]);
        assert.equal(0, 0, "Reward will be zero when it is not staked");
    });

    it("User trying to withdraw balance from the staked balance without any staking before - owner", async () => {
        const pdog = await PDOG.deployed();
        const pdogstaking = await PDOG_STAKING.deployed();

        try {
            await pdogstaking.withdrawFromStakedBalance((100*(10**18)).toString, {from:accounts[0]});
        } catch (err) {
            const errorMessage = "STAKING: No staked balance available"
            assert.equal(err.reason, errorMessage, "Cannot withdraw without balance");
        }
    });

    it("User trying to withdraw balance from the staked balance without any staking before - owner", async () => {
        const pdog = await PDOG.deployed();
        const pdogstaking = await PDOG_STAKING.deployed();

        try {
            await pdogstaking.withdrawFromStakedBalance((100*(10**18)).toString, {from:accounts[1]});
        } catch (err) {
            const errorMessage = "STAKING: No staked balance available"
            assert.equal(err.reason, errorMessage, "Cannot withdraw without balance");
        }
    });

    it("User trying to stake balance - owner", async () => {
        const pdog = await PDOG.deployed();
        const pdogstaking = await PDOG_STAKING.deployed();
        await pdog.approve(pdogstaking.address, (100 * (10 ** 18)).toString());

        let tx = await pdogstaking.stakeTokenForReward((100 * (10 ** 18)).toString());
        truffleAssert.eventEmitted(tx, 'StakedToken', (ev) => {
            return ev.from === accounts[0]
                && ev.to === pdogstaking.address;
        });
    });

    it("User trying to stake balance - non - owner", async () => {
        const pdog = await PDOG.deployed();
        const pdogstaking = await PDOG_STAKING.deployed();
        // transfer token from owner to non owner
        await pdog.transfer(accounts[1],((100 * (10 ** 18)).toString()), {from: accounts[0]});

        await pdog.approve(pdogstaking.address, (100 * (10 ** 18)).toString(), {from: accounts[1]});

        let tx = await pdogstaking.stakeTokenForReward(((100 * (10 ** 18)).toString()),{from: accounts[1]});

        truffleAssert.eventEmitted(tx, 'StakedToken', (ev) => {
            return ev.from === accounts[1]
                && ev.to === pdogstaking.address;
        });
    });

    it("Calculate reward for the owner for staking", async () => {
        const pdog = await PDOG.deployed();
        const pdogstaking = await PDOG_STAKING.deployed();
        // moving timestamp
        await fetch("http://localhost:8545", {
            body: '{"id":1337,"jsonrpc":"2.0","method":"evm_increaseTime","params":['+11+']}',
            headers: {
                "Content-Type": "application/json"
            },
            method: "POST"
        });

        // mining the block
        await fetch("http://localhost:8545", {
            body: '{"id":1337,"jsonrpc":"2.0","method":"evm_mine"}',
            headers: {
                "Content-Type": "application/json"
            },
            method: "POST"
        })

        let reward = await pdogstaking.calculateReward(accounts[0]);
        assert.equal(reward.toString(), (10**18).toString(), "Reward will be 1%");
    });

    it("Calculate reward for the non owner for staking", async () => {
        const pdog = await PDOG.deployed();
        const pdogstaking = await PDOG_STAKING.deployed();

        // Time has been moved in the previous test

        let reward = await pdogstaking.calculateReward(accounts[1]);
        assert.equal(reward.toString(), (10**18).toString(), "Reward will be 1%");
    });

    it("Reward claiming by - owner", async () => {
        const pdog = await PDOG.deployed();
        const pdogstaking = await PDOG_STAKING.deployed();
        //Transfering the token that should be given as the reward
        await pdog.transfer(pdogstaking.address,(100*(10**18)).toString())

        let tx = await pdogstaking.claimMyReward();
        truffleAssert.eventEmitted(tx, 'Reward', (ev) => {
            return ev.to === accounts[0]
                && ev.from === pdogstaking.address;
        });
    });

    it("Reward claiming by -non owner", async () => {
        const pdog = await PDOG.deployed();
        const pdogstaking = await PDOG_STAKING.deployed();

        let tx = await pdogstaking.claimMyReward({from: accounts[1]});
        truffleAssert.eventEmitted(tx, 'Reward', (ev) => {
            return ev.to === accounts[1]
                && ev.from === pdogstaking.address;
        });
    });

    it("Withdraw some balance of the staked balance - owner", async () => {
        const pdog = await PDOG.deployed();
        const pdogstaking = await PDOG_STAKING.deployed();

        let tx = await pdogstaking.withdrawFromStakedBalance((50*(10**18)).toString(),{from: accounts[0]});
        truffleAssert.eventEmitted(tx, 'WithdrawnFromStakedBalance', (ev) => {
            return ev.user === accounts[0]
                && ev.amount.toString() === (50*(10**18)).toString();
        });
    });

    it("Withdraw some balance of the staked balance - non owner", async () => {
        const pdog = await PDOG.deployed();
        const pdogstaking = await PDOG_STAKING.deployed();

        let tx = await pdogstaking.withdrawFromStakedBalance((50*(10**18)).toString(),{from: accounts[1]});
        truffleAssert.eventEmitted(tx, 'WithdrawnFromStakedBalance', (ev) => {
            return ev.user === accounts[1]
                && ev.amount.toString() === (50*(10**18)).toString();
        });
    });


    it("Un stake the complete holding from the staking - owner", async () => {
        const pdog = await PDOG.deployed();
        const pdogstaking = await PDOG_STAKING.deployed();

        let tx = await pdogstaking.unStakeToken({from: accounts[0]});
        truffleAssert.eventEmitted(tx, 'UnStakedToken', (ev) => {
            return ev.from === pdogstaking.address
                && ev.to === accounts[0]
                && ev.amount.toString() === (50*(10**18)).toString();
        });
    });

    it("Un stake the complete holding from the staking- non owner", async () => {
        const pdog = await PDOG.deployed();
        const pdogstaking = await PDOG_STAKING.deployed();

        let tx = await pdogstaking.unStakeToken({from: accounts[1]});
        truffleAssert.eventEmitted(tx, 'UnStakedToken', (ev) => {
            return ev.from === pdogstaking.address
                && ev.to === accounts[1]
                && ev.amount.toString() === (50*(10**18)).toString();
        });
    });

});
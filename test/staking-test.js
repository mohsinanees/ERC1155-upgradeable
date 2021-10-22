const PDOG_STAKING = artifacts.require('PDOGStaking');
const PDOG = artifacts.require('PDOG');
const truffleAssert = require('truffle-assertions');
const { advanceTime, advanceBlock } = require("./truffleTestHelper");

contract('PDOG_STAKING', async accounts => {

    describe("Stake token", async () => {
        context("Stake by owner", async () => {
            it("Should fail when user trying to stake 0 balance - owner", async () => {
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

            it("Should pass when user trying to stake balance - owner", async () => {
                const pdog = await PDOG.deployed();
                const pdogstaking = await PDOG_STAKING.deployed();
                await pdog.approve(pdogstaking.address, (100 * (10 ** 18)).toString());
        
                let tx = await pdogstaking.stakeTokenForReward((100 * (10 ** 18)).toString());
                truffleAssert.eventEmitted(tx, 'StakedToken', (ev) => {
                    return ev.from === accounts[0]
                        && ev.to === pdogstaking.address;
                });
            });
        });

        context("Stake by non-owner", async () => {
            it("Should fail when user trying to stake 0 balance - non owner", async () => {
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

            it("Should pass when user trying to stake balance - non - owner", async () => {
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
        });
    });

    describe("Calculate reward", async () => {
        context("Calculate reward by owner", async () => {
            it("Should fail when calculating reward without any staking - owner", async () => {
                const pdogstaking = await PDOG_STAKING.deployed();
                let balance =  await pdogstaking.calculateReward(accounts[0]);
                assert.equal(0, 0, "Reward will be zero when it is not staked");
            });

            it("Should pass when calculating reward by owner", async () => {
                const pdogstaking = await PDOG_STAKING.deployed();

                // moving timestamp
                await advanceTime(61);
                // mining the block
                await advanceBlock();

                let reward = await pdogstaking.calculateReward(accounts[0]);
                assert.equal(reward.toString(), (10**18).toString(), "Reward will be 1%");
            });
        });

        context("Calculate reward by non-owner", async () => {
            it("Should fail when calculating reward without any staking - non-owner", async () => {
                const pdogstaking = await PDOG_STAKING.deployed();
                let balance =  await pdogstaking.calculateReward(accounts[1]);
                assert.equal(0, 0, "Reward will be zero when it is not staked");
            });

            it("Should pass when calculating reward by non-owner", async () => {
                const pdogstaking = await PDOG_STAKING.deployed();

                // Time has been moved in the previous test
                let reward = await pdogstaking.calculateReward(accounts[1]);
                assert.equal(reward.toString(), (10**18).toString(), "Reward will be 1%");
            });
        });
    });

    describe("Reward claiming", async () => {
        context("Reward Claiming - owner", async () => {
            it("Should pass when reward claimed by owner", async () => {
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
        });

        context("Reward Claiming - non-owner", async () => {
            it("Should pass when reward claimed by non-owner", async () => {
                const pdogstaking = await PDOG_STAKING.deployed();
        
                let tx = await pdogstaking.claimMyReward({from: accounts[1]});
                truffleAssert.eventEmitted(tx, 'Reward', (ev) => {
                    return ev.to === accounts[1]
                        && ev.from === pdogstaking.address;
                });
            });
        })
    });

    describe("Withdraw balance from staked balance", async () => {
        context("Withdraw balance from staked balance by owner", () => {
            it("Should pass when user withdraw some balance of the staked balance - owner", async () => {
                const pdogstaking = await PDOG_STAKING.deployed();
        
                let tx = await pdogstaking.withdrawFromStakedBalance((50*(10**18)).toString(),{from: accounts[0]});
                truffleAssert.eventEmitted(tx, 'WithdrawnFromStakedBalance', (ev) => {
                    return ev.user === accounts[0]
                        && ev.amount.toString() === (50*(10**18)).toString();
                });
            });
        });

        context("Withdraw balance from staked balance by non-owner", () => {
            it("Should pass when user withdraw some balance of the staked balance - non owner", async () => {
                const pdogstaking = await PDOG_STAKING.deployed();
        
                let tx = await pdogstaking.withdrawFromStakedBalance((50*(10**18)).toString(),{from: accounts[1]});
                truffleAssert.eventEmitted(tx, 'WithdrawnFromStakedBalance', (ev) => {
                    return ev.user === accounts[1]
                        && ev.amount.toString() === (50*(10**18)).toString();
                });
            });
        });
    });
    
    describe("Unstake token", async () => {
        context("Unstake by owner", async () => {
            it("Should pass when user unstake the complete holding from the staking - owner", async () => {
                const pdogstaking = await PDOG_STAKING.deployed();
                // moving timestamp
                await advanceTime(61);
                // mining the block
                await advanceBlock();

                let tx = await pdogstaking.unStakeToken({from: accounts[0]});
                truffleAssert.eventEmitted(tx, 'UnStakedToken', (ev) => {
                    return ev.from === pdogstaking.address
                        && ev.to === accounts[0]
                        && ev.amount.toString() === (50*(10**18)).toString();
                });
            });
        });

        context("Unstake by non-owner", async () => {

            it("Should pass when user unstake the complete holding from the staking- non owner", async () => {
                const pdogstaking = await PDOG_STAKING.deployed();
        
                // moving timestamp
                await advanceTime(61);
                // mining the block
                await advanceBlock();
                
                let tx = await pdogstaking.unStakeToken({from: accounts[1]});
                truffleAssert.eventEmitted(tx, 'UnStakedToken', (ev) => {
                    return ev.from === pdogstaking.address
                        && ev.to === accounts[1]
                        && ev.amount.toString() === (50*(10**18)).toString();
                });
            });

            it("Should fail when user trying to unstake balance without staking - non-owner", async () => {
                const pdogstaking = await PDOG_STAKING.deployed();
        
                try {
                    await pdogstaking.unStakeToken({from:accounts[1]});
                } catch (err) {
                    const errorMessage = "STAKING: No staked token balance available"
                    assert.equal(err.reason, errorMessage, "Cannot un stake without balance");
                }
            });
        });
    });

    describe("Withdraw balance from staked balance without any staking before", async () => {
        context("Withdraw balance from staked balance without any staking before by owner", () => {
            it("Should fail when user trying to withdraw balance from the staked balance without any staking before - owner", async () => {
                const pdog = await PDOG.deployed();
                const pdogstaking = await PDOG_STAKING.deployed();
        
                try {
                    await pdogstaking.withdrawFromStakedBalance((100*(10**18)).toString, {from:accounts[0]});
                } catch (err) {
                    const errorMessage = "STAKING: No staked token balance available"
                    assert.equal(err.reason, errorMessage, "Cannot withdraw without balance");
                }
            });
        });

        context("Withdraw balance from staked balance without any staking before by non-owner", () => {
            it("Should fail when user trying to withdraw balance from the staked balance without any staking before - non-owner", async () => {
                const pdogstaking = await PDOG_STAKING.deployed();
        
                try {
                    await pdogstaking.withdrawFromStakedBalance((100*(10**18)).toString, {from:accounts[1]});
                } catch (err) {
                    const errorMessage = "STAKING: No staked token balance available"
                    assert.equal(err.reason, errorMessage, "Cannot withdraw without balance");
                }
            });
        });
    });
});
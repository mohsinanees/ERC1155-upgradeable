//SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/math/SafeMathUpgradeable.sol";


interface IERC20 {

    function totalSupply() external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
    function allowance(address owner, address spender) external view returns (uint256);

    function transfer(address recipient, uint256 amount) external returns (bool);
    function approve(address spender, uint256 amount) external returns (bool);
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);


    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
}

contract EinsteinStaking is OwnableUpgradeable, PausableUpgradeable, ReentrancyGuardUpgradeable {
    using SafeMathUpgradeable for uint256;
    string public constant name = "EINSTEIN - Staking";

    IERC20 public stakeToken; // Token which users stake to get reward
    IERC20 public rewardToken; // holds token address which we are giving it as reward
    uint256 public rewardRate; // APR of the staking
    uint256 public startTime; // Block number after which reward should start
    uint256 public endTime; // End time of staking
    uint256 public rewardInterval; // Time difference for calculating reward, eg., Day, Months, Years, etc.,
    address[] public stakers;
    mapping(address => uint256) public stakingStartTime; // to manage the time when the user started the staking
    mapping(address => uint) public stakedBalance;     // to manage the staking of token A  and distibue the profit as token B
    mapping(address => bool) public hasStaked;
    mapping(address => bool) public isStaking;
    mapping(address => uint256) public oldReward; // Stores the old reward
    uint256 public _totalStakedAmount; // Total amount of tokens that users have staked
    mapping(address => uint256) public userTimeBounds; // mapping stores the withdraw time request
    uint256 public timeBound;

    event Reward(address indexed from, address indexed to, uint256 amount);
    event StakedToken(address indexed from, address indexed to, uint256 amount);
    event UnStakedToken(address indexed from, address indexed to, uint256 amount);
    event WithdrawnFromStakedBalance(address indexed user, uint256 amount);
    event ExternalTokenTransferred(address indexed from, address indexed to, uint256 amount);
    event EthFromContractTransferred(uint256 amount);
    event UpdatedRewardRate(uint256 rate);
    event UpdatedRewardToken(IERC20 token);
    event UpdatedRewardInterval(uint256 interval);
    event UpdatedStakingEndTime(uint256 endTime);
    event WithdrawRequested(address indexed to);
    event TimeBoundChanged(uint256 newTimeBound);

    function initialize(IERC20 _stakeToken, IERC20 _rewardToken, uint256 _rewardRate, uint256 _startTime, uint256 _rewardIntervalInSeconds) public virtual initializer {
        stakeToken = _stakeToken;
        rewardToken = _rewardToken;
        rewardRate = _rewardRate;
        startTime = _startTime;
        rewardInterval = _rewardIntervalInSeconds;
        timeBound = 604800;
        // initializing
        __Pausable_init();
        __Ownable_init_unchained();
        __ReentrancyGuard_init_unchained();

    }

    //    constructor() initializer {}

    /* Stakes Tokens (Deposit): An investor will deposit the stakeToken into the smart contracts
    to starting earning rewards.

    Core Thing: Transfer the stakeToken from the investor's wallet to this smart contract. */
    function stakeTokenForReward(uint _amount) external virtual nonReentrant whenNotPaused {
        require(block.timestamp >= startTime, "STAKING: Start Block has not reached");
        if(endTime > 0) require(block.timestamp <= endTime, "STAKING: Has ended");
        require(_amount > 0, "STAKING: Balance cannot be 0"); // Staking amount cannot be zero
        require(stakeToken.balanceOf(msg.sender) >= _amount, "STAKING: Insufficient stake token balance"); // Checking msg.sender balance

        // add user to stakers array *only* if they haven't staked already
        if(!hasStaked[msg.sender]) {
            stakers.push(msg.sender);
        }
        if(isStaking[msg.sender]){
            (uint256 oldR,) = calculateReward(msg.sender);
            oldReward[msg.sender] = oldReward[msg.sender] + oldR;
        }

        bool transferStatus = stakeToken.transferFrom(msg.sender, address(this), _amount);
        if (transferStatus) {
            emit StakedToken(msg.sender, address(this), _amount);
            stakedBalance[msg.sender] = stakedBalance[msg.sender] + _amount; // update user staking balance
            _totalStakedAmount += _amount; // update Contract Staking balance
            stakingStartTime[msg.sender] = block.timestamp; // save the time when they started staking
            // update staking status
            isStaking[msg.sender] = true;
            hasStaked[msg.sender] = true;
        }
    }

    function unStakeToken() external virtual nonReentrant whenNotPaused {
        require(isStaking[msg.sender], "STAKING: No staked token balance available");
        uint balance = stakedBalance[msg.sender];
        require(balance > 0, "STAKING: Balance cannot be 0");
        require(stakeToken.balanceOf(address(this)) >= balance, "STAKING: Not enough stake token balance");
        require(userTimeBounds[msg.sender] > 0, "STAKING: Request withdraw before withdraw");
        require(block.timestamp >= (userTimeBounds[msg.sender]+ timeBound), "STAKING: Cannot withdraw within interval period");
        (uint256 reward,) = calculateReward(msg.sender);
        uint256 totalReward = reward.add(oldReward[msg.sender]);
        SendRewardTo(totalReward,msg.sender); // Checks if the contract has enough tokens to reward or not

        // unstaking of staked tokens
        bool transferStatus = stakeToken.transfer(msg.sender, balance);
        if(transferStatus){
            emit UnStakedToken(address(this), msg.sender, balance);
            _totalStakedAmount -= balance;
            stakedBalance[msg.sender] = 0; // reset staking balance
            isStaking[msg.sender] = false; // update staking status and stakingStartTime (restore to zero)
            stakingStartTime[msg.sender] = 0;
        }
        userTimeBounds[msg.sender] = 0;
    }

    /* @dev check if the reward token is same as the staking token
    If staking token and reward token is same then -
    Contract should always contain more or equal tokens than staked tokens
    Because staked tokens are the locked amount that staker can unstake any time */
    function SendRewardTo(uint256 calculatedReward, address _toAddress) internal virtual returns(bool){
        require(_toAddress != address(0), 'STAKING: Address cannot be zero');
        require(rewardToken.balanceOf(address(this)) >= calculatedReward, "STAKING: Not enough reward balance");

        bool successStatus = false;
        if(rewardToken.balanceOf(address(this)) > calculatedReward && calculatedReward > 0){
            if(stakeToken == rewardToken){
                if((rewardToken.balanceOf(address(this)) - calculatedReward) < _totalStakedAmount){
                    calculatedReward = 0;
                }
            }
            if(calculatedReward > 0){
                bool transferStatus = rewardToken.transfer(_toAddress, calculatedReward);
                require(transferStatus, "STAKING: Transfer Failed");
                oldReward[_toAddress] = 0;
                emit Reward(address(this), _toAddress, calculatedReward);
                successStatus = true;
            }
        }
        return successStatus;
    }

    /*
    @dev calculateReward() function returns the reward of the caller of this function
    */
    function calculateReward(address _rewardAddress) public view returns(uint256, uint256){
        uint balances = stakedBalance[_rewardAddress] / 10**18;
        uint256 rewards = 0;
        uint256 timeDifferences;
        if(balances > 0){
            if(endTime > 0){
                if(block.timestamp > endTime){
                    timeDifferences = endTime.sub(stakingStartTime[_rewardAddress]);
                }
                else{
                    timeDifferences = block.timestamp - stakingStartTime[_rewardAddress];
                }
            }
            else {
                timeDifferences = block.timestamp - stakingStartTime[_rewardAddress];
            }
            /* reward calculation
            Reward  = ((Total staked amount / User Staked Amount * 100) + timeFactor + Reward Rate (APY)) * User Staked Amount / 100
            */
            uint256 timeFactor = timeDifferences.div(60).div(60).div(24).div(7);  //consider week
            uint apyFactorInWei = (rewardRate*timeFactor)/52;
            rewards = (((((balances*100)/(_totalStakedAmount/10**18))*(10**18)) + (timeFactor*(10**18)) + apyFactorInWei) * balances / 100);
        }
        return (rewards, timeDifferences);
    }

    /*
    @dev Users withdraw balance from the staked balance, reduced directly from the staked balance
    */
    function withdrawFromStakedBalance(uint256 amount) external virtual nonReentrant whenNotPaused{
        require(isStaking[msg.sender], "STAKING: No staked token balance available");
        require(amount > 0, "STAKING: Cannot withdraw 0");
        require(userTimeBounds[msg.sender] > 0, "STAKING: Request withdraw before withdraw");
        require(block.timestamp >= (userTimeBounds[msg.sender]+ timeBound), "STAKING: Cannot withdraw within interval period");
        (uint256 oldRewardAmount,) = calculateReward(msg.sender);
        if(oldRewardAmount >0 && oldRewardAmount <= rewardToken.balanceOf(address(this))){
            oldReward[msg.sender] = oldReward[msg.sender] + oldRewardAmount;
        }
        stakedBalance[msg.sender] = stakedBalance[msg.sender].sub(amount);
        _totalStakedAmount -= amount;
        bool transferStatus = stakeToken.transfer(msg.sender, amount);
        require(transferStatus,"STAKING: Transfer Failed");
        emit WithdrawnFromStakedBalance(msg.sender, amount);
        userTimeBounds[msg.sender] = 0;
    }

    /* @dev returns the total staked tokens
    and it is independent of the total tokens the contract keeps
    */
    function getTotalStaked() external view returns (uint256) {
        return _totalStakedAmount;
    }

    /*
    @dev function used to claim only the reward for the caller of the method
    */
    function claimMyReward() external nonReentrant whenNotPaused {
        require(isStaking[msg.sender], "STAKING: No staked token balance available");
        uint balance = stakedBalance[msg.sender];
        require(balance > 0, "STAKING: Balance cannot be 0");
        (uint256 reward, uint256 timeDifferences) = calculateReward(msg.sender);
        uint256 totalReward = reward.add(oldReward[msg.sender]);
        require(totalReward > 0, "STAKING: Calculated Reward zero");
        require(timeDifferences/rewardInterval >= 1, "STAKING: Can be claimed only after the interval");
        uint256 rewardTokens = rewardToken.balanceOf(address(this));
        require(rewardTokens > totalReward, "STAKING: Not Enough Reward Balance");
        bool rewardSuccessStatus = SendRewardTo(totalReward,msg.sender);
        //stakingStartTime (set to current time)
        require(rewardSuccessStatus, "STAKING: Claim Reward Failed");
        stakingStartTime[msg.sender] = block.timestamp;
    }

    function withdrawERC20Token(address _tokenContract, uint256 _amount) external virtual onlyOwner {
        require(_tokenContract != address(0), "STAKING: Address cant be zero address"); // 0 address validation
        require(_amount > 0, "STAKING: amount cannot be 0"); // require amount greater than 0
        IERC20 tokenContract = IERC20(_tokenContract);
        require(tokenContract.balanceOf(address(this)) > _amount);
        bool transferStatus = tokenContract.transfer(msg.sender, _amount);
        require(transferStatus,"STAKING: Transfer Failed");
        emit ExternalTokenTransferred(_tokenContract, msg.sender, _amount);
    }

    function getBalance() internal view returns (uint256) {
        return address(this).balance;
    }

    /*
    @dev setting reward rate in weiAmount
    */
    function setRewardRate(uint256 _rewardRate) external virtual onlyOwner whenNotPaused {
        rewardRate = _rewardRate;
        emit UpdatedRewardRate(_rewardRate);
    }

    /*
    @dev setting reward token address
    */
    function setRewardToken(IERC20 _rewardToken) external virtual onlyOwner whenNotPaused {
        rewardToken = _rewardToken;
        emit UpdatedRewardToken(rewardToken);
    }

    /*
    @dev setting reward interval
    */
    function setRewardInterval(uint256 _rewardInterval) external virtual onlyOwner whenNotPaused {
        rewardInterval = _rewardInterval;
        emit UpdatedRewardInterval(rewardInterval);
    }

    /*
    @dev setting staking end time
    */
    function setStakingEndTime(uint256 _endTime) external virtual onlyOwner whenNotPaused {
        endTime = _endTime;
        emit UpdatedStakingEndTime(_endTime);
    }

    /*
    @Dev user request for a withdraw
*/
    function requestWithdraw() external virtual whenNotPaused {
        userTimeBounds[msg.sender] = block.timestamp;
        emit WithdrawRequested(msg.sender);
    }

    function setTimeBound(uint256 _newTimeBound) external virtual onlyOwner whenNotPaused {
        timeBound = _newTimeBound;
        emit TimeBoundChanged(timeBound);
    }
}

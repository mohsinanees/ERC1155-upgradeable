//SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/math/SafeMathUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC1155/ERC1155Upgradeable.sol";

contract AWSTERC1155 is
    ERC1155Upgradeable,
    OwnableUpgradeable,
    PausableUpgradeable
{
    /*
     * Map for storing URIs of NFTs
     */
    mapping(uint256 => string) private _tokenURIs;

    /*
     * State variable for storing the latest minted toke id
     */
    uint256 public currentTokenID;

    function initialize() public virtual initializer {
        __ERC1155_init("https://gateway.pinata.cloud/ipfs/");
        currentTokenID = 0;
    }

    function uri(uint256 _id) public view override returns (string memory) {
        return _tokenURIs[_id];
    }

    function _setURI(uint256 _tokenId, string memory _uri) private {
        require(
            bytes(uri(_tokenId)).length == 0,
            "This token's URI already exists"
        );
        _tokenURIs[_tokenId] = _uri;
    }

    function mint(
        address account,
        uint256 amount,
        string memory _uri,
        bytes memory data
    ) public onlyOwner {
        _mint(account, _getNextTokenID(), amount, data);
        _setURI(_getNextTokenID(), _uri);
        _incrementTokenTypeId(1);
    }

    function mintBatch(
        address to,
        uint256 quantity,
        uint256[] memory values,
        bytes memory data
    ) public onlyOwner {
        require(quantity == values.length);
        uint256[] memory ids;
        for (uint256 i = 0; i < quantity; i++) {
            ids[i] = _getNextTokenID();
        }
        _mintBatch(to, ids, values, data);
        _incrementTokenTypeId(quantity);
    }

    function safeTransfer(
        address to,
        uint256 id,
        uint256 amount,
        bytes memory data
    ) public {
        safeTransferFrom(_msgSender(), to, id, amount, data);
    }

    function burn(
        address owner,
        uint256 id,
        uint256 value
    ) public onlyOwner {
        _burn(owner, id, value);
    }

    function burnBatch(
        address owner,
        uint256[] memory ids,
        uint256[] memory values
    ) public onlyOwner {
        _burnBatch(owner, ids, values);
    }

    function _getNextTokenID() private view returns (uint256) {
        return currentTokenID + 1;
    }

    /**
     * @dev increments the value of _currentTokenID
     */
    function _incrementTokenTypeId(uint256 incValue) private {
        currentTokenID = currentTokenID + incValue;
    }
}

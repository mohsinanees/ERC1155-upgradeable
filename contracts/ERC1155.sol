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
        _tokenURIs[_tokenId] = _uri;
    }

    function _setBatchURI(uint256[] ids, string[] memory uris) {
        for (uint256 i = 0; i < ids.length; i++) {
            _setURI(ids[i], uris[i]);
        }
    }

    function mint(
        address account,
        uint256 amount,
        string memory _uri,
        bytes memory data
    ) public onlyOwner {
        _mint(account, _getNextTokenID(), amount, data);
        _setURI(_getNextTokenID(), _uri);
        _incrementTokenId();
    }

    // In case ids supplied manually
    function mintBatch(
        address to,
        uint256[] ids,
        string[] memory uris,
        uint256[] values,
        bytes memory data
    ) public onlyOwner {
        _mintBatch(to, ids, values, data);
        _setBatchURI(ids, uris);
    }

    // In case of auto increment ids and single base URI
    function mintBatch(
        address to,
        uint256 tokenCount,
        uint256 values,
        string memory _baseURI,
        bytes memory data
    ) public onlyOwner {
        uint256[] ids = new uint256[](tokenCount);
        string[] memory uris = new string[](tokenCount);
        for (uint256 i = 0; i < tokenCount; i++) {
            ids[i] = _getNextTokenID();
            uris[i] = string(
                abi.encodePacked(
                    _baseURI,
                    "/",
                    Strings.toString(ids[i]),
                    ".json"
                )
            );
            _incrementTokenId();
        }
        _mintBatch(to, ids, values, data);
        _setBatchURI(ids, uris);
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
    function _incrementTokenId() private {
        currentTokenID++;
    }
}

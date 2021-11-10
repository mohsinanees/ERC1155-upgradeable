//SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/StringsUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/math/SafeMathUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC1155/ERC1155Upgradeable.sol";

contract AWSTERC1155_auto is
    ERC1155Upgradeable,
    OwnableUpgradeable,
    PausableUpgradeable
{
    /*
     * Map for storing URIs of NFTs
     */
    mapping(uint256 => string) private _tokenURIs;

    /*
     * State variable for storing the latest minted token id
     */
    uint256 public currentTokenID;

    function initialize() public virtual initializer {
        __ERC1155_init("https://gateway.pinata.cloud/ipfs/");
        __Ownable_init();
        __Pausable_init_unchained();
    }

    function uri(uint256 _id) public view override returns (string memory) {
        return _tokenURIs[_id];
    }

    function setURI(uint256 _tokenId, string memory _uri) public onlyOwner {
        _tokenURIs[_tokenId] = _uri;
    }

    function setBatchURI(uint256[] memory ids, string[] memory uris)
        public
        onlyOwner
    {
        for (uint256 i = 0; i < ids.length; i++) {
            setURI(ids[i], uris[i]);
        }
    }

    function mint(
        address account,
        uint256 amount,
        string memory _uri,
        bytes memory data
    ) public onlyOwner {
        _mint(account, _getNextTokenID(), amount, data);
        setURI(_getNextTokenID(), _uri);
        _incrementTokenId();
    }

    // In case of auto increment ids and single base URI
    function mintBatch(
        address to,
        uint256 tokenCount,
        string memory _baseURI,
        uint256[] memory values,
        bytes memory data
    ) public onlyOwner {
        uint256[] memory ids = new uint256[](tokenCount);
        string[] memory uris = new string[](tokenCount);
        for (uint256 i = 0; i < tokenCount; i++) {
            ids[i] = _getNextTokenID();
            uris[i] = string(
                abi.encodePacked(
                    _baseURI,
                    "/",
                    StringsUpgradeable.toString(ids[i]),
                    ".json"
                )
            );
            _incrementTokenId();
        }
        _mintBatch(to, ids, values, data);
        setBatchURI(ids, uris);
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

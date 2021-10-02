//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";

contract LootOwners is Ownable {
  // Struct for updating the owners
  struct OwnerUpdate {
    address owner;
    uint256[] tokenIds;
  }

  // Mapping from token ID to owner address
  mapping(uint256 => address) private _owners;

  // Mapping owner address to token count
  mapping(address => uint256) private _balances;

  // Mapping from owner to list of owned token IDs
  mapping(address => mapping(uint256 => uint256)) private _ownedTokens;

  // Mapping from owner to operator approvals
  mapping(address => mapping(address => bool)) private _operatorApprovals;

  /**
   * @dev See {IERC721-balanceOf}.
   */
  function balanceOf(address owner) public view virtual returns (uint256) {
    require(owner != address(0), "ERC721: balance query for the zero address");
    return _balances[owner];
  }

  /**
   * @dev See {IERC721-ownerOf}.
   */
  function ownerOf(uint256 tokenId) public view virtual returns (address) {
    address owner = _owners[tokenId];
    require(owner != address(0), "ERC721: owner query for nonexistent token");
    return owner;
  }

  /**
   * @dev See {IERC721Enumerable-tokenOfOwnerByIndex}.
   */
  function tokenOfOwnerByIndex(address owner, uint256 index)
    public
    view
    virtual
    returns (uint256)
  {
    require(
      index < balanceOf(owner),
      "ERC721Enumerable: owner index out of bounds"
    );
    return _ownedTokens[owner][index];
  }

  /**
   * @dev See {IERC721-setApprovalForAll}.
   */
  function setApprovalForAll(address operator, bool approved) public virtual {
    require(operator != _msgSender(), "ERC721: approve to caller");

    _operatorApprovals[_msgSender()][operator] = approved;
  }

  /**
   * @dev See {IERC721-isApprovedForAll}.
   */
  function isApprovedForAll(address owner, address operator)
    public
    view
    virtual
    returns (bool)
  {
    return _operatorApprovals[owner][operator];
  }

  /**
   * The owner of this contract can call this function to 
   * update the owner states
   *
   * The update should include entries for incoming owners and
   * any existing owners whose balances have changed
   *
   * It can also include entries for owners whose balances may not have
   * changed but haven't yet been indexed by the contract
   *
   * It's not necessary to include entries for outgoing owners (they'll 
   * be deleted automatically)
   */
  function setLootOwners(OwnerUpdate[] calldata _ownerUpdates) public onlyOwner {
    // For each of the owner updates
    for (uint256 i = 0; i < _ownerUpdates.length; i++) {
      address owner = _ownerUpdates[i].owner;
      uint256[] calldata tokenIds = _ownerUpdates[i].tokenIds;

      // Reset the owned tokens of the owner
      uint256 ownerBalance = _balances[owner];
      for (uint256 j = 0; j < ownerBalance; j++) {
        delete _ownedTokens[owner][j];
      }

      // Reset the balance of the owner
      delete _balances[owner];

      // For each of the token ids
      for (uint256 k = 0; k < tokenIds.length; k++) {
        address previousOwner = _owners[tokenIds[k]];

        // Reset the owned tokens of the previous owner
        uint256 previousOwnerBalance = _balances[previousOwner];
        for (uint256 l = 0; l < previousOwnerBalance; l++) {
          delete _ownedTokens[previousOwner][l];
        }

        // Reset the balances of the previous owner
        delete _balances[previousOwner];

        // Reset the owner of the token ids
        delete _owners[tokenIds[k]];
      }
    }

    // For each of the owner updates
    for (uint256 k = 0; k < _ownerUpdates.length; k++) {
      address owner = _ownerUpdates[k].owner;
      uint256[] calldata tokenIds = _ownerUpdates[k].tokenIds;

      // Set the balances of the owner
      _balances[owner] = tokenIds.length;

      for (uint256 l = 0; l < tokenIds.length; l++) {
        // Set the owner of the token ids
        _owners[tokenIds[l]] = owner;
        // Set the owned tokens of the owner
        _ownedTokens[owner][l] = tokenIds[l];
      }
    }
  }
}

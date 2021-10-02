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
  function balanceOf(address owner)
    public
    view
    virtual
    override
    returns (uint256)
  {
    require(owner != address(0), "ERC721: balance query for the zero address");
    return _balances[owner];
  }

  /**
   * @dev See {IERC721-ownerOf}.
   */
  function ownerOf(uint256 tokenId)
    public
    view
    virtual
    override
    returns (address)
  {
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
    override
    returns (uint256)
  {
    require(
      index < ERC721.balanceOf(owner),
      "ERC721Enumerable: owner index out of bounds"
    );
    return _ownedTokens[owner][index];
  }

  /**
   * @dev See {IERC721-setApprovalForAll}.
   */
  function setApprovalForAll(address operator, bool approved)
    public
    virtual
    override
  {
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
    override
    returns (bool)
  {
    return _operatorApprovals[owner][operator];
  }

  /**
   * Update function called by the owner of this contract
   *
   * The update should include entries for incoming-owners and
   * any existing owners whose balances have changed
   *
   * It's necessary to include entries for owners whose balances haven't
   * changed if they're not already indexed by the contract
   *
   * It's not necessary to include entries for out-going owners since
   * their state will be reset automatically
   *
   * First we reset the state for the owners and token ids included
   * in the update, then we update the state with the new values 
   */
  function setOwners(OwnerUpdate[] memory _ownerUpdates) public onlyOwner {
    // For each of the owner updates
    for (uint256 i = 0; i < _ownerUpdates.length; i++) {
        owner = _ownerUpdates[i].owner;
        tokenIds = _ownerUpdates[i].tokenIds;

        // Reset the balances of the owner
        delete _balances[owner]
        // Reset the owned tokens of the owner
        delete _ownedTokens[owner]

        // For each of the token ids
        for (uint256 i = 0; i < tokenIds.length; i++) {
          previousOwner = _owners[tokenIds[i]]
          // Reset the balances of the previous owner
          delete _balances[previousOwner]
          // Reset the owned tokens of the previous owner
          delete _ownedTokens[previousOwner]
          // Reset the owner of the token ids
          delete _owners[tokenIds[i]]
        }
    }

    // For each of the owner updates
    for (uint256 i = 0; i < _ownerUpdates.length; i++) {
        owner = _ownerUpdates[i].owner;
        tokenIds = _ownerUpdates[i].tokenIds;

        // Set the balances of the owner
        _balances[owner] = tokenIds.length

        // Set the owner of the token ids
        for (uint256 i = 0; i < tokenIds.length; i++) {
          _owners[tokenIds[i]] = owner;
        }

        // Set the owned tokens of the owner
        for (uint256 i = 0; i < tokenIds.length; i++) {
          _ownedTokens[owner][i] = tokenIds[i]
        }
    }
  }
}

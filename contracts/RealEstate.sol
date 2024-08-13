// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

contract RealEstate is ERC721, ERC721URIStorage{
    //  using Counters for Counters.Counter;
    // Counters.Counter private _tokenIds;
     uint256 private _nextTokenId;

    constructor()ERC721("Real Estate" , "REAL"){}

    // function mint(string memory tokenURI) public returns(uint256){
    //     uint256 tokenId = _nextTokenId++;
    //     _mint(msg.sender,tokenId);
    //     _setTokenURI(tokenId,tokenURI);
    //     return tokenId;
    // }

    function safeMint( string memory uri) public returns(uint256) {
        uint256 tokenId = ++_nextTokenId;
        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, uri);
        return tokenId;
    }
    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

     function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
     function totalSupply() public view returns (uint256) {
        return _nextTokenId;
    }
}
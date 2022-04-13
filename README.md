# NFTer
How about using IPFS to host your NFTs  in a decentralized way? This simple Dapp allows you to mint new tokens after successfully uploading the file to crust's IPFS and getting the file hash(CID) which will be considered as the token ID in our smart contract (ERC721.sol). 

To run the Dapp : 
- npm install
- npm start 

## ERC721

Contracts to be found in src/components/contracts
Implemented the ERC721 token standard interface with a small modification(using string instead of uint256 to store token ID)


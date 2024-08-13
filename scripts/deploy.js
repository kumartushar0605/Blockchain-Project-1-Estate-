const hre = require("hardhat");
// const {ethers} = require("hardhat");

const tokens = async(n) => {
    return hre.ethers.parseUnits(n.toString(), 'ether')
  }

  async function main() {
    console.log('Ethers version:', ethers.version);
    // const [buyer,seller,inspector,lender]=await ethers.getSigners();
    const accounts =await ethers.getSigners();
    // console.log(accounts[17].address)
    const seller = accounts[1];
    const inspector = accounts[2];
    const lender = accounts[3];
    const buyer = accounts[4];

    const realEstate = await ethers.deployContract('RealEstate');
     await realEstate.waitForDeployment();

    console.log(`Deployed Real Estate Contract at: ${realEstate.target}`)
    console.log(`Minting 3 properties...\n`)

    
  for (let i = 0; i < 3; i++) {
    const transaction = await realEstate.connect(seller).safeMint(`https://ipfs.io/ipfs/QmQVcpsjrA6cr1iJjZAodYwmPekYgbnXGo4DFubJiLc2EB/${i + 1}.json`)
    await transaction.wait()
  }

  console.log("Total supply is " + (await realEstate.totalSupply()).toString());
  

 const escrow = await ethers.deployContract('Escrow', [
    realEstate.target,
    seller.address,
    inspector.address,
    lender.address
]);
await escrow.waitForDeployment();
console.log("Escrow Address: " + escrow.target);

  console.log(`Deployed Escrow Contract at: ${escrow.target}`)
  console.log(`Listing 3 properties...\n`)

  for (let i = 0; i < 3; i++) {
    // Approve properties...
    let transaction = await realEstate.connect(seller).approve(escrow.target, i + 1)
    await transaction.wait()
  }

  console.log("hiiiiiiiiiiiiii")
  // Listing properties...
  transaction = await escrow.connect(seller).list(1, buyer.address, tokens(20), tokens(10))
  await transaction.wait()

  transaction = await escrow.connect(seller).list(2, buyer.address, tokens(15), tokens(5))
  await transaction.wait()

  transaction = await escrow.connect(seller).list(3, buyer.address, tokens(10), tokens(5))
  await transaction.wait()
  console.log(`Finished.`)


  

  }

//   We recommend this pattern to be able to use async/await everywhere
  // and properly handle errors.
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
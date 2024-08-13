const { expect } = require('chai');
const { ethers } = require('hardhat');

const tokens = (n) => {
    return ethers.parseUnits(n.toString(), 'ether');
}

describe('test', function () {
    let tes;

    beforeEach(async function () {
        // Deploy the contract
        tes = await ethers.deployContract("test");
        await tes.waitForDeployment(); // Wait for the contract to be deployed

        console.log("Contract Address is: " + tes.target); // Log the contract address
    });

    it('Should deploy the contract and have an address', function () {
        expect(tes.target).to.not.be.undefined; // Check if the contract address is defined
    });
});

describe('Escrow', function () {
    let buyer, seller, inspector, lender;
    let realEstate, escrow;

    beforeEach(async function () {
        // Setup accounts
        [buyer, seller, inspector, lender] = await ethers.getSigners();

        // Deploy Real Estate contract
        realEstate = await ethers.deployContract('RealEstate');
        await realEstate.waitForDeployment();
        console.log("NFT Address: " + realEstate.target);

        // Mint an NFT
        let transaction = await realEstate.connect(seller).safeMint("https://ipfs.io/ipfs/QmTudSYeM7mz3PkYEWXWqPjomRPHogcMFSq7XAvsvsgAPS");
        await transaction.wait();

        const mintedTokenId = await realEstate.totalSupply(); // Assuming the last minted token ID is the one we need

        console.log("Minted Token ID: " + mintedTokenId.toString());
        // Deploy Escrow contract
        escrow = await ethers.deployContract('Escrow', [
            realEstate.target,
            seller.address,
            inspector.address,
            lender.address
        ]);
        await escrow.waitForDeployment();
        console.log("Escrow Address: " + escrow.target);

        // Approve Property
        transaction = await realEstate.connect(seller).approve(escrow.target, 1);
        await transaction.wait();

        // List Property
        transaction = await escrow.connect(seller).list(1, buyer.address, tokens(10), tokens(5));
        await transaction.wait();
    });

    describe('Deployment', function () {
        it('Returns NFT address', async function () {
            const result = await escrow.nftAddress();
            expect(result).to.be.equal(realEstate.target);
        });

        it('Returns seller', async function () {
            const result = await escrow.seller();
            expect(result).to.be.equal(seller.address);
        });

        it('Returns inspector', async function () {
            const result = await escrow.inspector();
            expect(result).to.be.equal(inspector.address);
        });

        it('Returns lender', async function () {
            const result = await escrow.lender();
            expect(result).to.be.equal(lender.address);
        });
    });

    describe('Listing', function () {
        it('Updates as listed', async function () {
            const result = await escrow.isListed(1);
            expect(result).to.be.equal(true);
        });

        it('Returns buyer', async function () {
            const result = await escrow.buyer(1);
            expect(result).to.be.equal(buyer.address);
        });

        it('Returns purchase price', async function () {
            const result = await escrow.purchasePrice(1);
            expect(result).to.be.equal(tokens(10));
        });

        it('Returns escrow amount', async function () {
            const result = await escrow.escrowAmount(1);
            expect(result).to.be.equal(tokens(5));
        });

        it('Updates ownership', async function () {
            expect(await realEstate.ownerOf(1)).to.be.equal(escrow.target);
        });
    });

    describe('Deposits', function () {
        beforeEach(async function () {
            const transaction = await escrow.connect(buyer).depositEarnest(1, { value: tokens(5) });
            await transaction.wait();
        });

        it('Updates contract balance', async function () {
            const result = await escrow.getBalance();
            expect(result).to.be.equal(tokens(5));
        });
    });

    describe('Inspection', function () {
        beforeEach(async function () {
            const transaction = await escrow.connect(inspector).updateInspectionStatus(1, true);
            await transaction.wait();
        });

        it('Updates inspection status', async function () {
            const result = await escrow.inspectionPassed(1);
            expect(result).to.be.equal(true);
        });
    });

    describe('Approval', function () {
        beforeEach(async function () {
            let transaction = await escrow.connect(buyer).approveSale(1);
            await transaction.wait();

            transaction = await escrow.connect(seller).approveSale(1);
            await transaction.wait();

            transaction = await escrow.connect(lender).approveSale(1);
            await transaction.wait();
        });

        it('Updates approval status', async function () {
            expect(await escrow.approval(1, buyer.address)).to.be.equal(true);
            expect(await escrow.approval(1, seller.address)).to.be.equal(true);
            expect(await escrow.approval(1, lender.address)).to.be.equal(true);
        });
    });

    describe('Sale', function () {
        beforeEach(async function () {
            let transaction = await escrow.connect(buyer).depositEarnest(1, { value: tokens(5) });
            await transaction.wait();

            transaction = await escrow.connect(inspector).updateInspectionStatus(1, true);
            await transaction.wait();

            transaction = await escrow.connect(buyer).approveSale(1);
            await transaction.wait();

            transaction = await escrow.connect(seller).approveSale(1);
            await transaction.wait();

            transaction = await escrow.connect(lender).approveSale(1);
            await transaction.wait();

            await lender.sendTransaction({ to: escrow.target, value: tokens(5) });

            transaction = await escrow.connect(seller).finalizeSale(1);
            await transaction.wait();
        });

        it('Updates ownership', async function () {
            expect(await realEstate.ownerOf(1)).to.be.equal(buyer.address);
        });

        it('Updates balance', async function () {
            expect(await escrow.getBalance()).to.be.equal(0);
        });
    });
});

import {
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";
import { expect } from "chai";
import hre from "hardhat";
import { getAddress } from "viem";

describe("Phonomorph", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployPhonomorphFixture() {
    // Contracts are deployed using the first signer/account by default
    const [owner, otherAccount, user1, user2] = await hre.viem.getWalletClients();

    // Deploy using the upgrades plugin with ethers
    const { ethers, upgrades } = hre;
    const [ethersOwner] = await ethers.getSigners();
    
    const PhonomorphFactory = await ethers.getContractFactory("Phonomorph");
    const phonomorphProxy = await upgrades.deployProxy(PhonomorphFactory, [ethersOwner.address]);
    await phonomorphProxy.waitForDeployment();

    // Get the contract instance through viem using the proxy address
    const phonomorph = await hre.viem.getContractAt(
      "Phonomorph", 
      await phonomorphProxy.getAddress()
    );

    const publicClient = await hre.viem.getPublicClient();

    return {
      phonomorph,
      phonomorphProxy,
      owner,
      otherAccount,
      user1,
      user2,
      publicClient,
    };
  }

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      const { phonomorph, owner } = await loadFixture(deployPhonomorphFixture);

      expect(await phonomorph.read.owner()).to.equal(
        getAddress(owner.account.address)
      );
    });

    it("Should initialize with Phonomorph enabled", async function () {
      const { phonomorph } = await loadFixture(deployPhonomorphFixture);

      expect(await phonomorph.read.phonomorphEnabled()).to.equal(true);
    });

    it("Should not allow initialize to be called twice", async function () {
      const { phonomorph, owner } = await loadFixture(deployPhonomorphFixture);

      await expect(
        phonomorph.write.initialize([owner.account.address])
      ).to.be.rejectedWith("InvalidInitialization");
    });
  });

  describe("Registration", function () {
    it("Should register a new encrypted phone number successfully", async function () {
      const { phonomorph, user1 } = await loadFixture(deployPhonomorphFixture);
      
      const encryptedPhone = "encrypted_phone_123";
      const userAddress = user1.account.address;

      await expect(
        phonomorph.write.register([encryptedPhone, userAddress])
      ).to.be.fulfilled;

      expect(await phonomorph.read.getAddress([encryptedPhone])).to.equal(
        getAddress(userAddress)
      );
    });

    it("Should emit Registered event when registering", async function () {
      const { phonomorph, user1, publicClient } = await loadFixture(deployPhonomorphFixture);
      
      const encryptedPhone = "encrypted_phone_456";
      const userAddress = user1.account.address;

      const hash = await phonomorph.write.register([encryptedPhone, userAddress]);
      await publicClient.waitForTransactionReceipt({ hash });

      const registeredEvents = await phonomorph.getEvents.Registered();
      expect(registeredEvents).to.have.lengthOf(1);
      expect(registeredEvents[0].args._address).to.equal(getAddress(userAddress));
    });

    it("Should fail when trying to register the same encrypted phone number twice", async function () {
      const { phonomorph, user1, user2 } = await loadFixture(deployPhonomorphFixture);
      
      const encryptedPhone = "encrypted_phone_789";

      // First registration should succeed
      await phonomorph.write.register([encryptedPhone, user1.account.address]);

      // Second registration should fail
      await expect(
        phonomorph.write.register([encryptedPhone, user2.account.address])
      ).to.be.rejectedWith("Already registered");
    });

    it("Should fail when Phonomorph is disabled", async function () {
      const { phonomorph, user1, owner } = await loadFixture(deployPhonomorphFixture);
      
      // Disable Phonomorph
      await phonomorph.write.disablePhonomorph();

      const encryptedPhone = "encrypted_phone_disabled";

      await expect(
        phonomorph.write.register([encryptedPhone, user1.account.address])
      ).to.be.rejectedWith("Phonomorph is not enabled");
    });

    it("Should allow registration after re-enabling Phonomorph", async function () {
      const { phonomorph, user1 } = await loadFixture(deployPhonomorphFixture);
      
      // Disable and then re-enable Phonomorph
      await phonomorph.write.disablePhonomorph();
      await phonomorph.write.enablePhonomorph();

      const encryptedPhone = "encrypted_phone_reenabled";

      await expect(
        phonomorph.write.register([encryptedPhone, user1.account.address])
      ).to.be.fulfilled;
    });
  });

  describe("Address Retrieval", function () {
    it("Should return the correct address for a registered encrypted phone number", async function () {
      const { phonomorph, user1 } = await loadFixture(deployPhonomorphFixture);
      
      const encryptedPhone = "encrypted_phone_get";
      const userAddress = user1.account.address;

      await phonomorph.write.register([encryptedPhone, userAddress]);

      expect(await phonomorph.read.getAddress([encryptedPhone])).to.equal(
        getAddress(userAddress)
      );
    });

    it("Should return zero address for unregistered encrypted phone number", async function () {
      const { phonomorph } = await loadFixture(deployPhonomorphFixture);
      
      const unregisteredPhone = "unregistered_phone";

      expect(await phonomorph.read.getAddress([unregisteredPhone])).to.equal(
        "0x0000000000000000000000000000000000000000"
      );
    });

    it("Should return correct addresses for multiple registrations", async function () {
      const { phonomorph, user1, user2 } = await loadFixture(deployPhonomorphFixture);
      
      const encryptedPhone1 = "encrypted_phone_multi_1";
      const encryptedPhone2 = "encrypted_phone_multi_2";

      await phonomorph.write.register([encryptedPhone1, user1.account.address]);
      await phonomorph.write.register([encryptedPhone2, user2.account.address]);

      expect(await phonomorph.read.getAddress([encryptedPhone1])).to.equal(
        getAddress(user1.account.address)
      );
      expect(await phonomorph.read.getAddress([encryptedPhone2])).to.equal(
        getAddress(user2.account.address)
      );
    });
  });

  describe("Owner Controls", function () {
    describe("Disable Phonomorph", function () {
      it("Should allow owner to disable Phonomorph", async function () {
        const { phonomorph } = await loadFixture(deployPhonomorphFixture);

        await expect(phonomorph.write.disablePhonomorph()).to.be.fulfilled;

        expect(await phonomorph.read.phonomorphEnabled()).to.equal(false);
      });

      it("Should emit PhonomorphStatusChanged event when disabling", async function () {
        const { phonomorph, publicClient } = await loadFixture(deployPhonomorphFixture);

        const hash = await phonomorph.write.disablePhonomorph();
        await publicClient.waitForTransactionReceipt({ hash });

        const statusChangedEvents = await phonomorph.getEvents.PhonomorphStatusChanged();
        expect(statusChangedEvents).to.have.lengthOf(1);
        expect(statusChangedEvents[0].args.enabled).to.equal(false);
      });

      it("Should fail when non-owner tries to disable Phonomorph", async function () {
        const { phonomorph, otherAccount } = await loadFixture(deployPhonomorphFixture);

        const phonomorphAsOtherAccount = await hre.viem.getContractAt(
          "Phonomorph",
          phonomorph.address,
          { client: { wallet: otherAccount } }
        );

        await expect(
          phonomorphAsOtherAccount.write.disablePhonomorph()
        ).to.be.rejectedWith("OwnableUnauthorizedAccount");
      });
    });

    describe("Enable Phonomorph", function () {
      it("Should allow owner to enable Phonomorph after disabling", async function () {
        const { phonomorph } = await loadFixture(deployPhonomorphFixture);

        // First disable, then enable
        await phonomorph.write.disablePhonomorph();
        await expect(phonomorph.write.enablePhonomorph()).to.be.fulfilled;

        expect(await phonomorph.read.phonomorphEnabled()).to.equal(true);
      });

      it("Should emit PhonomorphStatusChanged event when enabling", async function () {
        const { phonomorph, publicClient } = await loadFixture(deployPhonomorphFixture);

        // Disable first to have a state change when enabling
        await phonomorph.write.disablePhonomorph();
        
        const hash = await phonomorph.write.enablePhonomorph();
        await publicClient.waitForTransactionReceipt({ hash });

        const statusChangedEvents = await phonomorph.getEvents.PhonomorphStatusChanged();
        // Get the last event (the enable event)
        const lastEvent = statusChangedEvents[statusChangedEvents.length - 1];
        expect(lastEvent.args.enabled).to.equal(true);
      });

      it("Should fail when non-owner tries to enable Phonomorph", async function () {
        const { phonomorph, otherAccount } = await loadFixture(deployPhonomorphFixture);

        const phonomorphAsOtherAccount = await hre.viem.getContractAt(
          "Phonomorph",
          phonomorph.address,
          { client: { wallet: otherAccount } }
        );

        await expect(
          phonomorphAsOtherAccount.write.enablePhonomorph()
        ).to.be.rejectedWith("OwnableUnauthorizedAccount");
      });
    });
  });

  describe("Integration Tests", function () {
    it("Should maintain existing registrations when disabling and re-enabling", async function () {
      const { phonomorph, user1 } = await loadFixture(deployPhonomorphFixture);
      
      const encryptedPhone = "encrypted_phone_integration";

      // Register a phone number
      await phonomorph.write.register([encryptedPhone, user1.account.address]);

      // Disable Phonomorph
      await phonomorph.write.disablePhonomorph();

      // Address should still be retrievable
      expect(await phonomorph.read.getAddress([encryptedPhone])).to.equal(
        getAddress(user1.account.address)
      );

      // Re-enable Phonomorph
      await phonomorph.write.enablePhonomorph();

      // Address should still be retrievable
      expect(await phonomorph.read.getAddress([encryptedPhone])).to.equal(
        getAddress(user1.account.address)
      );
    });

    it("Should handle multiple registrations and state changes correctly", async function () {
      const { phonomorph, user1, user2, publicClient } = await loadFixture(deployPhonomorphFixture);
      
      const encryptedPhone1 = "encrypted_phone_scenario_1";
      const encryptedPhone2 = "encrypted_phone_scenario_2";

      // Register first phone number
      await phonomorph.write.register([encryptedPhone1, user1.account.address]);

      // Disable Phonomorph
      await phonomorph.write.disablePhonomorph();

      // Try to register second phone number (should fail)
      await expect(
        phonomorph.write.register([encryptedPhone2, user2.account.address])
      ).to.be.rejectedWith("Phonomorph is not enabled");

      // Re-enable Phonomorph
      await phonomorph.write.enablePhonomorph();

      // Now second registration should work
      await expect(
        phonomorph.write.register([encryptedPhone2, user2.account.address])
      ).to.be.fulfilled;

      // Both addresses should be retrievable
      expect(await phonomorph.read.getAddress([encryptedPhone1])).to.equal(
        getAddress(user1.account.address)
      );
      expect(await phonomorph.read.getAddress([encryptedPhone2])).to.equal(
        getAddress(user2.account.address)
      );
    });
  });

  describe("Proxy and Upgradeability", function () {
    it("Should deploy through a proxy", async function () {
      const { phonomorph, phonomorphProxy } = await loadFixture(deployPhonomorphFixture);

      // The contract should be accessible through the proxy address
      expect(phonomorph.address).to.equal(await phonomorphProxy.getAddress());
    });

    it("Should maintain state through proxy", async function () {
      const { phonomorph, user1 } = await loadFixture(deployPhonomorphFixture);
      
      const encryptedPhone = "encrypted_phone_proxy_test";

      // Register through proxy
      await phonomorph.write.register([encryptedPhone, user1.account.address]);

      // Read through proxy should return the same value
      expect(await phonomorph.read.getAddress([encryptedPhone])).to.equal(
        getAddress(user1.account.address)
      );
    });
  });
}); 
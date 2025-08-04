// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title PhonomorphDirect
 * @author Jordi Planas
 * @notice This contract manages the association between encrypted phone numbers and Ethereum addresses
 * @dev Non-upgradeable version of Phonomorph for direct deployment
 * @custom:security-contact jorvixsky@proton.me
 */
contract PhonomorphDirect is Ownable {
    
    // ============ State Variables ============
    
    /**
     * @notice Maps encrypted phone numbers to their associated Ethereum addresses
     * @dev Uses encrypted phone numbers as keys to ensure privacy while maintaining uniqueness
     */
    mapping(string => address) public encryptedPhoneNumberToAddress;
    
    /**
     * @notice Controls whether the Phonomorph registration system is currently enabled
     * @dev When false, new registrations are blocked but existing mappings remain accessible
     */
    bool public phonomorphEnabled;

    // ============ Events ============
    
    /**
     * @notice Emitted when a new phone number to address association is registered
     * @param _encryptedPhoneNumber The encrypted phone number that was registered
     * @param _address The Ethereum address associated with the phone number
     */
    event Registered(string indexed _encryptedPhoneNumber, address indexed _address);

    /**
     * @notice Emitted when the Phonomorph system is enabled or disabled
     * @param enabled The new enabled status (true for enabled, false for disabled)
     */
    event PhonomorphStatusChanged(bool indexed enabled);

    // ============ Constructor ============
    
    /**
     * @notice Constructor that initializes the contract
     * @param _owner The address that will be set as the contract owner
     */
    constructor(address _owner) Ownable(_owner) {
        phonomorphEnabled = true;
    }

    // ============ Public Functions ============
    
    /**
     * @notice Registers an association between an encrypted phone number and an Ethereum address
     * @dev Prevents duplicate registrations by checking if the encrypted phone number is already mapped
     * @param _encryptedPhoneNumber The encrypted representation of the phone number
     * @param _address The Ethereum address to associate with the encrypted phone number
     * @custom:requirements The encrypted phone number must not already be registered
     * @custom:requirements The Phonomorph system must be enabled
     * @custom:effects Updates the encryptedPhoneNumberToAddress mapping
     * @custom:emits Registered event with the encrypted phone number and address
     */
    function register(string memory _encryptedPhoneNumber, address _address) public {
        require(phonomorphEnabled, "Phonomorph is not enabled");
        require(encryptedPhoneNumberToAddress[_encryptedPhoneNumber] == address(0), "Already registered");
        encryptedPhoneNumberToAddress[_encryptedPhoneNumber] = _address;
        emit Registered(_encryptedPhoneNumber, _address);
    }

    /**
     * @notice Retrieves the Ethereum address associated with an encrypted phone number
     * @dev Returns the address mapped to the encrypted phone number, or address(0) if not found
     * @param _encryptedPhoneNumber The encrypted representation of the phone number
     * @return The associated Ethereum address, or address(0) if not found
     */
    function getAddress(string memory _encryptedPhoneNumber) public view returns (address) {
        return encryptedPhoneNumberToAddress[_encryptedPhoneNumber];
    }

    // ============ Owner-Only Functions ============

    /**
     * @notice Disables the Phonomorph registration system
     * @dev Only the contract owner can call this function. Existing mappings remain accessible
     * @custom:requirements Only the contract owner can call this function
     * @custom:effects Sets phonomorphEnabled to false, preventing new registrations
     * @custom:emits PhonomorphStatusChanged event with false status
     */
    function disablePhonomorph() public onlyOwner {
        phonomorphEnabled = false;
        emit PhonomorphStatusChanged(false);
    }

    /**
     * @notice Enables the Phonomorph registration system
     * @dev Only the contract owner can call this function. Allows new registrations to proceed
     * @custom:requirements Only the contract owner can call this function
     * @custom:effects Sets phonomorphEnabled to true, allowing new registrations
     * @custom:emits PhonomorphStatusChanged event with true status
     */
    function enablePhonomorph() public onlyOwner {
        phonomorphEnabled = true;
        emit PhonomorphStatusChanged(true);
    }
} 
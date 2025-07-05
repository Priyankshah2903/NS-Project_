// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Purely {

    struct Policy {
        uint id;
        string name;
        uint coverValue;
        uint premium;
        uint duration;
        address insurer;
    }

    struct Claim {
        uint id;
        address patient;
        address hospital;
        string ipfsHash;
        uint amount;
        bool approved;
        bool rejected;
    }

    struct Transaction {
        address from;
        address to;
        uint amount;
        bool settled;
    }

    mapping(address => bool) public isRegisteredPatient;
    mapping(address => bool) public isHospital;
    mapping(address => Policy[]) public insurerPolicies;
    mapping(uint => Claim) public claims;
    mapping(uint => Transaction) public transactions;

    address[] public insurers;
    uint public claimCount;
    uint public transactionCount;

    event Registered(address indexed patient);
    event DIDRegistered(address indexed user, string role);
    event PolicyCreated(address indexed insurer, uint id);
    event PolicyPurchased(address indexed patient, uint policyId);
    event ClaimSubmitted(uint indexed id);
    event ClaimApproved(uint indexed id);
    event ClaimRejected(uint indexed id);

    modifier onlyRegisteredPatient() {
        require(isRegisteredPatient[msg.sender], "Not a registered patient");
        _;
    }

    modifier onlyHospital() {
        require(isHospital[msg.sender], "Not a registered hospital");
        _;
    }

    function registerPatient() public payable {
        require(!isRegisteredPatient[msg.sender], "Already registered");
        require(msg.value >= 0.01 ether, "Registration fee required");
        isRegisteredPatient[msg.sender] = true;
        emit Registered(msg.sender);
    }

    function registerHospital() public {
        require(!isHospital[msg.sender], "Already registered");
        isHospital[msg.sender] = true;
        emit DIDRegistered(msg.sender, "Hospital");
    }

    function createPolicy(string memory _name, uint _coverValue, uint _premium, uint _duration) public {
        insurers.push(msg.sender);
        Policy memory pol = Policy(insurerPolicies[msg.sender].length, _name, _coverValue, _premium, _duration, msg.sender);
        insurerPolicies[msg.sender].push(pol);
        emit PolicyCreated(msg.sender, pol.id);
    }

    function buyPolicy(address insurer, uint policyId) public payable onlyRegisteredPatient {
        Policy memory p = insurerPolicies[insurer][policyId];
        require(msg.value >= p.premium, "Insufficient premium");
        payable(insurer).transfer(msg.value);
        emit PolicyPurchased(msg.sender, policyId);
    }

    function submitClaim(address patientAddr, string memory ipfsHash, uint amount) public onlyHospital {
        require(isRegisteredPatient[patientAddr], "Invalid patient");
        claimCount++;
        claims[claimCount] = Claim(claimCount, patientAddr, msg.sender, ipfsHash, amount, false, false);
        emit ClaimSubmitted(claimCount);
    }

    function approveClaim(uint claimId) public payable {
        Claim storage c = claims[claimId];
        require(!c.approved && !c.rejected, "Already processed");
        require(msg.value >= c.amount, "Insufficient payment");
        payable(c.hospital).transfer(c.amount);
        c.approved = true;
        transactionCount++;
        transactions[transactionCount] = Transaction(msg.sender, c.hospital, c.amount, true);
        emit ClaimApproved(claimId);
    }

    function rejectClaim(uint claimId) public {
        Claim storage c = claims[claimId];
        require(!c.approved && !c.rejected, "Already processed");
        c.rejected = true;
        emit ClaimRejected(claimId);
    }
}

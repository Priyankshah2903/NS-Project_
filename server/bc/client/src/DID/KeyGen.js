const EthCrypto = require('eth-crypto');
const fs = require('fs');
const path = require('path');

const didStoragePath = path.join(__dirname, 'dids_ethr.json');

function loadDIDs() {
  if (!fs.existsSync(didStoragePath)) return {};
  return JSON.parse(fs.readFileSync(didStoragePath));
}

function saveDIDs(data) {
  fs.writeFileSync(didStoragePath, JSON.stringify(data, null, 2));
}

function createEthrDID(userId) {
  // Generate secp256k1 key pair using EthCrypto
  const identity = EthCrypto.createIdentity(); // { address, privateKey, publicKey }

  const did = `did:key:${identity.publicKey}`;

  const allDIDs = loadDIDs();
  allDIDs[userId] = {
    did,
    publicKey: identity.publicKey,
    privateKey: identity.privateKey,
  };

  saveDIDs(allDIDs);

  return allDIDs[userId];
}

function getEthrDID(userId) {
  const allDIDs = loadDIDs();
  return allDIDs[userId] || null;
}

module.exports = {
  createEthrDID,
  getEthrDID,
};

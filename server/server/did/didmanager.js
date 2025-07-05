const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const didStoragePath = path.join(__dirname, 'dids.json');

// Load stored DIDs
function loadDIDs() {
  if (!fs.existsSync(didStoragePath)) return {};
  return JSON.parse(fs.readFileSync(didStoragePath));
}

// Save DIDs to file
function saveDIDs(data) {
  fs.writeFileSync(didStoragePath, JSON.stringify(data, null, 2));
}

function generateKeyPairAsString() {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: {
      type: 'spki',
      format: 'der',
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem',
    },
  });

  return {
    publicKey: publicKey.toString('base64'),
    privateKey
  };
}

function createDID(userId) {
  const { publicKey, privateKey } = generateKeyPairAsString();

  const did = `did:key:z${publicKey}`;

  const allDIDs = loadDIDs(); // assumes this returns an object
  allDIDs[userId] = { did, publicKey, privateKey };

  saveDIDs(allDIDs); // assumes this saves the object

  return { did, publicKey, privateKey };
}


// Get DID by user ID
function getDID(userId) {
  const allDIDs = loadDIDs();
  return allDIDs[userId] || null;
}

module.exports = { createDID, getDID };


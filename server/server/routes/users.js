const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { createDID, getDID } = require('../did/didmanager'); // make sure path is correct
const fs = require('fs')
const crypto = require('crypto');


// Now you can access the object like this:

const router = express.Router();
const map = {};

// GET route to retrieve data using hash
router.get('/:hash', (req, res) => {
    const hash = req.params.hash;
    res.json(map[hash] || { error: "Hash not found" });
});

// POST route to store data and return hash
router.post('/', (req, res) => {
  if (!req.body || typeof req.body !== 'object') {
    return res.status(400).json({ error: 'Invalid JSON body' });
  }
    const hash = uuidv4();
    map[hash] = req.body;  // Make sure express.json() middleware is enabled
    res.json({ path: `http://localhost:9000/${hash}` });
});

router.get('/keys/:account', (req, res) => {
    const rawData = fs.readFileSync('/home/priyank/Codes/NS/server/did/dids.json', 'utf-8');
    const keyStore = JSON.parse(rawData);
    const account = req.params.account;
    res.json(keyStore[account] || { error: "account not found" });
});


router.post('/decrypt', (req, res) => {
  try {
    const {
      encryptedKey,
      iv,
      authTag,
      ciphertext,
      patientPrivateKey,
      doctorPublicKey
    } = req.body;
    
    console.log(req.body);

    // 1. Decrypt AES key using patient's private RSA key
    const privateKeyObject = crypto.createPrivateKey({
      key: patientPrivateKey,
      format: 'pem',
      type: 'pkcs8',
    });

    const aesKey = crypto.privateDecrypt(
      {
        key: privateKeyObject,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: 'sha256',
      },
      Buffer.from(encryptedKey, 'base64')
    );

    // 2. Decrypt the payload using AES-GCM
    const decipher = crypto.createDecipheriv(
      'aes-256-gcm',
      aesKey,
      Buffer.from(iv, 'base64')
    );
    decipher.setAuthTag(Buffer.from(authTag, 'base64'));

    let decrypted = decipher.update(ciphertext, 'base64', 'utf8');
    decrypted += decipher.final('utf8');

    const { message, signature } = JSON.parse(decrypted);

    // 3. Verify signature using doctor’s public key
    const publicKeyPem =
      '-----BEGIN PUBLIC KEY-----\n' +
      doctorPublicKey.match(/.{1,64}/g).join('\n') +
      '\n-----END PUBLIC KEY-----';

    const verifier = crypto.createVerify('sha256');
    verifier.update(message);
    verifier.end();

    const isVerified = verifier.verify(publicKeyPem, signature, 'base64');

    return res.status(200).json({
      decryptedMessage: message,
      signature,
      isVerified,
    });

  } catch (err) {
    console.error('Error during decryption:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/sign-encrypt', (req, res) => {
  try {
    const { ipfsHash, doctorPrivateKey, patientPublicKey } = req.body;

    // 1. Sign the message
    const signer = crypto.createSign('sha256');
    signer.update(ipfsHash);
    signer.end();

    const privateKeyObject = crypto.createPrivateKey({
      key: doctorPrivateKey,
      format: 'pem',
      type: 'pkcs8',
    });

    const signature = signer.sign(privateKeyObject, 'base64');

    const payload = {
      message: ipfsHash,
      signature,
    };

    // 2. AES Key + IV Generation
    const aesKey = crypto.randomBytes(32); // 256-bit AES key
    const iv = crypto.randomBytes(12); // GCM recommended IV size

    const cipher = crypto.createCipheriv('aes-256-gcm', aesKey, iv);
    let encryptedPayload = cipher.update(JSON.stringify(payload), 'utf8', 'base64');
    encryptedPayload += cipher.final('base64');
    const authTag = cipher.getAuthTag().toString('base64');

    // 3. Encrypt AES key with RSA
    const publicKeyPem =
      '-----BEGIN PUBLIC KEY-----\n' +
      patientPublicKey.match(/.{1,64}/g).join('\n') +
      '\n-----END PUBLIC KEY-----';

    const encryptedAesKey = crypto.publicEncrypt(
      {
        key: publicKeyPem,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: 'sha256',
      },
      aesKey
    ).toString('base64');

    // 4. Return encrypted AES key + encrypted data + IV + auth tag
    return res.status(201).json({
      encryptedKey: encryptedAesKey,
      iv: iv.toString('base64'),
      authTag,
      ciphertext: encryptedPayload,
    });

  } catch (err) {
    console.error("Error enc sign:", err);
    return res.status(500).json({ message: 'Internal server error' });
  }
});


router.post('/register', (req, res) => {
  try {
    console.log(req.body)
    const { userId } = req.body;



    if (!userId) {
      return res.status(400).json({ message: 'Missing userId in request body' });
    }

    const existing = getDID(userId);
    if (existing) {
      return res.status(200).json({ message: 'DID already exists', did: existing.did, publicKey: existing.publicKey });
    }

    const newDID = createDID(userId);
    return res.status(201).json({ message: 'DID created successfully', did: newDID.did, publicKey: newDID.publicKey , privateKey: newDID.privateKey});

  } catch (err) {
    console.error("Error during DID registration:", err);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;

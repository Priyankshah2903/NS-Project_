const express = require('express');
const router = express.Router();
const { createDID, getDID } = require('../did/didManager'); // make sure path is correct

router.post('/register', (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: 'Missing userId in request body' });
    }

    const existing = getDID(userId);
    if (existing) {
      return res.status(200).json({ message: 'DID already exists', did: existing.did, publicKey: existing.publicKey});
    }

    const newDID = createDID(userId);
    return res.status(201).json({ message: 'DID created successfully', did: newDID.did, publicKey: newDID.publicKey});

  } catch (err) {
    console.error("Error during DID registration:", err);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;


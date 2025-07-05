const EthCrypto = require('eth-crypto');
const { getDID } = require('../did/didmanager');

export default async function encrypt(req, res) {
  try {
   
    const { data, doctorId, patientId } = req.body;  // 'data' is the plaintext medical record

    const doctorDID = getDID(doctorId);
    const patientDID = getDID(patientId);

    if (!doctorDID || !patientDID) {
      return res.status(404).json({ message: 'DID not found' });
    }
     data = JSON.stringify(data)

    // Step 1: Doctor signs the original data for authenticity
    const messageHash = EthCrypto.hash.keccak256(data);
    const signature = await EthCrypto.sign(doctorDID.privateKey, messageHash);

    const payload = {
      message: data,       // raw medical record
      signature,           // for authenticity
    };

    // Step 2: Encrypt the payload using patient’s public key
    const encryptedPayloadObject = await EthCrypto.encryptWithPublicKey(
      patientDID.publicKey,
      JSON.stringify(payload)
    );

    const encryptedPayload = EthCrypto.cipher.stringify(encryptedPayloadObject);

    // Step 3: Return encrypted data — to be uploaded to IPFS by the client
    return res.status(201).json({
      encryptedPayload,
    });

  } catch (err) {
    console.error('Error in /encrypt:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

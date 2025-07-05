const EthCrypto = require('eth-crypto');
const { getDID } = require('../did/didmanager');

export default async function decrypt(req, res) {
  try {
    const { encryptedPayload, doctorId, patientId } = req.body;

    const doctorDID = getDID(doctorId);
    const patientDID = getDID(patientId);

    if (!doctorDID || !patientDID) {
      return res.status(404).json({ message: 'DID not found' });
    }

    // 1. Parse and decrypt the payload
    const encryptedPayloadObject = EthCrypto.cipher.parse(encryptedPayload);
    const decryptedString = await EthCrypto.decryptWithPrivateKey(
      patientDID.privateKey,
      encryptedPayloadObject
    );

    const { message, signature } = JSON.parse(decryptedString);

    // 2. Verify the signature
    const messageHash = EthCrypto.hash.keccak256(message);
    const recoveredPublicKey = EthCrypto.recoverPublicKey(signature, messageHash);
    const isVerified = recoveredPublicKey === doctorDID.publicKey;

    return res.status(200).json({
      decryptedMessage: message,
      signature,
      isVerified,
    });

  } catch (err) {
    console.error('Error in /decrypt:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

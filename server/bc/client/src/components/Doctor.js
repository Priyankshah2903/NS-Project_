import React, { useEffect, useState } from 'react';
import 'bootstrap/dist/css/bootstrap.css';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Table from 'react-bootstrap/Table'
import Modal from 'react-bootstrap/Modal';
import { Buffer } from 'buffer';
import { Link } from 'react-router-dom';
import { ipfs } from '../ipfs.js';
import crypto from 'crypto-browserify';
import axios from 'axios';
import jsonData from './keys.json';
import CryptoJS from 'crypto-js';

const ENCRYPTION_KEY = "your-secret-key"; // same key used during encryption

// import ECIES from 'eth-ecies';

// const nacl = require('tweetnacl');
// const naclUtil = require('tweetnacl-util');


let a=0;

const Doctor = ({mediChain, account}) => {
  const [doctor, setDoctor] = useState(null);
  const [patient, setPatient] = useState(null);
  const [patientRecord, setPatientRecord] = useState(null);
  const [disease, setDisease] = useState('');
  const [did, setDid] = useState(''); 
  const [publicKey, setPublicKey] = useState(''); 
  const [treatment, setTreatment] = useState('');
  const [charges, setCharges] = useState('');
  const [fileBuffer, setFileBuffer] = useState(null);
  const [patList, setPatList] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [transactionsList, setTransactionsList] = useState([]);

  const getDoctorData = async () => {
    var doctor = await mediChain.methods.doctorInfo(account).call();
    setDoctor(doctor);
  }
  const getPatientAccessList = async () => {
    var pat = await mediChain.methods.getDoctorPatientList(account).call();
    let pt = []
    for(let i=0; i<pat.length; i++){
      let patient = await mediChain.methods.patientInfo(pat[i]).call();
      patient = { ...patient, account:pat[i] }
      pt = [...pt, patient]
    }
    setPatList(pt);
  }

  const getTransactionsList = async () => {
    var transactionsIdList = await mediChain.methods.getDoctorTransactions(account).call();
    let tr = [];
    for(let i=transactionsIdList.length-1; i>=0; i--){
        let transaction = await mediChain.methods.transactions(transactionsIdList[i]).call();
        let sender = await mediChain.methods.patientInfo(transaction.sender).call();
        if(!sender.exists) sender = await mediChain.methods.insurerInfo(transaction.sender).call();
        transaction = {...transaction, id: transactionsIdList[i], senderEmail: sender.email}
        tr = [...tr, transaction];
    }
    console.log(tr);
    setTransactionsList(tr);
  }



  // const handleCloseModal = () => setShowModal(false);
  // const handleCloseRecordModal = () => setShowRecordModal(false);
  // const handleShowModal = async (patient) => {
  //   await setPatient(patient);
  //   await setShowModal(true);
  // }
  // const handleShowRecordModal = async (patient) => {
  //   var record = {}
  //   await fetch(`${patient.record}`)
  //     .then(res => res.json())
  //     .then(data => record = data)
  //   await setPatientRecord(record);
  //   await setShowRecordModal(true);
  // }
  // const submitDiagnosis = async (e) => {
  //   e.preventDefault()
  //   let file = "klsmlnsklncio";
  //   // if(fileBuffer) {
  //   //   await ipfs.add(fileBuffer).then((res, error) => {
  //   //     if(error){
  //   //       console.log(error)
  //   //     }else{
  //   //       file = res.path
  //   //     }
  //   //   })
  //   // }
  //   var record = {}
  //   await fetch(`${patient.record}`)
  //     .then(res => res.json())
  //     .then(data => {
  //       record = data;
  //     })
  //   const date = new Date();

  //   const formattedDate = date.toLocaleString("en-GB", {
  //     day: "numeric",
  //     month: "short",
  //     year: "numeric",
  //     hour: "numeric",
  //     minute: "2-digit"
  //   });
  //   record.treatments = [ {disease, treatment, charges, prescription: file, date: formattedDate, doctorEmail: doctor.email}, ...record.treatments ]

  //   ipfs.add(record).then((result) => {
  //       mediChain.methods.insuranceClaimRequest(patient.account, result.path, charges).send({from: account}).on('transactionHash', (hash) => {
  //         return window.location.href = '/login'
  //       })
      
  //   })
  // }


  const captureFile = async (e) => {
    e.preventDefault()
    const file = e.target.files[0];
    const reader = new window.FileReader()
    reader.readAsArrayBuffer(file)
    reader.onloadend = () => {
      setFileBuffer(Buffer(reader.result))
    }
  }


  const handleCloseModal = () => setShowModal(false);
  const handleCloseRecordModal = () => setShowRecordModal(false);
  const handleShowModal = async (patient) => {
    
    await setPatient(patient);
    await setShowModal(true);
  }
  const handleShowRecordModal = async (patient) => {
    var record = {}
    let patientPrivateKey = jsonData[`${patient.account.toLowerCase()}`]["privateKey"];
    let obj = await JSON.parse(patient.record);

    let doctorPublicKey = localStorage.getItem("didpr");
    
    const res = await axios.post(`http://localhost:9000/decrypt`, {
      encryptedKey: obj.encryptedKey,
      iv: obj.iv,
      authTag: obj.authTag,
      ciphertext: obj.ciphertext,
      patientPrivateKey,
      doctorPublicKey,
    });
    await fetch(`${res.data.decryptedMessage}`)
  .then(res => res.blob())
  .then(async blob => {
    const encryptedText = await blob.text();
    const bytes = CryptoJS.AES.decrypt(encryptedText, ENCRYPTION_KEY);
    const decryptedText = bytes.toString(CryptoJS.enc.Utf8);
    record = JSON.parse(decryptedText);
  });

setPatientRecord(record);
setShowRecordModal(true);

  }
  const submitDiagnosis = async (e) => {
    a++;
    
    e.preventDefault()
    let file = "klsmlnsklncio";
    // if(fileBuffer) {
    //   await ipfs.add(fileBuffer).then((res, error) => {
    //     if(error){
    //       console.log(error)
    //     }else{
    //       file = res.path
    //     }
    //   })
    // }
    var record = {}
    console.log("awai")
    let patientPrivateKey = jsonData[`${patient.account.toLowerCase()}`]["privateKey"];
     console.log(patient.record)
     try{
     let obj = await JSON.parse(patient.record);
    
    //let patientPrivateKey="-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQCuckWJ4vK0C8mL\nWdYgH3/P29eaftM2sLJfxcMgvUcvkEGdqdBkojFZXB+xEOr5fLk9y06FhnDi9GUV\nt0gAeREsprIROwBLBHGMsXqUQxMQyLVJaJ6XVQI2e8Kka0nFjislPHLoCa2YDiPL\nbGugYpNq1T4x8XR8MGFJC4ofH8/VgiYvSkTne8oTtL2xzBTXbl81QPNkHp3HNxjr\n0XY4LbZZA4j+d7n7HywomuIvBoXuzFMYxFQs/cVfqhysE3D86Kt9NJeepV6U+k6h\nd9g5isOdpIptwuddERgdlsdTfcl1OEYRCXgGJHQIeb0TfkJgJ7mmQKh9OT8ZHXk/\njV+1IX9RAgMBAAECggEAFZT1nXWCaVv7902J/DdpbKHaLrb6Eo4Rw1+IIIjKQcwr\nEgJsUcbvLAsFsLZTG8KeeFKqyEI1vR5XUzR1p/lScp+87/zIsH9APRPIAoe52B28\nr/RNipNtzqfJEOZlHhfUpqqv3J016NX2/7fOKO2JJ3JyW2Nv8d1aa9sNn4QkBln7\nbQBmqav99CBxWcCSEv4KTxoSvCIxpgJJKEdHoDFsWO2VhW0Hzzi6piwCjq5HJBSm\nAdICJ3jIg74saLhuLHGGqbEN/es0YjVCW2qN/L8LprsVI6IYQL3sz2L4fIdmsmED\namxE22OeMdfaoynDU8eeGQVjswGVbB4lOj1+BzB9QQKBgQDUsOOnMRrFgGXTaxtj\nCP/uyw3pLIXF909e13KPSgZrXh8Lh/bT0N2UQ4f+4quXAHKSujnSVMWMRNz+nEQc\nslLTVLjXcOPsowRjtIQu2YSqI4Ak65mdrPJZmXSu8tiHLjR7zoYeLHzTplw5n5G5\nneKCapFxSdNckibICEO4OCX7TQKBgQDR98acYk8Yhrq5dPrV0HLRf+j5GQEbP0yp\ntOC8gwWubSDod06YO6r9mNV8SGnnqGPKBB0Cnmj5LswaLnkazK2+Ci532BcAG9a0\neJr1TOuw+Z0jfyeF96kdUoGUCUDApHt2CfFgbahVkgru1anl6ncrV1v253RE23f5\n0swbyM5qFQKBgE2Ys5W93oyLyZqWiwlYsTcHse2OJsgQ8E4jwFHyqeDmF+F3G2Av\n5YdAFA+z1vJiYWqSsqG/98qzHQVvMZJepMUhNca0ExO0bdeKdmc5SKNiDFBr/EGA\nZXK2/9EMHF9FRjSdJmU/ydLV8PO8+ceEiK0YADQawRgW4js8eKhvI7xJAoGAJS4g\nAE80PF6XMAHz7Oq1ej2RLpLr7DxAQgjiht8YoXN3kVKXG0Ptmmx22UQlZL0ftoUV\n8gHFCuLrh3NVRJab6Xv6EIS2RfGoClsU7X0Ke1MoLUH16LYbPzL9+Q3OZo55wkQu\ndunUFhr/Tp2NMUZchdM5WLZRk2PdkeJu/DiJvKUCgYB6P420iQicuW5j0YzRWAla\nex3hQND85Ku97J6W5GLwjO84bQqCFnHKjZOz+BbgaiI5O63iHroEqx9sCUsbqMtw\nwzMZd5hHPdpMnswBehTfNrrMr73Vs314CDnGTQTdYhqsuWj9iE0JcKd70BcsCwAY\nl/y9LMTohqzBUPrvh4areg==\n-----END PRIVATE KEY-----\n"
    // ;
    console.log(a)
    let doctorPublicKey = localStorage.getItem("didpr");
    
    const res = await axios.post(`http://localhost:9000/decrypt`, {
      encryptedKey: obj.encryptedKey,
      iv: obj.iv,
      authTag: obj.authTag,
      ciphertext: obj.ciphertext,
      patientPrivateKey ,
      doctorPublicKey,
    });
    
    
    await fetch(`${res.data.decryptedMessage}`)
  .then(async blob => {
    const encryptedText = await blob.text();
    const bytes = CryptoJS.AES.decrypt(encryptedText, ENCRYPTION_KEY);
    const decryptedText = bytes.toString(CryptoJS.enc.Utf8);
    record = JSON.parse(decryptedText);
  });

setPatientRecord(record);

  
    }
    catch(e){
    await fetch(`${patient.record}`)
  .then(res => res.blob())
  .then(async blob => {
    const encryptedText = await blob.text();
    const bytes = CryptoJS.AES.decrypt(encryptedText, ENCRYPTION_KEY);
    const decryptedText = bytes.toString(CryptoJS.enc.Utf8);
    record = JSON.parse(decryptedText);
  });


}
      console.log("awai")
    const date = new Date();

    const formattedDate = date.toLocaleString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit"
    });
    
    console.log(record)
    
    record.treatments = [ {disease, treatment, charges, prescription: file, date: formattedDate, doctorEmail: doctor.email}, ...record.treatments ]

   

//     ipfs.add(record).then(async (result) => {
//       const ipfsHash = result.path;
//       console.log("PUBLIC PUBLIC PUBLIC KEY",publicKey);

// // 1. Sign the IPFS hash with doctor's private key
// const doctorPrivateKeyHex = publicKey;  // The private key of the doctor
// const doctorPrivateKey = Buffer.from(doctorPrivateKeyHex, 'hex'); // Uint8Array

// if (doctorPrivateKey.length !== 64) {
//   throw new Error("Signing key must be 64 bytes");
// }

// const hashBuffer = naclUtil.decodeUTF8(ipfsHash);
// const signature = nacl.sign(hashBuffer, doctorPrivateKey);



// // 2. Create the payload to be encrypted
// const signedPayload = {
//   data: ipfsHash,
//   signature: naclUtil.encodeBase64(signature),  // Convert signature to base64 for storage
// };

// // 3. Encrypt the payload using the patient’s public key
// const patientPublicKeyHex = patient.name.split(":").pop(); // still fine
// const patientPublicKey = naclUtil.decodeBase64(patientPublicKeyHex);
// console.log("Raw patient.name:", patient.name);
// console.log("Extracted public key string:", patientPublicKeyHex);
// console.log("Length of key string:", patientPublicKeyHex.length);


// console.log("Patient public key length:", patientPublicKey.length); // MUST BE 32


// // Convert payload to a buffer
// const payloadBuffer = naclUtil.decodeUTF8(JSON.stringify(signedPayload));

// // Encrypt the payload with patient's public key
// const nonce = nacl.randomBytes(nacl.box.nonceLength);  // Generate a random nonce
// const encrypted = nacl.box(payloadBuffer, nonce, patientPublicKeyHex, doctorPrivateKey);

// // Optional: store the encrypted payload to IPFS
// const encryptedRecord = {
//   nonce: naclUtil.encodeBase64(nonce),  // Store the nonce
//   ciphertext: naclUtil.encodeBase64(encrypted),  // Store the ciphertext
// };

// // Upload the encrypted data to IPFS
// const encryptedIpfsResult = await ipfs.add(JSON.stringify(encryptedRecord));
// console.log("Encrypted record stored at:", encryptedIpfsResult.path);

//       // const ipfsHash = result.path;

//       // // 2. Sign the IPFS hash with doctor's private key
//       // const hashBuffer = Buffer.from(ipfsHash);
//       // const signature =  eccrypto.sign(Buffer.from(publicKey, 'hex'), hashBuffer);

//       // // 3. Create the payload to be encrypted
//       // const signedPayload = {
//       //   data: ipfsHash,
//       //   signature: signature.toString('hex'),  // convert signature to string for storage
//       // };

//       // // 4. Encrypt the payload using patient’s public key (stored in name)
//       // const patientPublicKeyHex = patientRecord.name; // this contains '04abcdef...' etc.
//       // const patientPublicKey = Buffer.from(patientPublicKeyHex, 'hex');
//       // const payloadBuffer = Buffer.from(JSON.stringify(signedPayload));

//       // const encrypted = await eccrypto.encrypt(patientPublicKey, payloadBuffer);

//       // // Optional: store the encrypted payload to IPFS
//       // const encryptedRecord = {
//       //   iv: encrypted.iv.toString('hex'),
//       //   ephemPublicKey: encrypted.ephemPublicKey.toString('hex'),
//       //   ciphertext: encrypted.ciphertext.toString('hex'),
//       //   mac: encrypted.mac.toString('hex'),
//       // };

//       // const encryptedIpfsResult = await ipfs.add(JSON.stringify(encryptedRecord));
//       // console.log("Encrypted record stored at:", encryptedIpfsResult.path);


//         mediChain.methods.insuranceClaimRequest(patient.account, result.path, charges).send({from: account}).on('transactionHash', (hash) => {
//           return window.location.href = '/login'
//         })
      
//     })

ipfs.add(record).then(async (result) => {


  const ipfsHash = result.path;
  // const patientPublicKeyHex = patient.name.split(":").pop();
  // const encryptedBuffer = ECIES.encrypt(Buffer.from(patientPublicKeyHex,'hex'),Buffer.from(ipfsHash));
  // console.log("ENCRYPTED DATA----",encryptedBuffer);

  // console.log("PUBLIC PUBLIC PUBLIC KEY", publicKey);

  // // 1. Sign the IPFS hash with doctor's private key
  // const doctorPrivateKeyHex = publicKey;  // Use the private key generated above
  // const doctorPrivateKey = Buffer.from(doctorPrivateKeyHex, 'hex'); // Convert to Uint8Array

  // if (doctorPrivateKey.length !== 64) {
  //   throw new Error("Signing key must be 64 bytes");
  // }

  // const hashBuffer = naclUtil.decodeUTF8(ipfsHash);  // Convert IPFS hash to buffer
  // const signature = nacl.sign(hashBuffer, doctorPrivateKey);  // Sign the hash

  // // 2. Create the payload to be encrypted
  // const signedPayload = {
  //   data: ipfsHash,
  //   signature: naclUtil.encodeBase64(signature),  // Store signature as Base64
  // };

  // // 3. Encrypt the payload using the patient’s public key
  // const patientPublicKeyHex = patient.name.split(":").pop(); // Extract the public key (Base58 or Base64)
  // const patientPublicKeyBase58 = patientPublicKeyHex;  // Assuming it's Base58

  // // Decode Base58 to Buffer, then to Uint8Array for NaCl
  // const patientPublicKey = new Uint8Array(bs58.decode(patientPublicKeyBase58));  // Decode Base58

  // console.log("Raw patient.name:", patient.name);
  // console.log("Extracted public key string:", patientPublicKeyBase58);
  // console.log("Length of key string:", patientPublicKeyBase58.length);
  // console.log("Patient public key length:", patientPublicKey.length); // Should be 32 bytes

  // // Convert payload to a buffer
  // const payloadBuffer = naclUtil.decodeUTF8(JSON.stringify(signedPayload));

  // // Encrypt the payload with patient's public key
  // const nonce = nacl.randomBytes(nacl.box.nonceLength);  // Generate a random nonce
  // const encrypted = nacl.box(payloadBuffer, nonce, patientPublicKey, doctorPrivateKey);  // Encrypt the payload

  // // Optional: store the encrypted payload to IPFS
  // const encryptedRecord = {
  //   nonce: naclUtil.encodeBase64(nonce),  // Store the nonce as Base64
  //   ciphertext: naclUtil.encodeBase64(encrypted),  // Store the ciphertext as Base64
  // };

  // // Upload the encrypted data to IPFS
  // const encryptedIpfsResult = await ipfs.add(JSON.stringify(encryptedRecord));
  // console.log("Encrypted record stored at:", encryptedIpfsResult.path);

  // Send insurance claim request (assuming this part is correct)

// try{
//   const publicKeyBase64 = patient.name.split(":").pop();
//   const publicKeyUint8 = naclUtil.decodeBase64(publicKeyBase64);
  
//   // Assuming privateKeyUint8 is available and properly initialized as a Uint8Array
//   const privateKeyUint8 = new Uint8Array(publicKey.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
  
//   // Optional: Confirm that publicKeyUint8 matches derived public key from private key
//   const keyPair = {
//     publicKey: publicKeyUint8,
//     secretKey: privateKeyUint8,
//   };
  
//   // Now you can use:
//   const signingKey = keyPair.secretKey;              // 64 bytes for nacl.sign
//   const encryptionKey = keyPair.secretKey.slice(0, 32); // 32 bytes for nacl.box
  
//   // Convert ipfsHash to a Uint8Array (Make sure ipfsHash is a valid UTF-8 string)
//   const message = naclUtil.decodeUTF8(ipfsHash);
  
//   // Step 1: Sign the message with the doctor's private key (full 64-byte key)
//   const signedMessage = nacl.sign(message, privateKeyUint8); // Signing needs full 64-byte key
  
//   // Step 2: Encrypt the signed payload with patient's public key
//   const nonce = nacl.randomBytes(nacl.box.nonceLength);
//   const encrypted = nacl.box(signedMessage, nonce, publicKeyUint8, privateKeyUint8.slice(0, 32)); // Box requires 32-byte key
  
//   // Step 3: Store nonce and ciphertext
//   const encryptedRecord = {
//     nonce: naclUtil.encodeBase64(nonce),
//     ciphertext: naclUtil.encodeBase64(encrypted),
//   };
// }
// catch(e){}
// function signMessage(message, doctorPrivateKeyPem) {
//   const signer = crypto.createSign('sha256');
//   signer.update(message);
//   signer.end();

//   // Convert PEM string into a KeyObject
//   const keyObject = crypto.createPrivateKey({
//     key: doctorPrivateKeyPem,
//     format: 'pem',
//     type: 'pkcs8',
//   });

//   // Use KeyObject in sign()
//   const signature = signer.sign(keyObject, 'base64');
//   return signature;
// }


// function encryptWithPatientPublicKey(jsonObject, patientPublicKeyBase64) {
//   const publicKeyDer = Buffer.from(patientPublicKeyBase64, 'base64');

//   // Convert DER to PEM
//   const publicKeyPem =
//     '-----BEGIN PUBLIC KEY-----\n' +
//     publicKeyDer.toString('base64').match(/.{1,64}/g).join('\n') +
//     '\n-----END PUBLIC KEY-----';

//   const bufferToEncrypt = Buffer.from(JSON.stringify(jsonObject), 'utf8');

//   const encrypted = crypto.publicEncrypt(
//     {
//       key: publicKeyPem,
//       padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
//       oaepHash: 'sha256',
//     },
//     bufferToEncrypt
//   );

//   return encrypted.toString('base64');
// }

// console.log("patient.name:", patient.name);
const didKey = patient.name.split(":").pop(); 

let patientPublicKey = didKey.slice(1);


let doctorPrivateKey = localStorage.getItem("didpu");
console.log(patientPublicKey);
console.log(doctorPrivateKey);
// let patientPublicKey = didKey.slice(1);


// let doctorPrivateKey = localStorage.getItem("didpu");

const res = await axios.post(`http://localhost:9000/sign-encrypt`, {ipfsHash, patientPublicKey, doctorPrivateKey});
        console.log("bsbiud", res.data);

// const encryptedIpfs = await ipfs.add(JSON.stringify(encryptedRecord));

      // console.log("Encrypted record stored at:", encryptedIpfs.path);

  mediChain.methods.insuranceClaimRequest(patient.account, JSON.stringify(res.data), charges).send({ from: account })
    .on('transactionHash', (hash) => {
      
      return window.location.href = '/login';
    });
});
  }

  

   

  useEffect(() => {
    if(account === "") return window.location.href = '/login'
    if(!doctor) getDoctorData()
    if(patList.length === 0) getPatientAccessList();
    if(transactionsList.length === 0) getTransactionsList();
    fetch(`http://localhost:9000/keys/${account}`)
  .then(async res => {
   res = await res.json()
   localStorage.setItem('didpr', res.publicKey);
    localStorage.setItem('didpu', res.privateKey);
    setDid(localStorage.getItem('didpr'));
    setPublicKey(localStorage.getItem('didpu'));
    });

  }, [doctor, patList])


  return (
    <div>
      { doctor ?
        <>
          <div className='box'>
            <h2>Hospital's Profile</h2>
            <Form>
              <Form.Group>
                <Form.Label>Name: {doctor.name}</Form.Label>
              </Form.Group>
              <Form.Group>
                <Form.Label>Email: {doctor.email}</Form.Label>
              </Form.Group>
              <Form.Group>
                <Form.Label>Address: {account}</Form.Label>
              </Form.Group>
              <Form.Group>
            <Form.Label>
                  DID Key: did:key:{did.length > 50 ? `${did.slice(0, 48)}` : did}
            </Form.Label>
          </Form.Group>

              {/* <Form.Group>
                <Form.Label>Private: {publicKey}</Form.Label>
              </Form.Group> */}
            </Form>
          </div>
          <div className='box'>
            <h2>List of Patient's Medical Records</h2>
            <Table id='records' striped bordered hover size="sm">
              <thead>
                <tr>
                  <th>Sr.&nbsp;No.</th>
                  <th>Patient&nbsp;DID</th>
                  {/* <th>Patient&nbsp;Name</th> */}
                  <th>Action</th>
                  <th>Records</th>
                </tr>
              </thead>
              <tbody>
                { patList.length > 0 ?
                  patList.map((pat, idx) => {
                    return (
                      <tr key={idx+1}>
                        <td>{idx+1}</td>
                        <td>{pat.name.length > 50 ? `${pat.name.slice(0, 48)}` : pat.name}</td>
                        {/* <td>{pat.email.split('@')[0]}</td> */}
                        <td><Button variant='coolColor' onClick={(e) => handleShowModal(pat)} >Diagnose</Button></td>
                        <td><Button variant="coolColor" onClick={(e) => handleShowRecordModal(pat)} >View</Button></td>
                      </tr>
                    )
                  })
                  : <></>
                }
              </tbody>
            </Table>
          </div>
          <div className='box'>
            <h2>List of Transactions</h2>
              <Table striped bordered hover size="sm">
                <thead>
                    <tr>
                      <th>Sr.&nbsp;No.</th>
                      <th>Sender&nbsp;Email</th>
                      <th>Amount</th>
                      <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                  { transactionsList.length > 0 ? 
                    transactionsList.map((transaction, idx) => {
                      return (
                        <tr key={idx+1}>
                          <td>{idx+1}</td>
                          <td>{transaction.senderEmail.substring(0,3)}xxxxxxx.com</td>
                          <td>{transaction.value}</td>
                          <td>{transaction.settled ? <span className='badge rounded-pill bg-success'>Settled</span> : <span className='badge rounded-pill bg-warning'>Pending</span>}</td>
                        </tr>
                      )
                    })
                    : <></>
                  }
                </tbody>
              </Table>
          </div>
          { patient ? <Modal id="modal" size="lg" centered show={showModal} onHide={handleCloseModal}>
            <Modal.Header closeButton>
              <Modal.Title id="modalTitle">Enter diagnosis for: {patient.email.split('@')[0]}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Form>
                  <Form.Group className='mb-3'>
                    <Form.Label>Disease: </Form.Label>
                    <Form.Control required type="text" value={disease} onChange={(e) => setDisease(e.target.value)} placeholder='Enter disease'></Form.Control>
                  </Form.Group>
                  <Form.Group className='mb-3'>
                    <Form.Label>Treatment: </Form.Label>
                    <Form.Control required as="textarea" value={treatment} onChange={(e) => setTreatment(e.target.value)} placeholder='Enter the treatment in details'></Form.Control>
                  </Form.Group>
                  <Form.Group className='mb-3'>
                    <Form.Label>Medical Charges: </Form.Label>
                    <Form.Control required type="number" value={charges} onChange={(e) => setCharges(e.target.value)} placeholder='Enter medical charges incurred'></Form.Control>
                  </Form.Group>
                  {/* <Form.Group className='mb-3'>
                    <Form.Label>Upload Prescription</Form.Label>
                    <Form.Control onChange={captureFile} accept=".jpg, .jpeg, .png, .pdf" type="file" />
                  </Form.Group> */}
                </Form>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={handleCloseModal}>
                Close
              </Button>
              <Button type="submit" variant="coolColor" onClick={submitDiagnosis}>
                Submit Diagnosis
              </Button>
            </Modal.Footer>
          </Modal> : <></>
          }
          { patientRecord ? <Modal id="modal" size="lg" centered show={showRecordModal} onHide={handleCloseRecordModal}>
            <Modal.Header closeButton>
              <Modal.Title id="modalTitle">Medical Record:</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Form>
                  <Form.Group>
                    <Form.Label>Patient DID: {patientRecord.name.slice(0,48)}</Form.Label>
                  </Form.Group>
                  <Form.Group>
                    <Form.Label>Patient Name: {patientRecord.email.split('@')[0]}</Form.Label>
                  </Form.Group>
                  <Form.Group>
                    <Form.Label>Patient Age: {patientRecord.age}</Form.Label>
                  </Form.Group>
                  {/* <Form.Group>
                    <Form.Label>Address: {patientRecord.address}</Form.Label>
                  </Form.Group> */}
                  <Table id='records' striped bordered hover size="sm">
                    <thead>
                      <tr>
                        <th>Sr.&nbsp;No.</th>
                        <th>Hospital&nbsp;Email</th>
                        <th>Date</th>
                        <th>Disease</th>
                        <th>Treatment</th>
                        {/* <th>Prescription</th> */}
                      </tr>
                    </thead>
                    <tbody>
                      { patientRecord.treatments.length > 0 ?
                          patientRecord.treatments.map((treatment, idx) => {
                            return (
                              <tr key={idx+1}>
                                <td>{idx+1}</td>
                                <td>{treatment.doctorEmail}</td>
                                <td>{treatment.date}</td>
                                <td>{treatment.disease}</td>
                                <td>{treatment.treatment}</td>
                                {/* <td>
                                  { treatment.prescription ? 
                                    <Link to={${process.env.REACT_APP_INFURA_DEDICATED_GATEWAY}/ipfs/${treatment.prescription}} target="_blank"><Button variant="coolColor">View</Button></Link>
                                    : "No document uploaded"
                                  }
                                </td> */}
                              </tr>
                            )
                          })
                        : <></>
                      }
                    </tbody>
                  </Table>
                </Form>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={handleCloseRecordModal}>
                Close
              </Button>
            </Modal.Footer>
          </Modal> : <></>
          }
        </>
        : <div>Loading...</div>
      }
    </div>
  )
}


export default Doctor
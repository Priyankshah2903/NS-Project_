import React, { useEffect, useState } from 'react';
import 'bootstrap/dist/css/bootstrap.css';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Table from 'react-bootstrap/Table'
import Modal from 'react-bootstrap/Modal'
import { Link } from 'react-router-dom'
import Web3 from 'web3'
import axios from 'axios';
import CryptoJS from 'crypto-js';

const ENCRYPTION_KEY = "your-secret-key"; // same key used during encryption


const Patient = ({mediChain, account, ethValue}) => {
  const [patient, setPatient] = useState(null);
  const [docEmail, setDocEmail] = useState("");
  const [did, setDid] = useState(''); 
  const [publicKey, setPublicKey] = useState(''); 
  const [docList, setDocList] = useState([]);
  const [insurer, setInsurer] = useState(null);
  const [insurerList, setInsurerList] = useState([]);
  const [buyFromInsurer, setBuyFromInsurer] = useState(null);
  const [policyList, setPolicyList] = useState([]);
  const [buyPolicyIndex, setBuyPolicyIndex] = useState(null);
  const [transactionsList, setTransactionsList] = useState([]);
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [patientRecord, setPatientRecord] = useState(null);

  const getPatientData = async () => {
      var patient = await mediChain.methods.patientInfo(account).call();
      setPatient(patient);
  }
  const giveAccess = (e) => {
    e.preventDefault();
    mediChain.methods.permitAccess(docEmail).send({from: account}).on('transactionHash', (hash) => {
      return window.location.href = '/login'
    })
  }
  const revokeAccess = async (email) => {
    var addr = await mediChain.methods.emailToAddress(email).call();
    mediChain.methods.revokeAccess(addr).send({from: account}).on('transactionHash', (hash) => {
      return window.location.href = '/login';
    });
  }
  const getDoctorAccessList = async () => {
    var doc = await mediChain.methods.getPatientDoctorList(account).call();
    console.log("ll",doc)
    let dt = [];
    for(let i=0; i<doc.length; i++){
      let doctor = await mediChain.methods.doctorInfo(doc[i]).call();
      dt = [...dt, doctor]
    }
    setDocList(dt)
    console.log("dt",dt)
  }
  const getInsurer = async () => {
    var insurer = await mediChain.methods.insurerInfo(patient.policy.insurer).call();
    setInsurer(insurer)
  }
  const getInsurerList = async () => {
    var ins = await mediChain.methods.getAllInsurersAddress().call();
    let it = [];
    for(let i=0; i<ins.length; i++){
      let insurer = await mediChain.methods.insurerInfo(ins[i]).call();
      insurer = {...insurer, account: ins[i]};
      it = [...it, insurer]
    }
    setInsurerList(it)
  }
  const getPolicyList = async () => {
    var policyList = await mediChain.methods.getInsurerPolicyList(buyFromInsurer).call()
    setPolicyList(policyList);
  }
  const purchasePolicy = async (e) => {
    e.preventDefault();
    var value = policyList[buyPolicyIndex].premium/ethValue;
    mediChain.methods.buyPolicy(parseInt(policyList[buyPolicyIndex].id)).send({from: account, value: Web3.utils.toWei(value.toFixed(18), 'Ether')}).on('transactionHash', (hash) => {
      return window.location.href = '/login'
    })
  }
  const getTransactionsList = async () => {
    try {
      const transactionsIdList = await mediChain.methods.getPatientTransactions(account).call();
      console.log("Transaction IDs:", transactionsIdList);
  
      let tr = [];
      for (let i = transactionsIdList.length - 1; i >= 0; i--) {
        const txnId = transactionsIdList[i];
        const transaction = await mediChain.methods.transactions(txnId).call();
        const doctor = await mediChain.methods.doctorInfo(transaction.receiver).call();
        tr.push({ ...transaction, id: txnId, doctorEmail: doctor.email });
      }
  
      console.log("Full Transaction List:", tr);
      setTransactionsList(tr);
    } catch (error) {
      console.error("Error in getTransactionsList:", error);
      setTransactionsList([]);
    }
  };
  
  const settlePayment = async (e, transaction) => {
    let value = transaction.value/ethValue;
      mediChain.methods.settleTransactionsByPatient(transaction.id).send({from: account, value: Web3.utils.toWei(value.toFixed(18), 'Ether')}).on('transactionHash', (hash) => {
        return window.location.href = '/login'
    })
  }

  const handleCloseRecordModal = () => setShowRecordModal(false);
  const handleShowRecordModal = async () => {
    var record = {}
    let obj = await JSON.parse(patient.record);

    // const didKey = doctor.name.split(":").pop(); 

let patientPrivateKey = localStorage.getItem("didpu");
// let doctorPublicKey = didKey.slice(1);
let doctorPublicKey = "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA1FL70C2sW7y9yiAEuneM+B+y5Md7ERHWtFUl5zUdDy1aM6p3tkIjQ6tbW3No2J5A6PVrmM7bMFBP/9cpc+beoRdUoRkLhjyaecT2kozv/HZxs+yX1zbcTzPeWfXBLo1GZTWB/hxRGSnIqnHsGuSEXRduLyFtmcXgN85OLyq4Y3+HhVTdQUXbQD/lq5zyd/73bO979YTjtnnpO2UDCtNV7wtWTfr1HUwbBJ9F/TGNPnmXeHYYnRbl+A5V5oomBKq6vcb4fQa+sZqBG+WC4V4TgE9l6F4eGlvmFxNagQQGtOrcoA16QM8ZpVuZJS+mq9qYszOgJ+H2REdDHb5o0NoSqwIDAQAB"      
const res = await axios.post(`http://localhost:9000/decrypt`, {
  encryptedKey: obj.encryptedKey,
  iv: obj.iv,
  authTag: obj.authTag,
  ciphertext: obj.ciphertext,
  patientPrivateKey,
  doctorPublicKey,
});

console.log("Decrypted message:", res.data.decryptedMessage);
console.log("Is signature verified?", res.data.isVerified);

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

 
  


  

  useEffect(() => {
  //   console.log("Effect Triggered with dependencies:");
  // console.log({ account, patient, docList, insurerList, buyFromInsurer, transactionsList });

    if(account === "") return window.location.href = '/login'
    if(!patient) getPatientData()
    if(docList.length === 0) getDoctorAccessList();
    if(patient?.policyActive) getInsurer();
    if(insurerList.length === 0) getInsurerList();
    if(buyFromInsurer) getPolicyList();
  if(transactionsList.length === 0) getTransactionsList();

  fetch(`http://localhost:9000/keys/${account}`)
  .then(async res => {
   res = await res.json()
  
   localStorage.setItem('didpr', res.publicKey);
localStorage.setItem('didpu', res.privateKey);
setDid(localStorage.getItem('didpr'));
setPublicKey(localStorage.getItem('didpu'));
});
  
  // getTransactionsList();

  }, [patient, docList])

  return (
    <div>
      { patient ?
        <>
          <div className='box'>
            <h2>Patient's Profile</h2>
            <Form>
              {/* <Form.Group>
                <Form.Label>Name: {patient.name}</Form.Label>
              </Form.Group> */}
              <Form.Group>
                <Form.Label>Email address: {patient.email}</Form.Label>
              </Form.Group>
              <Form.Group>
                <Form.Label>Age: {patient.age}</Form.Label>
              </Form.Group>
              <Form.Group>
                <Form.Label>Address: {account}</Form.Label>
              </Form.Group>
              <Form.Label>
                                DID Key: did:key:{did.length > 50 ? `${did.slice(0, 48)}` : did}
                          </Form.Label>
                            {/* <Form.Group>
                              <Form.Label>Private: {publicKey}</Form.Label>
                            </Form.Group> */}
            </Form>
            <div>
              <span>Your records are stored here: &nbsp; &nbsp;</span>
              <Button variant="coolColor" style={{width: "20%", height: "4vh"}} onClick={handleShowRecordModal}>View Records</Button>
            </div>
          </div>
          <div className='box'>
            <h2>Share Your Medical Record with Doctor</h2>
            <Form onSubmit={giveAccess}>
              <Form.Group className="mb-3">
                <Form.Label>Email:</Form.Label>
                <Form.Control required type="email" value={docEmail} onChange={(e) => setDocEmail(e.target.value)} placeholder="Enter doctor's email"></Form.Control>
              </Form.Group>
              <Button variant="coolColor" type="submit">
                  Submit
              </Button>
            </Form>
            <br />
            <h4>List of Doctor's you have given access to your medical records</h4>
            <Table striped bordered hover size="sm">
              <thead>
                <tr>
                  <th>Sr.&nbsp;No.</th>
                  <th>Hospital&nbsp;Name</th>
                  <th>Hospital&nbsp;Email</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                { docList.length > 0 ? 
                  docList.map((doc, idx) => {
                    return (
                      <tr key={idx}>
                        <td>{idx+1}</td>
                        <td>{doc.name}</td>
                        <td>{doc.email}</td>
                        <td><Button className='btn-danger' onClick={() => revokeAccess(doc.email)}>Revoke</Button></td>
                      </tr>
                    )
                  })
                  : <></>
                }
              </tbody>
            </Table>
          </div>
          <div className='box'>
            { patient.policyActive && insurer
              ?
              <>
                <h2>Insurance Policy Details</h2>
                <Form>
                  <Form.Group>
                    <Form.Label>Insurance Provider Name: {insurer.name}</Form.Label>
                  </Form.Group>
                  <Form.Group>
                    <Form.Label>Email address: {insurer.email}</Form.Label>
                  </Form.Group>
                  <Form.Group>
                    <Form.Label>Insurance Policy Name: {patient.policy.name}</Form.Label>
                  </Form.Group>
                  <Form.Group>
                    <Form.Label>Insurance Duration: {patient.policy.timePeriod} Year{patient.policy.timePeriod >1 ? 's': ''}</Form.Label>
                  </Form.Group>
                  <Form.Group>
                    <Form.Label>Remaining Cover Value: INR {patient.policy.coverValue}</Form.Label>
                  </Form.Group>
                  <Form.Group>
                    <Form.Label>Premium: INR {patient.policy.premium}/year</Form.Label>
                  </Form.Group>
                </Form>
              </>
              :
              <>
                <h2>Buy Insurance Policy</h2>
                <Form onSubmit={purchasePolicy}>
                  <Form.Group className='mb-3'>
                    <Form.Label>Select Insurance Provider:</Form.Label>
                    <Form.Select onChange={(e) => {
                      setBuyFromInsurer(e.target.value)
                      getPolicyList()
                    }}>
                      <option>Choose</option>
                      {
                        insurerList.length > 0
                        ? insurerList.map((ins, idx) => {
                          return <option key={idx} value={ins.account}>{ins.name}</option>
                        })
                        : <></>
                      }
                    </Form.Select>
                  </Form.Group>
                  <Form.Group className='mb-3'>
                    <Form.Label>Select Insurance Policy:</Form.Label>
                    <Form.Select onChange={(e) => setBuyPolicyIndex(e.target.value)}>
                      <option>Choose</option>
                      {
                        policyList.length > 0
                        ? policyList.map((pol, idx) => {
                          return <option key={idx} value={idx}>{pol.name}</option>
                        })
                        : <></>
                      }
                    </Form.Select>
                  </Form.Group>
                  { policyList[buyPolicyIndex]
                    ? <div>
                        <p>Policy Name: {policyList[buyPolicyIndex].name}</p>
                        <p>Duration: {policyList[buyPolicyIndex].timePeriod} Year{policyList[buyPolicyIndex].timePeriod >1 ? 's': ''}</p>
                        <p>Cover Value: INR {policyList[buyPolicyIndex].coverValue}</p>
                        <p>Premium: INR {policyList[buyPolicyIndex].premium}/year</p>
                    </div>
                    : <></>
                  }
                  <Button variant="coolColor" type="submit">Buy Policy</Button>
                </Form>
              </>
            }
          </div>
          <div className='box'>
            <h2>List of Transactions</h2>
              <Table striped bordered hover size="sm">
                <thead>
                    <tr>
                      <th>Sr.No.</th>
                      <th>Doctor&nbsp;Email</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                  { transactionsList.length > 0 ? 
                    transactionsList.map((transaction, idx) => {
                      return (
                        <tr key={idx+1}>
                          <td>{idx+1}</td>
                          <td>{transaction.doctorEmail}</td>
                          <td>{transaction.value}</td>
                          <td>{transaction.settled ? <span className='badge rounded-pill bg-success'>Settled</span> : <span className='badge rounded-pill bg-warning'>Pending</span>}</td>
                          <td>
                            { !transaction.settled ?
                              <Button className='btn-coolColor' onClick={(e) => settlePayment(e, transaction)}>Pay</Button>
                              : <Button className='btn-coolColor' disabled>Pay</Button>
                            }
                          </td>
                        </tr>
                      )
                    })
                    : <></>
                  }
                </tbody>
              </Table>
          </div>
          { patientRecord ? <Modal id="modal" size="lg" centered show={showRecordModal} onHide={handleCloseRecordModal}>
            <Modal.Header closeButton>
              <Modal.Title id="modalTitle">Medical Record:</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Form>
                  <Form.Group>
                    <Form.Label>Patient Name: {patientRecord.email.split('@')[0]}</Form.Label>
                  </Form.Group>
                  <Form.Group>
                    <Form.Label>Patient Email: {patientRecord.email}</Form.Label>
                  </Form.Group>
                  <Form.Group>
                    <Form.Label>Patient Age: {patientRecord.age}</Form.Label>
                  </Form.Group>
                  {/* <Form.Group>
                    <Form.Label>Address: {patientRecord.address}</Form.Label>
                  </Form.Group> */}
                  <Form.Group>
                    <Form.Label>DID Key: did:key:{did.slice(0,48)}</Form.Label>
                  </Form.Group>
                  {/* <Form.Group>
                  <Form.Label>Private: {publicKey}</Form.Label>
                  </Form.Group> */}
                  <Table id='records' striped bordered hover size="sm">
                    <thead>
                      <tr>
                        <th>Sr.&nbsp;No.</th>
                        <th>Doctor&nbsp;Email</th>
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


export default Patient
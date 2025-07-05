import { useEffect, useState } from 'react';
import { Button, Form } from 'react-bootstrap';
import { Buffer } from 'buffer';
import { ipfs } from '../ipfs';

const Register = ({ mediChain, connectWallet, token, account, setToken, setAccount }) => {
    const [designation, setDesignation] = useState("1");
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [age, setAge] = useState('');
    const [did, setDid] = useState(''); 
    //const [did, setP] = useState('');// 👈 NEW: state to store DID

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (account !== "") {
            try {
                // 1. Call backend to register DID
                const response = await fetch('http://localhost:9000/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId: account })
                });

                const didData = await response.json();
                console.log("DID created:", didData.did);

                localStorage.setItem('did'+'pr', didData.did); // optional
                localStorage.setItem('did'+'pu', didData.privateKey); // optional

                setDid(didData.did); // 👈 NEW: set DID in state to show on UI

                // 2. If Patient, add full IPFS record
                if (designation === "1") {
                    const record = {
                        name: didData.did,
                        email: email,
                        address: account,
                        age: age,
                        treatments: [],
                        did: didData.did
                    };

                    ipfs.add(record).then((result) => {
                        console.log("IPFS Upload Result:", result);

                        mediChain.methods.register(didData.did, age, parseInt(designation), email, result.path)
                            .send({ from: account })
                            .on('transactionHash', async (hash) => {
                                window.location.href = '/login';
                            });
                    });

                } else {
                    // 3. For Doctor or Insurance, skip IPFS
                    mediChain.methods.register(name, 0, parseInt(designation), email, "")
                        .send({ from: account })
                        .on('transactionHash', async (hash) => {
                            window.location.href = '/login';
                        });
                }

            } catch (error) {
                console.error("Error during registration:", error);
                alert("Registration failed. Please check backend service.");
            }
        }
    };

    useEffect(() => {
        const t = localStorage.getItem('token');
        const a = localStorage.getItem('account');
        const storedDid = localStorage.getItem('did'); // 👈 NEW: fetch DID if already stored

        if (storedDid) setDid(storedDid); // 👈 NEW: set DID in state if available

        if (t && a) {
            window.location.href = '/login';
        } else {
            localStorage.removeItem('token');
            localStorage.removeItem('account');
            localStorage.removeItem('did');
            setToken('');
            setAccount('');
            setDid('');
        }
    }, [token]);

    return (
        <div className='register'>
            <div className='box'>
                <h2>Register</h2>
                <br />
                <Form onSubmit={handleSubmit}>
                    <Form.Group className="mb-3" controlId="formWallet">
                        <Form.Label>Connect Wallet</Form.Label>
                        {account === "" ?
                            <Form.Control type="button" value="Connect to Metamask" onClick={connectWallet} />
                            : <Form.Control type="button" disabled value={`Connected Wallet with Address: ${account}`} />
                        }
                    </Form.Group>
                    <Form.Group className="mb-3" controlId="formDesignation">
                        <Form.Label>Designation</Form.Label>
                        <Form.Select onChange={(e) => setDesignation(e.target.value)} value={designation}>
                            <option value="1">Patient</option>
                            <option value="2">Hospital</option>
                            <option value="3">Insurance Provider</option>
                        </Form.Select>
                    </Form.Group>
                    <Form.Group className="mb-3" controlId="formName">
                        <Form.Label>Name</Form.Label>
                        <Form.Control required type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter your name" />
                    </Form.Group>
                    <Form.Group className="mb-3" controlId="formEmail">
                        <Form.Label>Email</Form.Label>
                        <Form.Control required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter your email" />
                    </Form.Group>
                    {designation === "1" &&
                        <Form.Group className="mb-3" controlId="formAge">
                            <Form.Label>Age</Form.Label>
                            <Form.Control type="number" value={age} min={18} onChange={(e) => setAge(e.target.value)} placeholder="Enter your age" />
                        </Form.Group> }
                        {designation==="1" &&
                        <Form.Group className="mb-3" controlId="formAadhar">
                        <Form.Label>Gov ID</Form.Label>
                        <Form.Control type="number" placeholder="Enter your Gov ID" />
                    </Form.Group>
                        
                    }
                    <Button variant="coolColor" type="submit">Submit</Button>
                </Form>

                {/* 👇 NEW: Display DID if available
                {did && (
                    <div style={{ marginTop: '20px', padding: '10px', background: '#f0f0f0', borderRadius: '8px' }}>
                        <strong>Your DID:</strong>
                        <p style={{ wordWrap: 'break-word' }}>{did}</p>6
                    </div>
                )} */}
            </div>
        </div>
    );
};

export default Register;

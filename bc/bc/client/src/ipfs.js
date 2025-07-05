// ipfs.js
import axios from 'axios';
import CryptoJS from 'crypto-js';

const ENCRYPTION_KEY = "your-secret-key"; // replace with a secure key or derive dynamically

export const ipfs = {
  add: async (data) => {
    try {
      // 1. Encrypt JSON using AES
      const jsonString = JSON.stringify(data);
      const encrypted = CryptoJS.AES.encrypt(jsonString, ENCRYPTION_KEY).toString();

      // 2. Convert encrypted string to Blob and File
      const blob = new Blob([encrypted], { type: "text/plain" });
      const file = new File([blob], "encrypted_data.txt", { type: "text/plain" });

      // 3. Append to FormData
      const formData = new FormData();
      formData.append("file", file);

      // 4. Upload to Pinata
      const res = await axios({
        method: "post",
        url: "https://api.pinata.cloud/pinning/pinFileToIPFS",
        data: formData,
        headers: {
          pinata_api_key: `669fab78cd4a4ab8e8aa`,
          pinata_secret_api_key: `0dade38b8f259bb749ebcce3fe213b4db4e9cd176c867c50b693e7442a17f292`,
          "Content-Type": "multipart/form-data",
        },
      });

      return { path: `https://gateway.pinata.cloud/ipfs/${res.data.IpfsHash}` };
    } catch (error) {
      console.error("IPFS upload error:", error);
      throw new Error("Unable to upload encrypted JSON to IPFS");
    }
  },
};

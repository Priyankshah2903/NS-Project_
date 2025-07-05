// ipfs.js
import axios from 'axios';

export const ipfs = {
    add: async (data) => {
        const res = await axios.post(`http://localhost:9000`, data);
        return res.data;
    }
};

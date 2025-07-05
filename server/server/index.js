const express = require('express');
const cors = require('cors');
const userRoutes = require('./routes/users');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 9000;
let server;

// middlware config


app.use(cors());
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));


app.use('/', userRoutes);


server = app.listen(PORT, () => {
    console.log(`Node server running on port: ${PORT}`);
});

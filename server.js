// Built-in Node JS modules
const path = require('path');

// Third-party Node JS modules
const express = require('express');

let web_root_dir = path.join(__dirname, 'public');
let port = 8000;

let app = express();
app.use(express.static(web_root_dir));

// Start server - listen for client connections
app.listen(port, () => {
    console.log('Now listening on port ' + port);
});

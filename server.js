const express = require('express');
const bodyParser = require('body-parser');
const useragent = require('useragent');
const fs = require('fs');
const path = require('path');

const app = express();
const DATA_FILE = path.join(__dirname, 'ghost_data.json');

app.use(bodyParser.json());
app.use(express.static('public')); // Serves your HTML/CSS

// Helper: Read previous data
function getPreviousVisitor() {
    try {
        if (fs.existsSync(DATA_FILE)) {
            const data = fs.readFileSync(DATA_FILE);
            return JSON.parse(data);
        }
    } catch (err) {
        console.error(err);
    }
    return null; // Return null if no file exists (first visitor ever)
}

// Helper: Save new data
function saveCurrentVisitor(data) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data));
}

// The Core Exchange API
app.post('/api/exchange', (req, res) => {
    // 1. Get the Previous Visitor's data
    const previousVisitor = getPreviousVisitor();

    // 2. Process Current Visitor's data
    // We enrich the data with server-side info (IP, clean Browser name)
    const agent = useragent.parse(req.headers['user-agent']);
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    
    const currentVisitor = {
        timestamp: Date.now(),
        ip: ip,
        browser: agent.toAgent(),
        os: agent.os.toString(),
        // Data sent from frontend
        screen: req.body.screen,
        battery: req.body.battery,
        mouseTrail: req.body.mouseTrail, // The "Ghost" movement
        timezone: req.body.timezone
    };

    // 3. Save current visitor as the new "Ghost"
    saveCurrentVisitor(currentVisitor);

    // 4. Send the old ghost to the current user
    if (!previousVisitor) {
        res.json({ first: true });
    } else {
        res.json({ first: false, data: previousVisitor });
    }
});

app.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
    console.log('The ghost is listening...');
});
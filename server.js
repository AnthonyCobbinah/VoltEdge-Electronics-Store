const express = require('express');
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();

const PORT = process.env.PORT || 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "1234"; 

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// In-memory data stores
let orders = [];
let users = []; // Stores { name, phone }

/** * API Endpoints 
 */

// 1. User Registration
app.post('/api/register', (req, res) => {
    const { name, phone } = req.body;
    
    if (!name || !phone) {
        return res.status(400).json({ error: "Name and Phone are required" });
    }

    const userExists = users.find(u => u.phone === phone);
    if (userExists) {
        return res.status(409).json({ error: "Phone number already registered" });
    }

    const newUser = { name, phone };
    users.push(newUser);
    console.log(`👤 New User Registered: ${name} (${phone})`);
    res.status(201).json({ message: "Registration successful", user: newUser });
});

// 2. User Login (Credential Verification)
app.post('/api/login', (req, res) => {
    const { name, phone } = req.body;
    const user = users.find(u => u.phone === phone && u.name.toLowerCase() === name.toLowerCase());

    if (user) {
        res.json({ success: true, user });
    } else {
        res.status(401).json({ success: false, message: "Invalid credentials or account does not exist" });
    }
});

// 3. Place a new order (With Auth Check)
app.post('/api/orders', (req, res) => {
    const { customer, phone, itemName, price } = req.body;
    
    // Server-side security check: Ensure the user actually exists
    const validUser = users.find(u => u.phone === phone && u.name.toLowerCase() === customer.toLowerCase());
    
    if (!validUser) {
        return res.status(403).json({ error: "Unauthorized: Please register/login first" });
    }

    const newOrder = { 
        id: Date.now(), 
        customer: validUser.name, 
        phone: validUser.phone, 
        itemName,
        price,
        confirmed: false,
        timestamp: new Date().toLocaleString('en-GB', { 
            day: '2-digit', month: 'short', year: 'numeric', 
            hour: '2-digit', minute: '2-digit'
        }) 
    };
    
    orders.unshift(newOrder); 
    console.log(`🛒 Order Placed: ${itemName} by ${customer}`);
    res.status(201).json(newOrder);
});

// 4. Get personal orders
app.get('/api/my-orders/:phone', (req, res) => {
    const myOrders = orders.filter(o => o.phone === req.params.phone);
    res.json(myOrders);
});

// 5. Admin Verification
app.post('/api/admin/verify', (req, res) => {
    const { password } = req.body;
    if (password === ADMIN_PASSWORD) {
        res.json({ success: true, orders: orders, userCount: users.length });
    } else {
        res.status(401).json({ success: false, message: "Invalid Admin Password" });
    }
});

// 6. Admin Order Confirmation
app.patch('/api/orders/:id', (req, res) => {
    const { password } = req.body;
    if (password !== ADMIN_PASSWORD) return res.status(401).json({ error: "Unauthorized" });

    const order = orders.find(o => o.id === parseInt(req.params.id));
    if (order) {
        order.confirmed = true;
        res.json({ success: true });
    } else {
        res.status(404).json({ error: "Order not found" });
    }
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`-------------------------------------------`);
    console.log(`⚡ VoltEdge Backend: http://localhost:${PORT}`);
    console.log(`👥 Database: Active (In-Memory)`);
    console.log(`-------------------------------------------`);
});

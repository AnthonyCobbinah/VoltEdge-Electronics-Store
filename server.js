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
let users = []; 
let comments = []; 
let productStock = {}; 

/**
 * API Endpoints 
 */

// 1. User Registration & Login
app.post('/api/register', (req, res) => {
    const { name, phone } = req.body;
    if (!name || !phone) return res.status(400).json({ error: "Missing details" });
    
    if (users.find(u => u.phone === phone)) {
        return res.status(409).json({ error: "Phone already exists" });
    }

    const newUser = { name, phone };
    users.push(newUser);
    res.status(201).json({ success: true, user: newUser });
});

app.post('/api/login', (req, res) => {
    const { name, phone } = req.body;
    const user = users.find(u => u.phone === phone && u.name.toLowerCase() === name.toLowerCase());
    if (user) {
        res.json({ success: true, user });
    } else {
        res.status(401).json({ success: false });
    }
});

// 2. Orders: Place, Get, Confirm, and Delete
app.post('/api/orders', (req, res) => {
    const { customer, phone, itemName, price } = req.body;
    const newOrder = { 
        id: Date.now(), 
        customer, 
        phone, 
        itemName, 
        price,
        confirmed: false, // NEW: Matches HTML logic
        timestamp: new Date().toLocaleString()
    };
    orders.unshift(newOrder); 
    res.status(201).json(newOrder);
});

app.get('/api/my-orders/:phone', (req, res) => {
    const myOrders = orders.filter(o => o.phone === req.params.phone);
    res.json(myOrders);
});

// NEW: Confirm Order (Admin only)
app.patch('/api/orders/:id/confirm', (req, res) => {
    const { password } = req.body;
    if (password !== ADMIN_PASSWORD) return res.status(401).json({ error: "Unauthorized" });
    
    const order = orders.find(o => o.id === parseInt(req.params.id));
    if (order) {
        order.confirmed = true;
        res.json({ success: true, order });
    } else {
        res.status(404).json({ error: "Order not found" });
    }
});

app.delete('/api/orders/:id', (req, res) => {
    const { password } = req.body;
    if (password !== ADMIN_PASSWORD) return res.status(401).json({ error: "Unauthorized" });
    
    orders = orders.filter(o => o.id !== parseInt(req.params.id));
    res.json({ success: true });
});

// 3. Comments (Feedback)
app.post('/api/comments', (req, res) => {
    const { user, text } = req.body;
    if (!text) return res.status(400).send();
    
    const newComment = { 
        id: Date.now(), 
        user, 
        text, 
        timestamp: new Date().toLocaleString() 
    };
    comments.unshift(newComment);
    res.status(201).json(newComment);
});

app.delete('/api/comments/:id', (req, res) => {
    const { password } = req.body;
    if (password !== ADMIN_PASSWORD) return res.status(401).json({ error: "Unauthorized" });
    
    comments = comments.filter(c => c.id !== parseInt(req.params.id));
    res.json({ success: true });
});

// 4. Stock Management
app.get('/api/stock', (req, res) => {
    res.json(productStock);
});

app.patch('/api/stock', (req, res) => {
    const { password, productIndex, inStock } = req.body;
    if (password !== ADMIN_PASSWORD) return res.status(401).json({ error: "Unauthorized" });
    
    productStock[productIndex] = inStock;
    res.json({ success: true });
});

// 5. Admin Dashboard Verification
app.post('/api/admin/verify', (req, res) => {
    const { password } = req.body;
    if (password === ADMIN_PASSWORD) {
        res.json({ 
            success: true, 
            orders: orders, 
            comments: comments, 
            stock: productStock 
        });
    } else {
        res.status(401).json({ success: false });
    }
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`⚡ VoltEdge Backend running on port ${PORT}`);
});

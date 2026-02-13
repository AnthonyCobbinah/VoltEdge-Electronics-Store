const express = require('express');
const path = require('path');
const app = express();

const PORT = process.env.PORT || 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "VoltEdgeAdmin2026";

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

let orders = [];

// API: Place a new order
app.post('/api/orders', (req, res) => {
    const { customer, phone, itemName } = req.body;
    const newOrder = { 
        id: Date.now(), 
        customer, 
        phone, 
        itemName, 
        confirmed: false 
    };
    orders.push(newOrder);
    res.status(201).json(newOrder);
});

// API: Get orders for a specific customer
app.get('/api/my-orders/:phone', (req, res) => {
    const myOrders = orders.filter(o => o.phone === req.params.phone);
    res.json(myOrders);
});

// API: Admin verification and order list
app.post('/api/admin/verify', (req, res) => {
    if (req.body.password === ADMIN_PASSWORD) {
        res.json({ success: true, orders: orders });
    } else {
        res.status(401).json({ success: false });
    }
});

// API: Admin confirms an order
app.patch('/api/orders/:id', (req, res) => {
    if (req.headers['admin-password'] !== ADMIN_PASSWORD) return res.status(401).send();
    const order = orders.find(o => o.id == req.params.id);
    if (order) order.confirmed = true;
    res.json({ success: true });
});

// Serve the frontend for all other routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => console.log(`Server active on port ${PORT}`));
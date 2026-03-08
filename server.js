const express = require('express');
const path = require('path');
const cors = require('cors'); // Added for cross-origin compatibility
const app = express();

const PORT = process.env.PORT || 3000;
// Note: In production, always set this via environment variables
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "VoltEdgeAdmin2026";

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// In-memory data store (resets when server restarts)
let orders = [];

/** * API Endpoints 
 */

// 1. Place a new order
app.post('/api/orders', (req, res) => {
    const { customer, phone, itemName } = req.body;
    
    if (!customer || !phone || !itemName) {
        return res.status(400).json({ error: "Missing order details" });
    }

    const newOrder = { 
        id: Date.now(), 
        customer, 
        phone, 
        itemName, 
        confirmed: false,
        timestamp: new Date()
    };
    
    orders.push(newOrder);
    console.log(`New Order: ${itemName} for ${customer}`);
    res.status(201).json(newOrder);
});

// 2. Get orders for a specific customer (Phone-based tracking)
app.get('/api/my-orders/:phone', (req, res) => {
    const customerPhone = req.params.phone;
    const myOrders = orders.filter(o => o.phone === customerPhone);
    res.json(myOrders);
});

// 3. Admin Login & Dashboard Data
app.post('/api/admin/verify', (req, res) => {
    const { password } = req.body;
    
    if (password === ADMIN_PASSWORD) {
        // Return all orders sorted by newest first
        const sortedOrders = [...orders].reverse();
        res.json({ success: true, orders: sortedOrders });
    } else {
        res.status(401).json({ success: false, message: "Invalid Admin Password" });
    }
});

// 4. Admin Order Confirmation
app.patch('/api/orders/:id', (req, res) => {
    const adminPass = req.headers['admin-password'];
    
    if (adminPass !== ADMIN_PASSWORD) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    const orderId = parseInt(req.params.id);
    const order = orders.find(o => o.id === orderId);
    
    if (order) {
        order.confirmed = true;
        return res.json({ success: true, message: "Order confirmed" });
    }
    
    res.status(404).json({ error: "Order not found" });
});

// Serve frontend for all non-API routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`-------------------------------------------`);
    console.log(`⚡ VoltEdge Server Running: http://localhost:${PORT}`);
    console.log(`🔐 Admin Password: ${ADMIN_PASSWORD}`);
    console.log(`-------------------------------------------`);
});

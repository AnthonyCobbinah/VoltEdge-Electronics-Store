const express = require('express');
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();

const PORT = process.env.PORT || 3000;
// Note: In Production (Render), set this via Environment Variables for security
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "1234"; 

// Middleware
app.use(cors());
app.use(bodyParser.json());
// Serves your index.html and assets from the 'public' folder
app.use(express.static(path.join(__dirname, 'public')));

// In-memory data store (Resets when server restarts)
let orders = [];

/** * API Endpoints 
 */

// 1. Place a new order
app.post('/api/orders', (req, res) => {
    const { customer, phone, itemName, price } = req.body;
    
    // Validation
    if (!customer || !phone || !itemName) {
        return res.status(400).json({ error: "Missing order details" });
    }

    const newOrder = { 
        id: Date.now(), 
        customer, 
        phone, 
        itemName,
        price: price || 0, // Store the price for the admin to see
        confirmed: false,
        timestamp: new Date().toLocaleString('en-GB', { 
            day: '2-digit', month: 'short', year: 'numeric', 
            hour: '2-digit', minute: '2-digit', second: '2-digit' 
        }) 
    };
    
    // Use unshift so the latest order always appears at the top [index 0]
    orders.unshift(newOrder); 
    
    console.log(`🛒 New Order: ${itemName} (GH₵${price}) - Customer: ${customer}`);
    res.status(201).json(newOrder);
});

// 2. Get orders for a specific customer (Phone-based tracking)
app.get('/api/my-orders/:phone', (req, res) => {
    const customerPhone = req.params.phone;
    const myOrders = orders.filter(o => o.phone === customerPhone);
    res.json(myOrders);
});

// 3. Admin Login & Dashboard Data Refresh
app.post('/api/admin/verify', (req, res) => {
    const { password } = req.body;
    
    if (password === ADMIN_PASSWORD) {
        // Return all orders
        res.json({ success: true, orders: orders });
    } else {
        res.status(401).json({ success: false, message: "Invalid Admin Password" });
    }
});

// 4. Admin Order Confirmation
app.patch('/api/orders/:id', (req, res) => {
    const { password } = req.body;
    
    if (password !== ADMIN_PASSWORD) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    const orderId = parseInt(req.params.id);
    const order = orders.find(o => o.id === orderId);
    
    if (order) {
        order.confirmed = true;
        console.log(`✅ Order ${orderId} confirmed.`);
        return res.json({ success: true, message: "Order confirmed successfully" });
    }
    
    res.status(404).json({ error: "Order not found" });
});

// Catch-all route to serve index.html for any frontend navigation
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`-------------------------------------------`);
    console.log(`⚡ VoltEdge Server Active: http://localhost:${PORT}`);
    console.log(`🔒 Admin Mode: Enabled`);
    console.log(`-------------------------------------------`);
});

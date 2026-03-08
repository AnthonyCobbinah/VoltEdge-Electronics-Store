const express = require('express');
const path = require('path');
const cors = require('cors');
const app = express();

const PORT = process.env.PORT || 3000;
// Note: In Render, add ADMIN_PASSWORD as an Environment Variable
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "1234"; 

// Middleware
app.use(cors());
app.use(express.json());
// Assuming your index.html is in a folder named 'public'
app.use(express.static(path.join(__dirname, 'public')));

// In-memory data store
let orders = [];

/** * API Endpoints 
 */

// 1. Place a new order (with Date and Time)
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
        // Generates "MM/DD/YYYY, HH:MM:SS AM/PM"
        timestamp: new Date().toLocaleString() 
    };
    
    orders.unshift(newOrder); // Add to the top of the list
    console.log(`New Order: ${itemName} from ${customer} (${phone})`);
    res.status(201).json(newOrder);
});

// 2. Get orders for a specific customer (Filtered by Phone)
app.get('/api/my-orders/:phone', (req, res) => {
    const customerPhone = req.params.phone;
    const myOrders = orders.filter(o => o.phone === customerPhone);
    res.json(myOrders);
});

// 3. Admin Login & Get All Orders
app.post('/api/admin/verify', (req, res) => {
    const { password } = req.body;
    
    if (password === ADMIN_PASSWORD) {
        // Return all orders (already sorted by unshift)
        res.json({ success: true, orders: orders });
    } else {
        res.status(401).json({ success: false, message: "Invalid Admin Password" });
    }
});

// 4. Admin Order Confirmation (Updates status for customer to see)
app.patch('/api/orders/:id', (req, res) => {
    // We check the password sent in the body or headers for security
    const { password } = req.body;
    
    if (password !== ADMIN_PASSWORD) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    const orderId = parseInt(req.params.id);
    const order = orders.find(o => o.id === orderId);
    
    if (order) {
        order.confirmed = true;
        console.log(`Order ${orderId} confirmed by Admin`);
        return res.json({ success: true, message: "Order confirmed" });
    }
    
    res.status(404).json({ error: "Order not found" });
});

// Serve frontend
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`-------------------------------------------`);
    console.log(`⚡ VoltEdge Server Running: http://localhost:${PORT}`);
    console.log(`🔐 Admin Password: ${ADMIN_PASSWORD}`);
    console.log(`-------------------------------------------`);
});

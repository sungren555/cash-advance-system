const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://user:password@cluster.mongodb.net/cash-advance', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log('MongoDB connected')).catch(err => console.log(err));

// ============ SCHEMAS ============

// User Schema
const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    fullName: { type: String, required: true },
    role: { type: String, enum: ['admin', 'requestor', 'verifier', 'approver', 'disburser'], default: 'requestor' },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    createdAt: { type: Date, default: Date.now }
});

// Request Schema
const requestSchema = new mongoose.Schema({
    requestId: { type: String, required: true, unique: true },
    requestorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    requestor: { type: String, required: true },
    requestorEmail: { type: String, required: true },
    amount: { type: Number, required: true },
    project: { type: String, required: true },
    description: { type: String, required: true },
    status: { type: String, enum: ['pending', 'verified', 'approved', 'disbursed', 'rejected', 'denied'], default: 'pending' },
    date: { type: Date, default: Date.now },
    file: { type: String },
    timeline: [{
        action: String,
        user: String,
        userId: mongoose.Schema.Types.ObjectId,
        date: { type: Date, default: Date.now }
    }],
    createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);
const Request = mongoose.model('Request', requestSchema);

// ============ HELPER FUNCTIONS ============

const generateToken = (userId) => {
    return jwt.sign({ userId }, process.env.JWT_SECRET || 'your-secret-key', { expiresIn: '7d' });
};

const verifyToken = (token) => {
    try {
        return jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    } catch (err) {
        return null;
    }
};

const auth = async (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token provided' });
    
    const decoded = verifyToken(token);
    if (!decoded) return res.status(401).json({ error: 'Invalid token' });
    
    const user = await User.findById(decoded.userId);
    if (!user) return res.status(401).json({ error: 'User not found' });
    
    req.user = user;
    next();
};

const checkRole = (roles) => (req, res, next) => {
    if (!roles.includes(req.user.role)) {
        return res.status(403).json({ error: 'Access denied' });
    }
    next();
};

// ============ AUTHENTICATION ROUTES ============

// Register
app.post('/api/auth/register', async (req, res) => {
    try {
        const { username, email, password, fullName, role } = req.body;
        
        if (!username || !email || !password || !fullName) {
            return res.status(400).json({ error: 'Missing fields' });
        }
        
        const existingUser = await User.findOne({ $or: [{ username }, { email }] });
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }
        
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({
            username,
            email,
            password: hashedPassword,
            fullName,
            role: role || 'admin'
        });
        
        await user.save();
        const token = generateToken(user._id);
        
        res.json({
            message: 'User created successfully',
            token,
            user: { id: user._id, username: user.username, email: user.email, fullName: user.fullName, role: user.role }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Login
app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(400).json({ error: 'User not found' });
        }
        
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(400).json({ error: 'Invalid password' });
        }
        
        const token = generateToken(user._id);
        res.json({
            message: 'Login successful',
            token,
            user: { id: user._id, username: user.username, email: user.email, fullName: user.fullName, role: user.role }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============ USER MANAGEMENT (ADMIN ONLY) ============

// Get all users
app.get('/api/users', auth, checkRole(['admin']), async (req, res) => {
    try {
        const users = await User.find().select('-password');
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create user (admin)
app.post('/api/users', auth, checkRole(['admin']), async (req, res) => {
    try {
        const { username, email, password, fullName, role } = req.body;
        
        const existingUser = await User.findOne({ $or: [{ username }, { email }] });
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }
        
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({
            username,
            email,
            password: hashedPassword,
            fullName,
            role
        });
        
        await user.save();
        res.status(201).json({
            message: 'User created successfully',
            user: { id: user._id, username: user.username, email: user.email, fullName: user.fullName, role: user.role }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update user role (admin)
app.put('/api/users/:userId', auth, checkRole(['admin']), async (req, res) => {
    try {
        const { role, status } = req.body;
        const user = await User.findByIdAndUpdate(
            req.params.userId,
            { role, status },
            { new: true }
        ).select('-password');
        
        res.json({ message: 'User updated', user });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete user (admin)
app.delete('/api/users/:userId', auth, checkRole(['admin']), async (req, res) => {
    try {
        await User.findByIdAndDelete(req.params.userId);
        res.json({ message: 'User deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============ REQUEST MANAGEMENT ============

// Create request
app.post('/api/requests', auth, checkRole(['requestor', 'admin']), async (req, res) => {
    try {
        const { project, amount, description } = req.body;
        const lastRequest = await Request.findOne().sort({ createdAt: -1 });
        const requestNumber = lastRequest ? parseInt(lastRequest.requestId.split('-')[1]) + 1 : 1;
        const requestId = `ADV-${String(requestNumber).padStart(3, '0')}`;
        
        const request = new Request({
            requestId,
            requestorId: req.user._id,
            requestor: req.user.fullName,
            requestorEmail: req.user.email,
            project,
            amount,
            description,
            timeline: [{
                action: 'Requested',
                user: req.user.fullName,
                userId: req.user._id
            }]
        });
        
        await request.save();
        res.status(201).json({ message: 'Request created', request });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get all requests
app.get('/api/requests', auth, async (req, res) => {
    try {
        let query = {};
        
        if (req.user.role === 'requestor') {
            query.requestorId = req.user._id;
        }
        
        const requests = await Request.find(query).populate('requestorId', '-password');
        res.json(requests);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get filtered requests by status
app.get('/api/requests/status/:status', auth, async (req, res) => {
    try {
        const requests = await Request.find({ status: req.params.status }).populate('requestorId', '-password');
        res.json(requests);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Verify request
app.put('/api/requests/:requestId/verify', auth, checkRole(['verifier', 'admin']), async (req, res) => {
    try {
        const request = await Request.findByIdAndUpdate(
            req.params.requestId,
            { 
                status: 'verified',
                $push: {
                    timeline: {
                        action: 'Verified',
                        user: req.user.fullName,
                        userId: req.user._id
                    }
                }
            },
            { new: true }
        );
        res.json({ message: 'Request verified', request });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Approve request
app.put('/api/requests/:requestId/approve', auth, checkRole(['approver', 'admin']), async (req, res) => {
    try {
        const request = await Request.findByIdAndUpdate(
            req.params.requestId,
            { 
                status: 'approved',
                $push: {
                    timeline: {
                        action: 'Approved',
                        user: req.user.fullName,
                        userId: req.user._id
                    }
                }
            },
            { new: true }
        );
        res.json({ message: 'Request approved', request });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Disburse request
app.put('/api/requests/:requestId/disburse', auth, checkRole(['disburser', 'admin']), async (req, res) => {
    try {
        const request = await Request.findByIdAndUpdate(
            req.params.requestId,
            { 
                status: 'disbursed',
                $push: {
                    timeline: {
                        action: 'Disbursed',
                        user: req.user.fullName,
                        userId: req.user._id
                    }
                }
            },
            { new: true }
        );
        res.json({ message: 'Request disbursed', request });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Reject request
app.put('/api/requests/:requestId/reject', auth, checkRole(['verifier', 'admin']), async (req, res) => {
    try {
        const request = await Request.findByIdAndUpdate(
            req.params.requestId,
            { 
                status: 'rejected',
                $push: {
                    timeline: {
                        action: 'Rejected',
                        user: req.user.fullName,
                        userId: req.user._id
                    }
                }
            },
            { new: true }
        );
        res.json({ message: 'Request rejected', request });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete request
app.delete('/api/requests/:requestId', auth, async (req, res) => {
    try {
        const request = await Request.findById(req.params.requestId);
        
        if (request.requestorId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Not authorized' });
        }
        
        await Request.findByIdAndDelete(req.params.requestId);
        res.json({ message: 'Request deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============ DASHBOARD STATS ============

app.get('/api/dashboard/stats', auth, async (req, res) => {
    try {
        const stats = {
            totalRequests: await Request.countDocuments(),
            pendingCount: await Request.countDocuments({ status: 'pending' }),
            verifiedCount: await Request.countDocuments({ status: 'verified' }),
            approvedCount: await Request.countDocuments({ status: 'approved' }),
            disbursedCount: await Request.countDocuments({ status: 'disbursed' }),
            totalAmount: 0
        };
        
        const requests = await Request.find();
        stats.totalAmount = requests.reduce((sum, req) => sum + req.amount, 0);
        
        res.json(stats);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============ SERVE STATIC FILES & FRONTEND ============

// Serve static files from current directory
app.use(express.static('./'));

// Serve index.html for root path
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

// Catch-all route - serve index.html for any unknown routes
app.use((req, res) => {
    res.sendFile(__dirname + '/index.html');
});

// ============ START SERVER ============

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
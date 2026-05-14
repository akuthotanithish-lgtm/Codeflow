const express = require('express');
const router = express.Router();
const { 
    registerUser, 
    loginUser, 
    getProfile, 
    updateProfile, 
    getDashboardStats, 
    getAllUsers,
    getUserById,
    sendConnectionRequest,
    acceptConnectionRequest,
    getConnectionStatus,
    getAllConnections,
    getConnectionRequests,
    removeConnection,
    getSuggestions
} = require('../controllers/userController');
const auth = require('../middleware/auth');

// 1. Auth Routes
router.post('/register', registerUser);
router.post('/login', loginUser);

// 2. Specific Routes (Must come BEFORE dynamic /:id routes)
// Get logged-in user's private profile
router.get('/profile', auth, getProfile);

// Update logged-in user's profile
router.put('/profile', auth, updateProfile);

// Get Dashboard Stats (Graph, Rank, etc.)
router.get('/dashboard/stats', auth, getDashboardStats);

// 3. General Routes
// Get All Users (Network Page)
router.get('/', auth, getAllUsers);

// 4. Dynamic Route (The Profile Page calls this: /api/users/:id)
// This handles "Public Profile" viewing
router.get('/suggestions', auth, getSuggestions);
router.get('/connections', auth, getAllConnections);
router.get('/connections/requests', auth, getConnectionRequests);
router.get('/:id', getUserById);
router.post('/connect/:userId', auth, sendConnectionRequest);
router.post('/connect/accept/:userId', auth, acceptConnectionRequest);
router.get('/connect/status/:userId', auth, getConnectionStatus);
router.delete('/connections/:id', auth, removeConnection); // Check status between me and another user
module.exports = router;
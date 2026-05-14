const Discussion = require('../models/Discussion');
const feedService = require('../services/feedService');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
exports.getAllDiscussions = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        
        if (req.user) {
            // Personalized Engine
            const feed = await feedService.generateFeed(req.user.id, page);
            res.json(feed);
        } else {
            // Guest Engine (Simple Chronological)
            const feed = await Discussion.find()
                .sort({ createdAt: -1 })
                .limit(10)
                .populate('author', 'name avatar username');
            res.json(feed);
        }
    } catch (err) {
        console.error("Feed Error:", err.message);
        res.status(500).send('Server Error');
    }
};

// 2. Track Signals (Dwell Time, Clicks)
exports.recordInteraction = async (req, res) => {
    try {
        // userId comes from auth middleware, postId/type/dwell from body
        await feedService.processInteraction(req.user.id, req.body.postId, req.body.type);
        res.status(200).send();
    } catch (err) {
        console.error("Tracking Error:", err.message);
        res.status(200).send(); // Always return 200 to frontend
    }
};

// 3. Get Personalized News
exports.getNews = async (req, res) => {
    try {
        // If logged in, get personalized. If not, return generic.
        if (req.user) {
            const news = await feedService.getPersonalizedNews(req.user.id);
            res.json(news);
        } else {
            res.json([]); // Or generic fallback
        }
    } catch (err) {
        console.error("News Error:", err.message);
        res.status(500).send('Server Error');
    }
};

// 2. Get Discussion by ID (With View Counting)
exports.getDiscussionById = async (req, res) => {
    try {
        let discussion = await Discussion.findById(req.params.id);
        if (!discussion) return res.status(404).json({ msg: 'Post not found' });

        // --- UNIQUE VIEW LOGIC ---
        const token = req.header('x-auth-token');
        let userId = null;

        if (token) {
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                userId = decoded.user.id;
            } catch (e) {
                console.log("Invalid token for view counting");
            }
        }

        // Only increment if user exists and hasn't viewed it yet
        if (userId && !discussion.viewedBy.includes(userId)) {
            discussion = await Discussion.findByIdAndUpdate(
                req.params.id,
                { 
                    $inc: { views: 1 },
                    $push: { viewedBy: userId }
                },
                { new: true }
            );
        }

        // Populate details
        await discussion.populate('author', 'name avatar username');
        await discussion.populate({
            path: 'comments.author',
            select: 'name avatar username'
        });

        res.json(discussion);
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') return res.status(404).json({ msg: 'Post not found' });
        res.status(500).send('Server Error');
    }
};

// 3. Create Post
exports.createPost = async (req, res) => {
    try {
        const newPost = new Discussion({
            ...req.body,
            author: req.user.id
        });
        const post = await newPost.save();
        await post.populate('author', 'name avatar username');
        res.json(post);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// Inside discussionController.js -> likePost
exports.likePost = async (req, res) => {
    try {
        const post = await Discussion.findById(req.params.id);
        if (!post) return res.status(404).json({ msg: 'Post not found' });

        if (post.likes.includes(req.user.id)) {
            post.likes = post.likes.filter(id => id.toString() !== req.user.id);
        } else {
            post.likes.push(req.user.id);
        }

        await post.save();
        
        // <-- ADD THIS LINE to return the populated names/avatars
        await post.populate('likes', 'name avatar bio'); 
        
        res.json(post.likes);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// 5. Comment on Post
exports.addComment = async (req, res) => {
    try {
        if (!req.body.content) return res.status(400).json({ msg: "Content is required" });

        const post = await Discussion.findById(req.params.id);
        if (!post) return res.status(404).json({ msg: 'Post not found' });

        const newComment = {
            author: req.user.id,
            content: req.body.content,
            createdAt: new Date(),
            likes: []
        };

        post.comments.push(newComment);
        await post.save();
        
        // Return full updated post so UI reflects changes immediately
        await post.populate('author', 'name avatar username');
        await post.populate({
            path: 'comments.author',
            select: 'name avatar username'
        });
        
        res.json(post);
    } catch (err) {
        console.error("Comment Error:", err.message);
        res.status(500).send('Server Error');
    }
};

// 1. LIKE A COMMENT
exports.likeComment = async (req, res) => {
    try {
        const post = await Discussion.findById(req.params.id);
        if (!post) return res.status(404).json({ msg: 'Post not found' });

        const comment = post.comments.id(req.params.commentId);
        if (!comment) return res.status(404).json({ msg: 'Comment not found' });

        // Ensure comment.likes array exists
        if (!comment.likes) comment.likes = [];

        if (comment.likes.includes(req.user.id)) {
            // Unlike
            comment.likes = comment.likes.filter(id => id.toString() !== req.user.id);
        } else {
            // Like
            comment.likes.push(req.user.id);
        }

        await post.save();
        res.json(comment.likes);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// 2. REPLY TO A COMMENT
exports.replyToComment = async (req, res) => {
    try {
        const post = await Discussion.findById(req.params.id);
        if (!post) return res.status(404).json({ msg: 'Post not found' });

        const comment = post.comments.id(req.params.commentId);
        if (!comment) return res.status(404).json({ msg: 'Comment not found' });

        // Ensure comment.replies array exists
        if (!comment.replies) comment.replies = [];

        const newReply = {
            author: req.user.id,
            content: req.body.content,
            createdAt: new Date()
        };

        comment.replies.push(newReply);
        await post.save();

        // Populate the author so frontend can display it immediately
        await post.populate('comments.replies.author', 'name avatar bio');

        // Return the newly created reply
        const savedReply = post.comments.id(req.params.commentId).replies.slice(-1)[0];
        res.json(savedReply);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// 7. Save/Unsave Post
exports.savePost = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        const postId = req.params.id;

        if (!user.savedPosts) {
            user.savedPosts = [];
        }

        if (user.savedPosts.includes(postId)) {
            user.savedPosts = user.savedPosts.filter(id => id.toString() !== postId);
        } else {
            user.savedPosts.push(postId);
        }
        await user.save();
        res.json(user.savedPosts);
    } catch (err) {
        console.error("Save Error:", err.message);
        res.status(500).send('Server Error');
    }
};

// 8. Get Saved Posts
exports.getSavedPosts = async (req, res) => {
    try {
        const User = require('../models/User'); // Ensure User model is imported
        
        // Find user and deep populate savedPosts -> author
        const user = await User.findById(req.user.id).populate({
            path: 'savedPosts',
            populate: { 
                path: 'author', 
                select: 'name avatar username bio' 
            }
        });

        if (!user) return res.status(404).json({ msg: "User not found" });

        // Filter out any null posts (in case a saved post was deleted by its author)
        const activeSavedPosts = user.savedPosts.filter(post => post !== null);

        res.json(activeSavedPosts);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// 9. Delete Post
exports.deletePost = async (req, res) => {
    try {
        const post = await Discussion.findById(req.params.id);
        if (!post) return res.status(404).json({ msg: 'Post not found' });

        if (post.author.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'User not authorized' });
        }

        await post.deleteOne();
        res.json({ msg: 'Post removed' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// 10. Update Post
exports.updatePost = async (req, res) => {
    try {
        const { title, content, category } = req.body;
        let post = await Discussion.findById(req.params.id);
        if (!post) return res.status(404).json({ msg: 'Post not found' });

        if (post.author.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'User not authorized' });
        }

        post.title = title || post.title;
        post.content = content || post.content;
        post.category = category || post.category;

        await post.save();
        await post.populate('author', 'name avatar username');
        res.json(post);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// 11. Delete Comment
exports.deleteComment = async (req, res) => {
    try {
        const post = await Discussion.findById(req.params.id);
        if (!post) return res.status(404).json({ msg: 'Post not found' });

        const comment = post.comments.id(req.params.commentId);
        if (!comment) return res.status(404).json({ msg: 'Comment not found' });

        if (comment.author.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'User not authorized' });
        }

        post.comments.pull(req.params.commentId);
        await post.save();
        
        await post.populate('author', 'name avatar username');
        await post.populate({
            path: 'comments.author',
            select: 'name avatar username'
        });
        
        res.json(post);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// 12. Update Comment
exports.updateComment = async (req, res) => {
    try {
        const post = await Discussion.findById(req.params.id);
        if (!post) return res.status(404).json({ msg: 'Post not found' });

        const comment = post.comments.id(req.params.commentId);
        if (!comment) return res.status(404).json({ msg: 'Comment not found' });

        if (comment.author.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'User not authorized' });
        }

        comment.content = req.body.content;
        comment.updatedAt = Date.now();
        
        await post.save();
        
        await post.populate('author', 'name avatar username');
        await post.populate({
            path: 'comments.author',
            select: 'name avatar username'
        });

        res.json(post);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};
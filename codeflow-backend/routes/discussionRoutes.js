const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

const {
  getAllDiscussions,
  getNews,
  recordInteraction,
  createPost,
  getSavedPosts,
  getDiscussionById,
  updatePost,
  deletePost,
  likePost,
  savePost,
  addComment,
  deleteComment,
  updateComment,
  likeComment,
  replyToComment
} = require('../controllers/discussionController');


// ================= FEED =================
router.get('/', auth, getAllDiscussions);

// ================= NEWS (PUBLIC) =================
router.get('/news', getNews);

// ================= INTERACTIONS =================
router.post('/interaction', auth, recordInteraction);
router.post('/', auth, createPost);

// ================= SAVED POSTS =================
router.get('/saved', auth, getSavedPosts);

// ================= POST ACTIONS =================
router.get('/:id', getDiscussionById);
router.put('/:id', auth, updatePost);
router.delete('/:id', auth, deletePost);
router.put('/:id/like', auth, likePost);
router.post('/:id/save', auth, savePost);

// ================= COMMENTS =================
router.post('/:id/comments', auth, addComment);
router.put('/:id/comments/:commentId', auth, updateComment);
router.delete('/:id/comments/:commentId', auth, deleteComment);

// ================= COMMENT INTERACTIONS (NEW) =================
router.put('/:id/comments/:commentId/like', auth, likeComment);
router.post('/:id/comments/:commentId/reply', auth, replyToComment);

module.exports = router;
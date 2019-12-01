const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const auth = require('../../middleware/auth');

const Post = require('../../models/Posts');
const Profile = require('../../models/Profile');
const User = require('../../models/User');

// @route   POST api/posts
// @desc    Create a post
// @access  Private
router.post(
  '/',
  [
    auth,
    [
      check('text', 'Text is required')
        .not()
        .isEmpty()
    ]
  ],
  async (req, resp) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return resp.status(400).json({ error: errors.array() });
    }

    try {
      const userId = req.user.id;

      const user = await User.findById(userId).select('-password');

      const newPost = new Post({
        text: req.body.text,
        name: user.name,
        avatar: user.avatar,
        user: userId
      });

      const post = await newPost.save();

      resp.json(post);
    } catch (err) {
      console.log(err.message);
      resp.status(500).send('Server error');
    }
  }
);

// @route   GET api/posts
// @desc    Get all posts
// @access  Private
router.get('/', auth, async (req, resp) => {
  try {
    const posts = await Post.find().sort({ date: -1 });
    resp.json(posts);
  } catch (err) {
    console.log(err.message);
    resp.status(500).send('Server error');
  }
});

// @route   GET api/posts/:id
// @desc    Get a post by id
// @access  Private
router.get('/:id', auth, async (req, resp) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return resp.status(404).json({ msg: 'Post not found.' });
    }

    resp.json(post);
  } catch (err) {
    if (err.kind === 'ObjectId') {
      return resp.status(404).json({ msg: 'Post not found.' });
    }

    console.log(err.message);
    resp.status(500).send('Server error');
  }
});

// @route   DELETE api/posts/:id
// @desc    Delete a post by id
// @access  Private
router.delete('/:id', auth, async (req, resp) => {
  try {
    const post = await Post.findById(req.params.id);

    // Check user
    if (post.user.toString() !== req.user.id) {
      return resp.status(401).json({ msg: 'User not authorized' });
    }

    if (!post) {
      return resp.status(404).json({ msg: 'Post not found' });
    }

    await post.remove();

    resp.json({ msg: 'Post removed' });
  } catch (err) {
    if (err.kind == 'ObjectId') {
      return resp.status(404).json({ msg: 'Post not found' });
    }

    console.log(err.message);
    resp.status(500).send('Server error');
  }
});

module.exports = router;

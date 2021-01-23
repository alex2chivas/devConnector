const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const auth = require('../../middleware/auth');

const Post = require('../../models/Post');
const Profile = require('../../models/Profile');
const User = require('../../models/User');

//@route   Post api/posts
// @desc   Create a post
// @access Public
router.post(
	'/',
	[auth, [check('text', 'Text is require').not().isEmpty()]],
	async (req, res) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({ errors: errors.array() });
		}

		try {
			const user = await User.findById(req.user.id).select('-password');

			const newPost = new Post({
				text: req.body.text,
				name: user.name,
				avatar: user.avatar,
				user: req.user.id,
			});

			const post = await newPost.save();

			res.json(post);
		} catch (error) {
			console.log(error.message);
			res.status(500).send('Server error');
		}
	}
);

//@route   Post api/posts
// @desc   GET all posts
// @access Private

router.get('/', auth, async (req, res) => {
	try {
		const posts = await Post.find().sort({ date: -1 });
		res.json(posts);
	} catch (error) {
		console.log(error.message);
		res.status(500).send('Server error');
	}
});

//@route   Post api/posts/:id
// @desc   GET post by ID
// @access Private

router.get('/:id', auth, async (req, res) => {
	try {
		const post = await Post.findById(req.params.id);

		if (!post) {
			return res.status(404).json({ msg: 'Post not found' });
		}

		res.json(post);
	} catch (error) {
		console.log(error.message);
		if (error.kind === 'ObjectId') {
			return res.status(404).json({ msg: 'Post not found' });
		}

		res.status(500).send('Server error');
	}
});

//@route   Deelete api/posts
// @desc   Delete a post
// @access Private

router.delete('/:id', auth, async (req, res) => {
	try {
		const post = await Post.findById(req.params.id);

		if (!post) {
			return res.status(404).json({ msg: 'Post not found' });
		}

		//Check user
		if (post.user.toString() !== req.user.id.toString()) {
			return res.status(401).json({ msg: 'User not authorized' });
		}

		await post.remove();
		res.json({ msg: 'Post was removed' });
	} catch (error) {
		console.log(error.message);
		if (error.kind === 'ObjectId') {
			return res.status(404).json({ msg: 'Post not found' });
		}

		res.status(500).send('Server error');
	}
});

//@route   Put api/posts/like/:id
// @desc   Like a post
// @access Private

router.put('/like/:id', auth, async (req, res) => {
	try {
		const post = await Post.findById(req.params.id);

		// Check if the post has already been liked
		if (
			post.likes.filter(like => like.user.toString() === req.user.id).length > 0
		) {
			return res.status(400).json({ msg: 'Post already liked' });
		}

		post.likes.unshift({ user: req.user.id });

		await post.save();

		res.json(post.likes);
	} catch (error) {
		console.log(error.message);
		if (error.kind === 'ObjectId') {
			return res.status(404).json({ msg: 'Post not found' });
		}
		res.status(500).send('Server error');
	}
});

//@route   Put api/posts/unlike/:id
// @desc   Like a post
// @access Private

router.put('/unlike/:id', auth, async (req, res) => {
	try {
		const post = await Post.findById(req.params.id);

		// Check if the post has already been liked
		if (
			post.likes.filter(like => like.user.toString() === req.user.id).length ===
			0
		) {
			return res.status(400).json({ msg: 'Post has not yet been liked' });
		}

		// Get the remove index
		const removeIndex = post.likes
			.map(like => like.user.toString())
			.indexOf(req.user.id);

		post.likes.splice(removeIndex, 1);

		await post.save();

		res.json(post.likes);
	} catch (error) {
		console.log(error.message);
		if (error.kind === 'ObjectId') {
			return res.status(404).json({ msg: 'Post not found' });
		}
		res.status(500).send('Server error');
	}
});

//@route   Post api/posts/comment/:id
// @desc   Create a comment
// @access Public
router.post(
	'/comment/:id',
	[auth, [check('text', 'Text is require').not().isEmpty()]],
	async (req, res) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({ errors: errors.array() });
		}

		try {
			const user = await User.findById(req.user.id).select('-password');
			const post = await Post.findById(req.params.id);

			const newComment = {
				text: req.body.text,
				name: user.name,
				avatar: user.avatar,
				user: req.user.id,
			};

			post.comments.unshift(newComment);

			await post.save();

			res.json(post.comments);
		} catch (error) {
			console.log(error.message);
			res.status(500).send('Server error');
		}
	}
);

//@route  Delete api/posts/comment/:id/:comment_id
// @desc   Delete Comment
// @access Private

router.delete('/comment/:id/:comment_id', auth, async (req, res) => {
	try {
		const post = await Post.findById(req.params.id);

		// Pull out comment
		const comment = post.comments.find(
			comment => comment.id === req.params.comment_id
		);

		// Make sure comment exists
		if (!comment) {
			return res.status(404).json({ msg: 'Comment does not exist' });
		}

		// Check user
		if (comment.user.toString() !== req.user.id.toString()) {
			return res.status(401).json({ msg: 'User not authorized' });
		}

		// Get the remove index
		const removeIndex = post.comments
			.map(comment => comment.user.toString())
			.indexOf(req.user.id);

		post.comments.splice(removeIndex, 1);

		await post.save();

		res.json(post.comments);
	} catch (error) {
		console.log(error.message);
		res.status(500).send('Server error');
	}
});

//@route   Put api/posts/like/:id/:comment_id
// @desc   Like a post
// @access Private

router.put('/comment/like/:id/:comment_id', auth, async (req, res) => {
	try {
		const post = await Post.findById(req.params.id);

		// Pull out comment
		const comment = post.comments.find(
			comment => comment.id === req.params.comment_id
		);

		// Check if the comment has already been liked
		if (
			comment.likes.filter(like => like.user.toString() === req.user.id)
				.length > 0
		) {
			return res.status(400).json({ msg: 'Comment already liked' });
		}

		comment.likes.unshift({ user: req.user.id });

		await post.save();

		res.json(comment.likes);
	} catch (error) {
		console.log(error.message);
		if (error.kind === 'ObjectId') {
			return res.status(404).json({ msg: 'Post not found' });
		}
		res.status(500).send('Server error');
	}
});

//@route   Put api/posts/unlike/:id/:comment_id
// @desc   unLike a post
// @access Private

router.put('/comment/unlike/:id/:comment_id', auth, async (req, res) => {
	try {
		const post = await Post.findById(req.params.id);

		// Pull out comment
		const comment = post.comments.find(
			comment => comment.id === req.params.comment_id
		);

		// Check if the comment has already been liked
		if (
			comment.likes.filter(like => like.user.toString() === req.user.id)
				.length === 0
		) {
			return res.status(400).json({ msg: 'Post has not yet been liked' });
		}

		// Get the remove index
		const removeIndex = comment.likes
			.map(like => like.user.toString())
			.indexOf(req.user.id);

		comment.likes.splice(removeIndex, 1);

		await post.save();

		res.json(comment.likes);
	} catch (error) {
		console.log(error.message);
		if (error.kind === 'ObjectId') {
			return res.status(404).json({ msg: 'Post not found' });
		}
		res.status(500).send('Server error');
	}
});

module.exports = router;
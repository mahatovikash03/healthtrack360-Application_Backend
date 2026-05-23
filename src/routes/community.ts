import { Router, Request, Response } from 'express';
import { protect } from '../middleware/auth';
import CommunityPost from '../models/CommunityPost';

const router = Router();
router.use(protect);

// GET /api/v1/community — get all posts
router.get('/', async (req: Request, res: Response) => {
  try {
    const { tag, limit = 20, page = 1 } = req.query;
    const filter = tag && tag !== 'All' ? { tag } : {};
    const posts = await CommunityPost.find(filter)
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));
    res.json({ success: true, count: posts.length, data: posts });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/v1/community — create post
router.post('/', async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { title, content, tag } = req.body;
    if (!title || !content) return res.status(400).json({ success: false, message: 'Title and content are required.' });
    const post = await CommunityPost.create({
      author: user._id,
      authorName: user.name,
      title, content,
      tag: tag || 'General',
    });
    res.status(201).json({ success: true, data: post });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// PATCH /api/v1/community/:id/like — toggle like
router.patch('/:id/like', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user._id;
    const post   = await CommunityPost.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found.' });

    const alreadyLiked = post.likes.some(id => id.toString() === userId.toString());
    if (alreadyLiked) {
      post.likes = post.likes.filter(id => id.toString() !== userId.toString()) as any;
    } else {
      post.likes.push(userId);
    }
    await post.save();
    res.json({ success: true, likes: post.likes.length, liked: !alreadyLiked });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/v1/community/:id/comment — add comment
router.post('/:id/comment', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user._id;
    const { text } = req.body;
    if (!text) return res.status(400).json({ success: false, message: 'Comment text required.' });
    const post = await CommunityPost.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found.' });
    post.comments.push({ user: userId, text, createdAt: new Date() });
    await post.save();
    res.json({ success: true, comments: post.comments.length });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/v1/community/:id
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user._id;
    const post   = await CommunityPost.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found.' });
    if (post.author.toString() !== userId.toString())
      return res.status(403).json({ success: false, message: 'Not authorised.' });
    await post.deleteOne();
    res.json({ success: true, message: 'Post deleted.' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;

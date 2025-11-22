'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSession } from 'next-auth/react';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  featured_image_url: string;
  published_at: string;
  views_count: number;
  likes_count: number;
  comments_count: number;
  tags: string[];
  meta_title: string;
  meta_description: string;
  users: {
    id: string;
    name: string;
  };
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
  users: {
    name: string;
  };
}

export default function BlogPostPage() {
  const params = useParams();
  const router = useRouter();
  const { language } = useLanguage();
  const { user } = useAuth();
  const slug = params.slug as string;

  const [post, setPost] = useState<BlogPost | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  useEffect(() => {
    if (slug) {
      fetchPost();
      fetchComments();
      checkIfLiked();
    }
  }, [slug]);

  const fetchPost = async () => {
    try {
      const response = await fetch(`/api/blog/posts?slug=${slug}`);
      const data = await response.json();
      
      if (data.posts && data.posts.length > 0) {
        setPost(data.posts[0]);
      }
    } catch (error) {
      console.error('Error fetching post:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      const response = await fetch(`/api/blog/comments?post_slug=${slug}`);
      const data = await response.json();
      setComments(data.comments || []);
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const checkIfLiked = async () => {
    if (!user) return;
    
    try {
      const response = await fetch(`/api/blog/likes?post_slug=${slug}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      setIsLiked(data.isLiked || false);
    } catch (error) {
      console.error('Error checking like status:', error);
    }
  };

  const handleLike = async () => {
    if (!user) {
      alert(language === 'mr' ? 'कृपया लॉगिन करा' : language === 'hi' ? 'कृपया लॉगिन करें' : 'Please login');
      return;
    }

    try {
      if (isLiked) {
        await fetch(`/api/blog/likes`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({ post_slug: slug })
        });
        setIsLiked(false);
        setPost(prev => prev ? { ...prev, likes_count: prev.likes_count - 1 } : null);
      } else {
        await fetch(`/api/blog/likes`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({ post_slug: slug })
        });
        setIsLiked(true);
        setPost(prev => prev ? { ...prev, likes_count: prev.likes_count + 1 } : null);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const handleShare = async (platform: string) => {
    if (!post) return;

    const url = window.location.href;
    const text = post.title;

    let shareUrl = '';
    switch (platform) {
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
        break;
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`;
        break;
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
        break;
    }

    if (shareUrl) {
      window.open(shareUrl, '_blank', 'width=600,height=400');
      
      // Track share
      try {
        await fetch('/api/blog/shares', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ post_slug: slug, platform })
        });
      } catch (error) {
        console.error('Error tracking share:', error);
      }
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      alert(language === 'mr' ? 'कृपया लॉगिन करा' : language === 'hi' ? 'कृपया लॉगिन करें' : 'Please login');
      return;
    }

    if (!commentText.trim()) return;

    setSubmittingComment(true);
    try {
      const response = await fetch('/api/blog/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          post_slug: slug,
          content: commentText
        })
      });

      if (response.ok) {
        setCommentText('');
        alert(language === 'mr' 
          ? 'तुमची टिप्पणी मंजुरीसाठी सबमिट केली आहे' 
          : language === 'hi' 
          ? 'आपकी टिप्पणी अनुमोदन के लिए सबमिट की गई है'
          : 'Your comment has been submitted for approval');
      }
    } catch (error) {
      console.error('Error submitting comment:', error);
      alert('Error submitting comment');
    } finally {
      setSubmittingComment(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(language === 'mr' ? 'mr-IN' : 'hi-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-gray-300 rounded w-1/4 mb-8"></div>
            <div className="h-64 bg-gray-300 rounded mb-8"></div>
            <div className="space-y-4">
              <div className="h-4 bg-gray-300 rounded"></div>
              <div className="h-4 bg-gray-300 rounded"></div>
              <div className="h-4 bg-gray-300 rounded w-5/6"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            {language === 'mr' ? 'पोस्ट सापडली नाही' : language === 'hi' ? 'पोस्ट नहीं मिली' : 'Post Not Found'}
          </h1>
          <button
            onClick={() => router.push('/blog')}
            className="text-orange-500 hover:text-orange-600"
          >
            {language === 'mr' ? 'ब्लॉगवर परत जा' : language === 'hi' ? 'ब्लॉग पर वापस जाएं' : 'Back to Blog'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        {/* Back Button */}
        <button
          onClick={() => router.push('/blog')}
          className="text-orange-500 hover:text-orange-600 mb-6 flex items-center gap-2"
        >
          ← {language === 'mr' ? 'परत' : language === 'hi' ? 'वापस' : 'Back'}
        </button>

        {/* Post Header */}
        <article className="bg-white rounded-lg shadow-md overflow-hidden">
          {post.featured_image_url && (
            <img
              src={post.featured_image_url}
              alt={post.title}
              className="w-full h-96 object-cover"
            />
          )}

          <div className="p-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              {post.title}
            </h1>

            <div className="flex items-center justify-between text-sm text-gray-500 mb-6 pb-6 border-b">
              <div className="flex items-center gap-4">
                <span className="font-medium">{post.users?.name}</span>
                <span>{formatDate(post.published_at)}</span>
              </div>
              <div className="flex items-center gap-4">
                <span>👁️ {post.views_count}</span>
                <span>❤️ {post.likes_count}</span>
                <span>💬 {post.comments_count}</span>
              </div>
            </div>

            {/* Tags */}
            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {post.tags.map(tag => (
                  <span
                    key={tag}
                    className="text-sm bg-orange-100 text-orange-600 px-3 py-1 rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Content */}
            <div className="prose max-w-none mb-8">
              <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                {post.content}
              </div>
            </div>

            {/* Like and Share Buttons */}
            <div className="flex items-center gap-4 py-6 border-t border-b">
              <button
                onClick={handleLike}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  isLiked
                    ? 'bg-red-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                ❤️ {isLiked 
                  ? (language === 'mr' ? 'आवडले' : language === 'hi' ? 'पसंद है' : 'Liked')
                  : (language === 'mr' ? 'आवडले' : language === 'hi' ? 'पसंद करें' : 'Like')
                }
              </button>

              <div className="flex items-center gap-2">
                <span className="text-gray-600">
                  {language === 'mr' ? 'शेअर करा:' : language === 'hi' ? 'शेयर करें:' : 'Share:'}
                </span>
                <button
                  onClick={() => handleShare('facebook')}
                  className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  title="Facebook"
                >
                  📘
                </button>
                <button
                  onClick={() => handleShare('twitter')}
                  className="p-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600"
                  title="Twitter"
                >
                  🐦
                </button>
                <button
                  onClick={() => handleShare('whatsapp')}
                  className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                  title="WhatsApp"
                >
                  💬
                </button>
                <button
                  onClick={() => handleShare('linkedin')}
                  className="p-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800"
                  title="LinkedIn"
                >
                  💼
                </button>
              </div>
            </div>

            {/* Comments Section */}
            <div className="mt-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                {language === 'mr' ? 'टिप्पण्या' : language === 'hi' ? 'टिप्पणियाँ' : 'Comments'} ({comments.length})
              </h2>

              {/* Comment Form */}
              <form onSubmit={handleCommentSubmit} className="mb-8">
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder={language === 'mr' 
                    ? 'तुमची टिप्पणी लिहा...' 
                    : language === 'hi' 
                    ? 'अपनी टिप्पणी लिखें...'
                    : 'Write your comment...'}
                  className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  rows={4}
                  required
                />
                <button
                  type="submit"
                  disabled={submittingComment}
                  className="mt-2 bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600 disabled:opacity-50"
                >
                  {submittingComment 
                    ? (language === 'mr' ? 'सबमिट करत आहे...' : language === 'hi' ? 'सबमिट कर रहे हैं...' : 'Submitting...')
                    : (language === 'mr' ? 'टिप्पणी सबमिट करा' : language === 'hi' ? 'टिप्पणी सबमिट करें' : 'Submit Comment')
                  }
                </button>
                <p className="text-sm text-gray-500 mt-2">
                  {language === 'mr' 
                    ? 'तुमची टिप्पणी मंजुरीनंतर प्रदर्शित होईल' 
                    : language === 'hi' 
                    ? 'आपकी टिप्पणी अनुमोदन के बाद प्रदर्शित होगी'
                    : 'Your comment will be displayed after approval'}
                </p>
              </form>

              {/* Comments List */}
              <div className="space-y-6">
                {comments.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    {language === 'mr' 
                      ? 'अद्याप कोणतीही टिप्पणी नाही' 
                      : language === 'hi' 
                      ? 'अभी तक कोई टिप्पणी नहीं'
                      : 'No comments yet'}
                  </p>
                ) : (
                  comments.map(comment => (
                    <div key={comment.id} className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-900">
                          {comment.users?.name}
                        </span>
                        <span className="text-sm text-gray-500">
                          {formatDate(comment.created_at)}
                        </span>
                      </div>
                      <p className="text-gray-700">{comment.content}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </article>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { Card, CardHeader, Button, Alert, Badge, Spinner } from '../ui';
import { postsAPI, type Post } from '../../lib/postsService';
import { PostEditor } from './PostEditor';

export function PostsList() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await postsAPI.list();
      setPosts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load posts');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this post? This cannot be undone.')) {
      return;
    }

    try {
      await postsAPI.delete(id);
      setPosts(posts.filter((p) => p.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete post');
    }
  };

  const handleTogglePublish = async (post: Post) => {
    try {
      const updated = await postsAPI.update(post.id, {
        published: !post.published,
      });
      setPosts(posts.map((p) => (p.id === post.id ? updated : p)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update post');
    }
  };

  const handleExport = async () => {
    const publishedCount = posts.filter((p) => p.published).length;
    if (publishedCount === 0) {
      setError('No published posts to export');
      return;
    }

    try {
      setExporting(true);
      setError(null);
      await postsAPI.export();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export site');
    } finally {
      setExporting(false);
    }
  };

  if (showEditor) {
    return (
      <PostEditor
        post={selectedPost || undefined}
        onSave={async (post) => {
          if (selectedPost) {
            setPosts(posts.map((p) => (p.id === post.id ? post : p)));
          } else {
            setPosts([post, ...posts]);
          }
          setShowEditor(false);
          setSelectedPost(null);
          await loadPosts();
        }}
        onCancel={() => {
          setShowEditor(false);
          setSelectedPost(null);
        }}
      />
    );
  }

  const published = posts.filter((p) => p.published);
  const drafts = posts.filter((p) => !p.published);

  return (
    <div className="space-y-3">
      {error && (
        <Alert
          variant="danger"
          dismissible
          onDismiss={() => setError(null)}
          className="mb-2"
        >
          {error}
        </Alert>
      )}

      <Card variant="gradient" padding="md">
        <CardHeader
          title="Posts"
          action={
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setSelectedPost(null);
                setShowEditor(true);
              }}
            >
              New Post
            </Button>
          }
        />
      </Card>

      {/* Export Section */}
      {published.length > 0 && (
        <Card variant="gradient" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-surface-100">Export Site</h3>
              <p className="text-sm text-surface-400 mt-1">
                Download all published posts as a static HTML site
              </p>
            </div>
            <Button
              variant="primary"
              size="sm"
              loading={exporting}
              onClick={handleExport}
            >
              Export as ZIP
            </Button>
          </div>
        </Card>
      )}

      {loading ? (
        <Card variant="gradient" padding="md">
          <div className="flex justify-center py-8">
            <Spinner size="lg" />
          </div>
        </Card>
      ) : posts.length === 0 ? (
        <Card variant="gradient" padding="md">
          <p className="text-center text-surface-500 text-caption py-4">
            No posts yet. Create one above!
          </p>
        </Card>
      ) : (
        <>
          {/* Published Posts */}
          {published.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-surface-300 mb-2 px-3">
                Published ({published.length})
              </h3>
              <div className="space-y-2">
                {published.map((post) => (
                  <Card key={post.id} variant="outlined" padding="md" hoverable>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-surface-100 truncate">
                            {post.title}
                          </h4>
                          <Badge variant="success" size="sm">
                            Published
                          </Badge>
                        </div>
                        <p className="text-xs text-surface-500">
                          {post.slug} •{' '}
                          {new Date(post.created_at).toLocaleDateString()}
                        </p>
                        {post.excerpt && (
                          <p className="text-sm text-surface-400 mt-1 line-clamp-2">
                            {post.excerpt}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedPost(post);
                            setShowEditor(true);
                          }}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleTogglePublish(post)}
                        >
                          Unpublish
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleDelete(post.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Draft Posts */}
          {drafts.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-surface-300 mb-2 px-3">
                Drafts ({drafts.length})
              </h3>
              <div className="space-y-2">
                {drafts.map((post) => (
                  <Card key={post.id} variant="outlined" padding="md" hoverable>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-surface-100 truncate">
                            {post.title}
                          </h4>
                          <Badge variant="default" size="sm">
                            Draft
                          </Badge>
                        </div>
                        <p className="text-xs text-surface-500">
                          {post.slug} •{' '}
                          {new Date(post.created_at).toLocaleDateString()}
                        </p>
                        {post.excerpt && (
                          <p className="text-sm text-surface-400 mt-1 line-clamp-2">
                            {post.excerpt}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedPost(post);
                            setShowEditor(true);
                          }}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleTogglePublish(post)}
                        >
                          Publish
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleDelete(post.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

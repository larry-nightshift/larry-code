import { useState, useEffect } from 'react';
import { marked } from 'marked';
import { Card, CardHeader, Button, Input, Textarea, Alert } from '../ui';
import { postsAPI, type Post } from '../../lib/postsService';

interface PostEditorProps {
  post?: Post;
  onSave: (post: Post) => void;
  onCancel: () => void;
}

export function PostEditor({ post, onSave, onCancel }: PostEditorProps) {
  const [title, setTitle] = useState(post?.title || '');
  const [slug, setSlug] = useState(post?.slug || '');
  const [markdown, setMarkdown] = useState(post?.body_markdown || '');
  const [excerpt, setExcerpt] = useState(post?.excerpt || '');
  const [published, setPublished] = useState(post?.published || false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [renderError, setRenderError] = useState<string | null>(null);
  const [html, setHtml] = useState('');

  useEffect(() => {
    renderMarkdown(markdown);
  }, [markdown]);

  const renderMarkdown = async (text: string) => {
    try {
      setRenderError(null);
      const html = await marked(text);
      setHtml(html);
    } catch (err) {
      setRenderError('Failed to render markdown');
      setHtml('');
    }
  };

  const handleSave = async () => {
    // Validation
    if (!title.trim()) {
      setError('Title is required');
      return;
    }
    if (!slug.trim()) {
      setError('Slug is required');
      return;
    }
    if (!markdown.trim()) {
      setError('Content is required');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      let savedPost: Post;
      if (post) {
        savedPost = await postsAPI.update(post.id, {
          title,
          slug,
          body_markdown: markdown,
          excerpt,
          published,
        });
      } else {
        savedPost = await postsAPI.create({
          title,
          slug,
          body_markdown: markdown,
          excerpt,
          published,
        });
      }

      onSave(savedPost);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save post');
    } finally {
      setLoading(false);
    }
  };

  // Auto-generate slug from title
  const handleTitleChange = (value: string) => {
    setTitle(value);
    if (!post) {
      // Only auto-generate if creating new post and slug hasn't been manually edited
      const autoSlug = value
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-');
      setSlug(autoSlug);
    }
  };

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

      {/* Header Card */}
      <Card variant="gradient" padding="md">
        <CardHeader
          title={post ? 'Edit Post' : 'New Post'}
          action={
            <div className="flex gap-1.5">
              <Button
                variant="ghost"
                size="sm"
                onClick={onCancel}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                loading={loading}
                onClick={handleSave}
              >
                {post ? 'Update' : 'Create'}
              </Button>
            </div>
          }
        />
      </Card>

      {/* Editor Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Left Column - Input */}
        <Card variant="gradient" padding="md">
          <div className="space-y-3">
            <Input
              label="Title"
              placeholder="Post title..."
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              disabled={loading}
            />

            <Input
              label="Slug"
              placeholder="post-slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              hint="URL-friendly identifier (lowercase, hyphens only)"
              disabled={loading}
            />

            <Textarea
              label="Excerpt"
              placeholder="Optional summary of the post"
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              rows={2}
              disabled={loading}
            />

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="published"
                checked={published}
                onChange={(e) => setPublished(e.target.checked)}
                disabled={loading}
                className="cursor-pointer"
              />
              <label htmlFor="published" className="text-sm text-surface-300 cursor-pointer">
                Publish this post
              </label>
            </div>

            <Textarea
              label="Markdown Content"
              placeholder="# Heading

Write your content in **markdown**. It will be rendered on the right.

- Bullet points
- Are supported

[Links](https://example.com) and `code` too!"
              value={markdown}
              onChange={(e) => setMarkdown(e.target.value)}
              rows={12}
              disabled={loading}
            />
          </div>
        </Card>

        {/* Right Column - Preview */}
        <Card variant="gradient" padding="md">
          <CardHeader title="Live Preview" />
          {renderError ? (
            <Alert variant="warning" className="mt-2">
              {renderError}
            </Alert>
          ) : !html ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-surface-500 text-caption">Start writing to see preview...</p>
            </div>
          ) : (
            <div className="prose prose-invert max-w-none text-sm">
              <div
                className="mt-3 space-y-2 text-surface-300 leading-relaxed"
                dangerouslySetInnerHTML={{
                  __html: html,
                }}
              />
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

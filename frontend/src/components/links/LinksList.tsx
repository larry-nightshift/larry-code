import { useEffect, useState, useCallback } from 'react';
import { linksService } from '../../api/linksService';
import type { Link, Tag, Collection } from '../../api/linksService';
import { Button, Input, Select, Alert, Card, CardHeader, Dialog, Spinner } from '../ui';
import LinkCard from './LinkCard';

export default function LinksList() {
  const [links, setLinks] = useState<Link[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<string>('');
  const [queuedOnly, setQueuedOnly] = useState(false);
  const [tags, setTags] = useState<Tag[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [newLinkUrl, setNewLinkUrl] = useState('');
  const [newLinkTitle, setNewLinkTitle] = useState('');
  const [creatingLink, setCreatingLink] = useState(false);
  const [duplicateLink, setDuplicateLink] = useState<Link | null>(null);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const loadLinks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params: any = {
        q: searchQuery || undefined,
        collection_id: selectedCollection || undefined,
        queued: queuedOnly || undefined,
        page,
        page_size: 20,
      };

      if (selectedTags.length > 0) {
        params.tag = selectedTags;
      }

      const response = await linksService.getLinks(params);
      setLinks(response.results);
      setTotalCount(response.count);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load links');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedTags, selectedCollection, queuedOnly, page]);

  const loadTags = useCallback(async () => {
    try {
      const data = await linksService.getTags();
      setTags(data);
    } catch (err) {
      console.error('Failed to load tags:', err);
    }
  }, []);

  const loadCollections = useCallback(async () => {
    try {
      const data = await linksService.getCollections();
      setCollections(data);
    } catch (err) {
      console.error('Failed to load collections:', err);
    }
  }, []);

  useEffect(() => {
    loadLinks();
  }, [loadLinks]);

  useEffect(() => {
    loadTags();
    loadCollections();
  }, [loadTags, loadCollections]);

  const handleCreateLink = async () => {
    if (!newLinkUrl.trim()) return;

    try {
      setCreatingLink(true);
      setError(null);
      setDuplicateLink(null);

      const result = await linksService.createLink({
        url: newLinkUrl,
        title: newLinkTitle || undefined,
      });

      if ('detail' in result && result.detail === 'Link already exists') {
        setDuplicateLink(result.existing_link);
        return;
      }

      setNewLinkUrl('');
      setNewLinkTitle('');
      setPage(1);
      await loadLinks();
    } catch (err) {
      if (typeof err === 'object' && err && 'status' in err && err.status === 409) {
        // Duplicate link - handled above
        return;
      }
      setError(err instanceof Error ? err.message : 'Failed to create link');
    } finally {
      setCreatingLink(false);
    }
  };

  const handleDeleteLink = async (linkId: string) => {
    try {
      setError(null);
      await linksService.deleteLink(linkId);
      await loadLinks();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete link');
    }
  };

  const handleQueueLink = async (linkId: string, priority: number = 3) => {
    try {
      setError(null);
      await linksService.queueLink(linkId, priority);
      await loadLinks();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to queue link');
    }
  };

  const handleUnqueueLink = async (linkId: string) => {
    try {
      setError(null);
      await linksService.unqueueLink(linkId);
      await loadLinks();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to unqueue link');
    }
  };

  const totalPages = Math.ceil(totalCount / 20);

  return (
    <div className="space-y-4">
      {error && (
        <Alert
          variant="danger"
          title="Error"
          dismissible
          onDismiss={() => setError(null)}
        >
          {error}
        </Alert>
      )}

      {/* Add Link Card */}
      <Card padding="md" variant="gradient" hoverable>
        <CardHeader title="Add Link" />
        <div className="space-y-2">
          <Input
            label="URL"
            placeholder="https://example.com/article"
            value={newLinkUrl}
            onChange={(e) => setNewLinkUrl(e.target.value)}
          />
          <Input
            label="Title (optional)"
            placeholder="Article title"
            value={newLinkTitle}
            onChange={(e) => setNewLinkTitle(e.target.value)}
          />
          <Button
            onClick={handleCreateLink}
            loading={creatingLink}
            fullWidth
          >
            Save Link
          </Button>
        </div>
      </Card>

      {/* Duplicate Link Dialog */}
      {duplicateLink && (
        <Dialog
          open={!!duplicateLink}
          onClose={() => setDuplicateLink(null)}
          title="Link Already Saved"
        >
          <p className="text-surface-300 mb-3">
            You've already saved this link:
          </p>
          <p className="font-semibold text-surface-100 mb-4">
            {duplicateLink.title || duplicateLink.url}
          </p>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={() => setDuplicateLink(null)}
            >
              OK
            </Button>
          </div>
        </Dialog>
      )}

      {/* Filters */}
      <Card padding="md">
        <CardHeader title="Filters" />
        <div className="space-y-2">
          <Input
            label="Search"
            placeholder="Search links..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
          />
          <div className="grid grid-cols-2 gap-2">
            <Select
              label="Collection"
              placeholder="All collections"
              options={[
                { value: '', label: 'All collections' },
                ...collections.map((c) => ({ value: c.id, label: c.name })),
              ]}
              value={selectedCollection}
              onChange={(e) => {
                setSelectedCollection(e.target.value);
                setPage(1);
              }}
            />
            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={queuedOnly}
                  onChange={(e) => {
                    setQueuedOnly(e.target.checked);
                    setPage(1);
                  }}
                  className="w-4 h-4"
                />
                <span className="text-caption text-surface-300">Queued only</span>
              </label>
            </div>
          </div>
          {tags.length > 0 && (
            <div>
              <label className="block text-caption font-medium text-surface-300 mb-2">
                Tags
              </label>
              <div className="flex flex-wrap gap-1">
                {tags.map((tag) => (
                  <button
                    key={tag.id}
                    onClick={() => {
                      setSelectedTags(
                        selectedTags.includes(tag.id)
                          ? selectedTags.filter((t) => t !== tag.id)
                          : [...selectedTags, tag.id]
                      );
                      setPage(1);
                    }}
                    className={`px-2.5 py-0.5 rounded text-small font-medium transition-base ${
                      selectedTags.includes(tag.id)
                        ? 'bg-primary-500 text-white'
                        : 'bg-surface-700 text-surface-400 hover:bg-surface-600'
                    }`}
                  >
                    {tag.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Links List */}
      {loading ? (
        <div className="flex justify-center py-8">
          <Spinner size="lg" />
        </div>
      ) : links.length === 0 ? (
        <Card padding="md">
          <p className="text-center text-surface-500">
            No links found. Start by adding one above!
          </p>
        </Card>
      ) : (
        <>
          <div className="space-y-2">
            {links.map((link) => (
              <LinkCard
                key={link.id}
                link={link}
                onDelete={() => handleDeleteLink(link.id)}
                onQueue={() => handleQueueLink(link.id)}
                onUnqueue={() => handleUnqueueLink(link.id)}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-4">
              <Button
                variant="ghost"
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
              >
                Previous
              </Button>
              <span className="text-caption text-surface-400 flex items-center">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="ghost"
                disabled={page === totalPages}
                onClick={() => setPage(page + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

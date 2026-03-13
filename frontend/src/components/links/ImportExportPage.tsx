import { useState } from 'react';
import { linksService } from '../../api/linksService';
import { Button, Alert, Card, CardHeader, Textarea } from '../ui';

export default function ImportExportPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [importJson, setImportJson] = useState('');
  const [importErrors, setImportErrors] = useState<any[]>([]);
  const [importStats, setImportStats] = useState<{
    created: number;
    total: number;
  } | null>(null);

  const handleExport = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const data = await linksService.exportLinks();

      // Create and download JSON file
      const element = document.createElement('a');
      const file = new Blob([JSON.stringify(data.links, null, 2)], {
        type: 'application/json',
      });
      element.href = URL.createObjectURL(file);
      element.download = `links-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);

      setSuccess('Links exported successfully!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export links');
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (!importJson.trim()) {
      setError('Please paste JSON data to import');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      setImportErrors([]);

      const links = JSON.parse(importJson);
      if (!Array.isArray(links)) {
        setError('JSON must be an array of links');
        return;
      }

      const result = await linksService.importLinks(links);

      setImportStats({
        created: result.created,
        total: result.total_rows,
      });

      if (result.errors.length > 0) {
        setImportErrors(result.errors);
        setError(
          `Imported ${result.created}/${result.total_rows} links. Some rows had errors.`
        );
      } else {
        setSuccess(`Successfully imported ${result.created} links!`);
        setImportJson('');
      }
    } catch (err) {
      if (err instanceof SyntaxError) {
        setError('Invalid JSON format');
      } else {
        setError(err instanceof Error ? err.message : 'Failed to import links');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 max-w-2xl">
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

      {success && (
        <Alert
          variant="success"
          title="Success"
          dismissible
          onDismiss={() => setSuccess(null)}
        >
          {success}
        </Alert>
      )}

      {/* Export Section */}
      <Card padding="md" variant="gradient">
        <CardHeader title="Export Links" />
        <p className="text-caption text-surface-400 mb-3">
          Download all your links as a JSON file for backup or import into another
          tool.
        </p>
        <Button onClick={handleExport} loading={loading} fullWidth>
          {loading ? 'Exporting...' : 'Export to JSON'}
        </Button>
      </Card>

      {/* Import Section */}
      <Card padding="md">
        <CardHeader title="Import Links" />
        <p className="text-caption text-surface-400 mb-3">
          Paste JSON data here to import links. The JSON should be an array of link
          objects.
        </p>

        <Textarea
          label="JSON Data"
          placeholder={`[
  {"url": "https://example.com", "title": "Example"},
  {"url": "https://another.com", "title": "Another"}
]`}
          value={importJson}
          onChange={(e) => setImportJson(e.target.value)}
          rows={8}
        />

        <Button
          onClick={handleImport}
          loading={loading}
          fullWidth
          className="mt-2"
        >
          {loading ? 'Importing...' : 'Import Links'}
        </Button>

        {importStats && (
          <div className="mt-3 p-2 bg-surface-800 rounded border border-surface-700">
            <p className="text-caption text-surface-300">
              Import Summary: {importStats.created} of {importStats.total} links
              imported successfully.
            </p>
          </div>
        )}

        {importErrors.length > 0 && (
          <div className="mt-3 p-2 bg-danger-500/10 rounded border border-danger-500/20">
            <p className="text-caption font-medium text-danger-400 mb-1">
              Errors found:
            </p>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {importErrors.map((error, idx) => (
                <div key={idx} className="text-caption text-danger-300">
                  Row {error.row}: {Object.values(error.errors)[0]}
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* Format Guide */}
      <Card padding="md">
        <CardHeader title="Import Format" />
        <p className="text-caption text-surface-400 mb-2">
          Use this format for importing links:
        </p>
        <pre className="bg-surface-800 p-2 rounded text-caption text-surface-300 overflow-x-auto">
          {`[
  {
    "url": "https://example.com/article",
    "title": "Article Title",
    "description": "Optional description",
    "notes": "Optional notes",
    "collection": "optional-collection-id"
  }
]`}
        </pre>
      </Card>
    </div>
  );
}

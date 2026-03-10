import { useState } from 'react';
import { Dialog, Input, Textarea, Button } from '../ui';

interface RecordModalProps {
  taskId: string;
  onClose: () => void;
  onSubmit: (taskId: string, completedDate: string, notes?: string, cost?: string) => void;
}

export function RecordModal({ taskId, onClose, onSubmit }: RecordModalProps) {
  const [completedDate, setCompletedDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [cost, setCost] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!completedDate) {
      setError('Please select a completion date');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(taskId, completedDate, notes || undefined, cost || undefined);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={true} onClose={onClose} title="Mark Task Complete">
      <form onSubmit={handleSubmit} className="space-y-3">
        {error && (
          <div className="p-3 bg-danger-500/10 border border-danger-500/30 rounded-lg text-danger-300 text-caption">
            {error}
          </div>
        )}

        <Input
          label="Completed Date"
          type="date"
          value={completedDate}
          onChange={(e) => setCompletedDate(e.target.value)}
          required
        />

        <Textarea
          label="Notes (optional)"
          placeholder="Add any notes about this completion..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
        />

        <Input
          label="Cost (optional)"
          type="number"
          placeholder="0.00"
          value={cost}
          onChange={(e) => setCost(e.target.value)}
          step="0.01"
        />

        <div className="flex gap-1.5 pt-2">
          <Button
            variant="primary"
            type="submit"
            fullWidth
            loading={isSubmitting}
          >
            Mark Complete
          </Button>
          <Button
            variant="ghost"
            type="button"
            fullWidth
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

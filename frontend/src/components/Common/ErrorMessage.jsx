// ErrorMessage — graceful failure UI with optional retry (SRS NFR-9).

import Button from './Button';

export default function ErrorMessage({ message, onRetry }) {
  return (
    <div className="mx-auto my-10 max-w-lg rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
      <p className="font-semibold text-red-700">Something went wrong</p>
      <p className="mt-1 text-sm text-red-600">{message || 'Unable to load data. Please try again.'}</p>
      {onRetry && (
        <Button variant="danger" size="sm" className="mt-4" onClick={onRetry}>
          Retry
        </Button>
      )}
    </div>
  );
}

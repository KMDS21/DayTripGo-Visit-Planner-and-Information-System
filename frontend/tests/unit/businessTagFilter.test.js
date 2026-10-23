// Unit — the Explore "Businesses" tag filter: one tag at a time, "All" clears.
// Written with createElement rather than JSX: the suite files are plain .js
// and are not transpiled for JSX.

import { describe, test, expect, vi, afterEach } from 'vitest';
import { createElement as h } from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import BusinessTagFilter from '../../src/components/BusinessListing/BusinessTagFilter';
import StatusBadge from '../../src/components/BusinessListing/StatusBadge';

// Vitest runs without globals here, so Testing Library cannot register its
// own afterEach — without this the DOM accumulates and queries match twice.
afterEach(cleanup);

const TAGS = [
  { category_id: 1, category_name: 'Restaurant' },
  { category_id: 2, category_name: 'Hotel' },
  { category_id: 6, category_name: 'Vehicle Rental' },
];

const filter = (props) => h(BusinessTagFilter, { onSelect: () => {}, ...props });

describe('BusinessTagFilter', () => {
  test('renders All plus every tag in the list', () => {
    render(filter({ tags: TAGS, activeTag: null }));
    expect(screen.getByRole('button', { name: 'All' })).toBeInTheDocument();
    for (const tag of TAGS) {
      expect(screen.getByRole('button', { name: tag.category_name })).toBeInTheDocument();
    }
  });

  test('clicking a tag reports that tag id', () => {
    const onSelect = vi.fn();
    render(filter({ tags: TAGS, activeTag: null, onSelect }));

    fireEvent.click(screen.getByRole('button', { name: 'Vehicle Rental' }));
    expect(onSelect).toHaveBeenCalledWith(6);
  });

  test('clicking the active tag clears the filter, and so does All', () => {
    const onSelect = vi.fn();
    const { rerender } = render(filter({ tags: TAGS, activeTag: 2, onSelect }));

    fireEvent.click(screen.getByRole('button', { name: 'Hotel' }));
    expect(onSelect).toHaveBeenCalledWith(null);

    fireEvent.click(screen.getByRole('button', { name: 'All' }));
    expect(onSelect).toHaveBeenLastCalledWith(null);

    // With nothing active, All is the pressed one.
    rerender(filter({ tags: TAGS, activeTag: null, onSelect }));
    expect(screen.getByRole('button', { name: 'All' })).toHaveAttribute('aria-pressed', 'true');
  });

  test('only the active tag is marked pressed', () => {
    render(filter({ tags: TAGS, activeTag: 1 }));
    expect(screen.getByRole('button', { name: 'Restaurant' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Hotel' })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('button', { name: 'All' })).toHaveAttribute('aria-pressed', 'false');
  });
});

describe('StatusBadge', () => {
  test('says Live for a published listing and Pending otherwise', () => {
    const { rerender } = render(h(StatusBadge, { published: true }));
    expect(screen.getByText('Live')).toBeInTheDocument();

    rerender(h(StatusBadge, { published: false }));
    expect(screen.getByText('Pending')).toBeInTheDocument();
    expect(screen.queryByText('Live')).not.toBeInTheDocument();
  });
});

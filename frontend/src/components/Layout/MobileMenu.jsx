// MobileMenu — hamburger-triggered slide-over drawer for the public header.
// Shown below md; the desktop Navbar takes over from md upwards.
// Closes on Escape, backdrop tap, link tap, or the close button, and locks
// body scroll while open (same behavior as the shared Modal).
//
// IMPORTANT: the backdrop + panel are portalled to document.body. The header
// uses `backdrop-blur`, and a backdrop-filter ancestor becomes the containing
// block for position:fixed descendants — without the portal the drawer would
// be clipped to the ~56px header strip instead of covering the viewport.

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, NavLink } from 'react-router-dom';
import { useVisitPlan } from '../../hooks/useVisitPlan';

const links = [
  { to: '/', label: 'Home', end: true },
  { to: '/explore', label: 'Explore places' },
  { to: '/visit-plan', label: 'My Day Plan' },
  { to: '/contact', label: 'Contact us' },
];

export default function MobileMenu() {
  const { count } = useVisitPlan();
  const [open, setOpen] = useState(false);
  const panelRef = useRef(null);

  // Close on Escape and lock background scroll while open.
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open]);

  // Move focus into the panel when it opens (keyboard users).
  useEffect(() => {
    if (open) panelRef.current?.querySelector('a, button')?.focus?.();
  }, [open]);

  return (
    <div className="md:hidden">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        aria-expanded={open}
        aria-controls="mobile-menu"
        className="flex h-11 w-11 items-center justify-center rounded-xl border border-border text-foreground transition-colors hover:bg-muted"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <path d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {createPortal(
        <>
          {/* Backdrop */}
          {open && (
            <div
              className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
              onClick={() => setOpen(false)}
              aria-hidden="true"
            />
          )}

          {/* Drawer — solid background so it never blends with page content.
              The nav list is the only scroll area, which keeps the plan CTA
              pinned at the bottom and inside the viewport even on short
              (landscape) phone screens. */}
          <div
            id="mobile-menu"
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label="Site menu"
            inert={!open}
            className={`fixed inset-y-0 right-0 z-[70] flex w-72 max-w-[85vw] flex-col overflow-hidden border-l border-border bg-background p-5 shadow-2xl transition-transform duration-300 ease-out ${
              open ? 'translate-x-0' : 'translate-x-full'
            }`}
          >
            <div className="flex shrink-0 items-center justify-between">
              <span className="font-heading text-lg font-bold tracking-tight">
                DayTrip<span className="text-brand">GO</span>
              </span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="flex h-11 w-11 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* min-h-0 lets this flex child shrink and scroll on short screens */}
            <nav className="mt-6 min-h-0 flex-1 space-y-1 overflow-y-auto" aria-label="Mobile">
              {links.map((l) => (
                <NavLink
                  key={l.to}
                  to={l.to}
                  end={l.end}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center justify-between rounded-xl px-4 py-3.5 text-base font-semibold transition-colors ${
                      isActive ? 'bg-brand-light text-brand-dark' : 'text-foreground hover:bg-muted'
                    }`
                  }
                >
                  <span>{l.label}</span>
                  {l.to === '/visit-plan' && count > 0 && (
                    <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-brand px-2 text-xs font-bold text-white">
                      {count}
                    </span>
                  )}
                </NavLink>
              ))}
            </nav>

            <Link
              to="/visit-plan"
              onClick={() => setOpen(false)}
              className="mt-4 shrink-0 rounded-2xl bg-brand px-4 py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-brand-dark safe-b"
            >
              Let&apos;s plan your tour
            </Link>
          </div>
        </>,
        document.body,
      )}
    </div>
  );
}

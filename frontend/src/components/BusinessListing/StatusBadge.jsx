// StatusBadge — approval state of an owner listing: Live (published) or
// Pending (waiting for an admin). Shared by the dashboard and the list page.

export default function StatusBadge({ published }) {
  return published ? (
    <span className="rounded-full bg-brand px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-white">
      Live
    </span>
  ) : (
    <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-amber-800">
      Pending
    </span>
  );
}

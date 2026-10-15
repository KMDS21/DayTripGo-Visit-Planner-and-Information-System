// ContactPage — /contact: who runs DayTripGO and how to reach them.
// Static information page (no backend endpoint; planning-only service).

const details = [
  {
    label: 'Address',
    value: 'No. 12, Galle Road, Wadduwa',
    hint: 'Kalutara District, Western Province, Sri Lanka',
  },
  {
    label: 'Email',
    value: 'hello@daytripgo.lk',
    hint: 'General enquiries and place suggestions',
  },
  {
    label: 'Phone',
    value: '+94 11 234 5678',
    hint: 'Monday to Friday, 9:00 – 17:00',
  },
  {
    label: 'Opening hours',
    value: 'Mon – Sat · 9:00 – 18:00',
    hint: 'Closed on Sundays and public holidays',
  },
];

export default function ContactPage() {
  return (
    <div className="space-y-10 pb-8">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-b-[2.5rem] bg-gradient-to-br from-brand-dark via-brand to-teal-500 px-6 py-14 text-white sm:py-16">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="font-heading text-4xl font-bold sm:text-5xl">Contact us</h1>
          <p className="mx-auto mt-4 max-w-xl text-base text-white/85 sm:text-lg">
            Questions about a place, a correction to an opening time, or a spot we should
            feature? DayTripGO is run from Wadduwa and we are happy to hear from visitors.
          </p>
        </div>
        <div aria-hidden="true" className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/10" />
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-16 -left-16 h-56 w-56 rounded-full bg-white/10" />
      </section>

      {/* Contact details */}
      <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {details.map((d) => (
          <div key={d.label} className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wide text-brand">{d.label}</p>
            <p className="mt-2 font-heading text-lg font-bold leading-snug">{d.value}</p>
            <p className="mt-1 text-sm text-muted-foreground">{d.hint}</p>
          </div>
        ))}
      </section>

      {/* Who we are + scope note */}
      <section className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h2 className="font-heading text-xl font-bold">About DayTripGO</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            DayTripGO is a visitor information service for the Wadduwa area of Sri Lanka. We
            keep a verified list of places of interest within 25 km of Wadduwa — beaches,
            temples, heritage houses and gardens — with opening times, distances and practical
            tips, and we help you assemble them into a simple one-day plan.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Operated as the ITE2953 Programming Group Project (E2410884 · De Silva P.K.M.).
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-muted/40 p-6">
          <h2 className="font-heading text-xl font-bold">Good to know</h2>
          <ul className="mt-3 space-y-2 text-sm leading-relaxed text-muted-foreground">
            <li>• DayTripGO is planning-only — we do not take bookings or payments.</li>
            <li>• Suggest a place by email and our team will verify it before listing.</li>
            <li>• Found wrong hours or details? Tell us the place name and we will fix it.</li>
          </ul>
          <p className="mt-4 text-sm font-semibold text-foreground">
            Ready to build a day? Head to{' '}
            <a href="/explore" className="text-brand underline underline-offset-4">
              Explore places
            </a>
            .
          </p>
        </div>
      </section>
    </div>
  );
}

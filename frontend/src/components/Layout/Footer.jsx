// Footer — project footer (ITE2953 / E2410884).

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-border bg-muted/40">
      <div className="flex w-full flex-col items-center gap-2 px-4 py-8 text-center text-sm text-muted-foreground sm:px-6 lg:px-10">
        <p>
          <span className="font-semibold text-foreground">DayTripGO</span> — places of interest within 25 km of
          Wadduwa, Sri Lanka.
        </p>
        <p>
          Visit planning only — no booking or payment services (that is deliberately out of scope). ITE2953
          Programming Group Project · E2410884 · De Silva P.K.M.
        </p>
      </div>
    </footer>
  );
}

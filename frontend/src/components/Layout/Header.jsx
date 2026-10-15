// Header — DayTripGO brand bar with navigation.

import { Link } from 'react-router-dom';
import Navbar from './Navbar';

export default function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur">
      <div className="flex w-full items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-10">
        <Link to="/" className="flex items-center gap-2.5">
          <img src="/favicon.svg" alt="" className="h-9 w-9" />
          <span className="font-heading text-xl font-bold tracking-tight">
            DayTrip<span className="text-brand">GO</span>
          </span>
        </Link>
        <Navbar />
      </div>
    </header>
  );
}

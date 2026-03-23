import Link from "next/link";

export function DesktopHeaderTitle() {
  return (
    <div className="hidden md:flex">
      <Link href="/" className="font-semibold inline-link">
        Sip Fest Passport
      </Link>
    </div>
  );
}

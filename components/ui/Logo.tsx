import Link from 'next/link';

export default function Logo() {
  return (
    <Link 
      href="/" 
      className="text-xl font-bold text-blue-600 hover:text-blue-700 transition-colors"
      aria-label="SteamRecs.io home"
    >
      SteamRecs.io
    </Link>
  );
}

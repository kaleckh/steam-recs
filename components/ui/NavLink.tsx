import Link from 'next/link';

interface NavLinkProps {
  href: string;
  children: React.ReactNode;
  onClick?: () => void;
}

export default function NavLink({ href, children, onClick }: NavLinkProps) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="text-gray-700 hover:text-blue-600 transition-colors font-medium px-3 py-2 rounded-md hover:bg-blue-50"
    >
      {children}
    </Link>
  );
}

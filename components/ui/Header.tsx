import Logo from './Logo';
import NavLink from './NavLink';
import MobileMenu from './MobileMenu';

const NAV_ITEMS = [
  { href: '/', label: 'Home' },
  { href: '/profile', label: 'My Profile' },
  { href: '/discover', label: 'Discover' },
  { href: '/stats', label: 'Stats' },
  { href: '/challenge', label: 'Challenge' },
];

export default function Header() {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Logo />
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1" role="navigation">
            {NAV_ITEMS.map((item) => (
              <NavLink key={item.href} href={item.href}>
                {item.label}
              </NavLink>
            ))}
          </nav>

          {/* CTA Button */}
          <div className="hidden md:block">
            <a
              href="/profile"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2"
            >
              Get Recommendations
            </a>
          </div>

          {/* Mobile Menu */}
          <MobileMenu navItems={NAV_ITEMS} />
        </div>
      </div>
    </header>
  );
}

import { AvatarDropdown } from './avatar-dropdown';
import { Link } from 'react-router';

export function Header() {
  return (
    <header className="border-b bg-background">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-2">
        {/* Left side */}
        <div className="flex items-center gap-6">
          <span className="text-lg font-semibold">Refract</span>

          <nav className="hidden md:flex gap-4 text-sm text-muted-foreground">
            <Link to="/" className="hover:text-foreground">
              Dashboard
            </Link>
            <Link to="/items/all" className="hover:text-foreground">
              Database View
            </Link>
          </nav>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-4">
          <AvatarDropdown />
        </div>
      </div>
    </header>
  );
}

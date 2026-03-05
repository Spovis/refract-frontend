import { AvatarDropdown } from './avatar-dropdown';

export function Header() {
  return (
    <header className="border-b bg-background">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-2">
        {/* Left side */}
        <div className="flex items-center gap-6">
          <span className="text-lg font-semibold">Refract</span>

          <nav className="hidden md:flex gap-4 text-sm text-muted-foreground">
            <a href="/dashboard" className="hover:text-foreground">
              Dashboard
            </a>
            <a href="/items/all" className="hover:text-foreground">
              Database View
            </a>
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

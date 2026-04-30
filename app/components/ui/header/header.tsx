import RefractLogoComponent from '~/src/RefractLogo';
import { AvatarDropdown } from './avatar-dropdown';
import { Link, useLocation } from 'react-router';

const baseTabClassName = 'text-brownish border border-gray-200 px-12 py-3 rounded-md'
const activeTabClassName = 'font-semibold'
const inactiveTabClassName = 'bg-gray-100 hover:bg-lightgray'

export function Header() {
  const location = useLocation();
  const isDashboardActive = location.pathname.match(/^\/items\/\d+$/) || location.pathname === '/';
  const isDatabaseViewActive = location.pathname === '/items/all';

  return (
    <header className="border-b bg-background">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4">
        {/* Left side */}
        <div className="flex items-center gap-6">
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-2">
              <RefractLogoComponent />
              <p className="text-2xl font-">Refract</p>
            </div>
            <p className='text-xs'>by Lightcast</p>
          </div>

          <nav className="hidden md:flex gap-4 text-sm text-muted-foreground">
            <Link to="/">
              <p className={`${baseTabClassName} ${isDashboardActive ? activeTabClassName : inactiveTabClassName}`}>
                Dashboard
              </p>
            </Link>
            <Link to="/items/all">
              <p className={`${baseTabClassName} ${isDatabaseViewActive ? activeTabClassName : inactiveTabClassName}`}>
                Database View
              </p>
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

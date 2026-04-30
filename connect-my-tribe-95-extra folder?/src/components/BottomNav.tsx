import { NavLink, useLocation } from "react-router-dom";
import { Home, Calendar, Users2, Search, UserCircle } from "lucide-react";

const navItems = [
  { to: "/", icon: Home, label: "Home" },
  { to: "/events", icon: Calendar, label: "Events" },
  { to: "/groups", icon: Users2, label: "Groups" },
  { to: "/people", icon: Search, label: "People" },
  { to: "/profile", icon: UserCircle, label: "Profile" },
];

export function BottomNav() {
  const location = useLocation();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-card border-t border-border">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map(({ to, icon: Icon, label }) => {
          const isActive = location.pathname === to || (to !== "/" && location.pathname.startsWith(to));
          return (
            <NavLink
              key={to}
              to={to}
              className={`flex flex-col items-center gap-1 px-3 py-1 text-xs font-medium transition-colors ${
                isActive ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <Icon size={20} />
              {label}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}

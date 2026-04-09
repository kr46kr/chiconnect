import { store } from "@/lib/store";
import { useViewMode } from "@/hooks/use-store";
import { useAuth } from "@/hooks/use-auth";
import { Shield, User } from "lucide-react";
import { motion } from "framer-motion";

const ADMIN_EMAIL = "test123@gmail.com";

export function ViewToggle() {
  const viewMode = useViewMode();
  
  if (!store.isAdmin()) {
    return null;
  }

  return (
    <div className="flex items-center bg-secondary rounded-lg p-1 gap-0.5">
      <button
        onClick={() => store.setViewMode('user')}
        className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
          viewMode === 'user' ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        {viewMode === 'user' && (
          <motion.div
            layoutId="viewToggle"
            className="absolute inset-0 bg-card rounded-md"
            style={{ boxShadow: 'var(--card-shadow)' }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
          />
        )}
        <span className="relative z-10 flex items-center gap-1.5"><User size={14} /> User</span>
      </button>
      <button
        onClick={() => store.setViewMode('admin')}
        className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
          viewMode === 'admin' ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        {viewMode === 'admin' && (
          <motion.div
            layoutId="viewToggle"
            className="absolute inset-0 bg-card rounded-md"
            style={{ boxShadow: 'var(--card-shadow)' }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
          />
        )}
        <span className="relative z-10 flex items-center gap-1.5"><Shield size={14} /> Admin</span>
      </button>
    </div>
  );
}

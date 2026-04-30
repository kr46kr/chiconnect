import { useState, useMemo } from "react";
import { AppLayout } from "@/components/AppLayout";
import { useStore } from "@/hooks/use-store";
import { store } from "@/lib/store";
import { Link } from "react-router-dom";
import { Search, Users, Check } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

const container = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };
const item = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } };

export default function GroupsPage() {
  const { currentUser, viewMode, groups } = useStore();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");

  const recommendedGroups = useMemo(() => store.getRecommendedGroups(currentUser.id), [currentUser.interests, groups]);

  const allDisplayGroups = viewMode === 'admin' ? groups : [
    ...groups.filter(g => currentUser.groupIds.includes(g.id)),
    ...recommendedGroups,
  ].filter((g, i, arr) => arr.findIndex(x => x.id === g.id) === i);

  const categories = useMemo(() => {
    const cats = new Set(allDisplayGroups.map(g => g.category));
    return ["All", ...cats];
  }, [allDisplayGroups]);

  const filtered = useMemo(() => {
    return allDisplayGroups.filter(g => {
      const matchesSearch = !search || g.name.toLowerCase().includes(search.toLowerCase());
      const matchesCat = category === "All" || g.category === category;
      return matchesSearch && matchesCat;
    });
  }, [allDisplayGroups, search, category]);

  const handleJoin = (groupId: string) => {
    if (currentUser.groupIds.includes(groupId)) {
      store.leaveGroup(currentUser.id, groupId);
      toast("Left group");
    } else {
      store.joinGroup(currentUser.id, groupId);
      toast.success("Group joined! 🎉");
    }
  };

  return (
    <AppLayout>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-display font-bold mb-1">Groups</h1>
        <p className="text-muted-foreground mb-6">Find your community — join groups that match your interests</p>

        <div className="relative mb-4">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search groups..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full max-w-xl pl-9 pr-4 py-2.5 rounded-lg border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                category === cat
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-muted"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(group => {
            const isMember = currentUser.groupIds.includes(group.id);
            return (
              <motion.div key={group.id} variants={item}>
                <div className="bg-card rounded-xl p-5 card-elevated h-full flex flex-col">
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                      style={{ backgroundColor: group.color, color: 'white' }}
                    >
                      {group.name[0]}
                    </div>
                    <div className="min-w-0 flex-1">
                      <Link to={`/groups/${group.id}`} className="font-display font-semibold text-sm hover:text-primary transition-colors truncate block">{group.name}</Link>
                      <span className="inline-block px-2 py-0.5 rounded-full bg-accent/10 text-accent text-xs font-medium">{group.category}</span>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3 flex-1">{group.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Users size={14} /> {group.memberIds.length} members
                    </span>
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleJoin(group.id)}
                      className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        isMember
                          ? 'bg-success/10 text-success'
                          : 'bg-primary text-primary-foreground hover:opacity-90'
                      }`}
                    >
                      {isMember ? <span className="flex items-center gap-1"><Check size={12} /> Joined</span> : 'Join'}
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </motion.div>
    </AppLayout>
  );
}

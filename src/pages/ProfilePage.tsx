import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { useStore } from "@/hooks/use-store";
import { store } from "@/lib/store";
import { Link } from "react-router-dom";
import { MapPin, Clock, Star, Edit, X, Plus } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

const AVAILABLE_INTERESTS = [
  "Photography", "Reading", "Tech", "Yoga", "Karaoke", "Kayaking", "Music", "Hiking",
  "Dancing", "Cooking", "Fitness", "Trivia", "Rock Climbing", "Coffee", "Meditation",
  "Board Games", "Pottery", "Film", "Writing", "Bowling", "Skating", "Wine Tasting",
  "Volunteering", "Art & Culture", "Food & Drink", "Games", "Outdoors", "Wellness",
  "Books", "Professional",
];

export default function ProfilePage() {
  const { currentUser, viewMode } = useStore();
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(currentUser.name);
  const [editBio, setEditBio] = useState(currentUser.bio);
  const [editLocationPrivate, setEditLocationPrivate] = useState(currentUser.location_private);
  const [editLocationPublic, setEditLocationPublic] = useState(currentUser.location_public);
  const [editAge, setEditAge] = useState(currentUser.age);
  const [editInterests, setEditInterests] = useState<string[]>(currentUser.interests);
  const [editHours, setEditHours] = useState(currentUser.weeklyHours);

  const userGroups = currentUser.groupIds.map(id => store.getGroupById(id)).filter(Boolean);

  const ratedEvents = Object.entries(currentUser.eventRatings).map(([eventId, rating]) => ({
    event: store.getEventById(eventId),
    rating,
  })).filter(r => r.event);

  const handleSave = async () => {
    if (editAge < 13 || editAge > 120) {
      toast.error("Age must be between 13 and 120.");
      return;
    }
    if (editHours < 0 || editHours > 168) {
      toast.error("Weekly commitment must be between 0 and 168 hours.");
      return;
    }

    try {
      await store.updateUser(currentUser.id, {
        name: editName,
        bio: editBio,
        location: editLocationPublic,
        location_private: editLocationPrivate,
        location_public: editLocationPublic,
        age: editAge,
        interests: editInterests,
        weeklyHours: editHours,
      });
      setEditing(false);
      toast.success("Profile saved!");
    } catch (error: any) {
      toast.error(error.message || "Failed to save profile.");
    }
  };

  const toggleInterest = (interest: string) => {
    setEditInterests(prev =>
      prev.includes(interest)
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    );
  };

  const handleRate = async (eventId: string, rating: number) => {
    try {
      await store.rateEvent(currentUser.id, eventId, rating);
      toast.success("Rating updated!");
    } catch (error: any) {
      toast.error(error.message || "Failed to update rating.");
    }
  };

  return (
    <AppLayout>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl">
        <h1 className="text-3xl font-display font-bold mb-6">My Profile</h1>

        {/* Profile card */}
        <div className="bg-card rounded-xl p-6 card-elevated mb-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <img src={currentUser.avatar} alt={currentUser.name} className="w-16 h-16 rounded-full bg-secondary" />
              <div>
                {editing ? (
                  <div className="space-y-2">
                    <input value={editName} onChange={e => setEditName(e.target.value)} className="font-display font-bold text-xl border-b border-border bg-transparent focus:outline-none focus:border-primary" />
                    <div className="space-y-1">
                      <label className="text-[10px] text-muted-foreground uppercase font-bold px-1">Precise Address (Private)</label>
                      <input value={editLocationPrivate} onChange={e => setEditLocationPrivate(e.target.value)} className="text-sm text-muted-foreground border-b border-border bg-transparent focus:outline-none focus:border-primary block w-full" placeholder="Precise Address" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-muted-foreground uppercase font-bold px-1">Display Area (Public)</label>
                      <input value={editLocationPublic} onChange={e => setEditLocationPublic(e.target.value)} className="text-sm text-muted-foreground border-b border-border bg-transparent focus:outline-none focus:border-primary block w-full" placeholder="Display Area" />
                    </div>
                    <input type="number" value={editAge} onChange={e => setEditAge(Number(e.target.value))} className="text-sm text-muted-foreground border-b border-border bg-transparent focus:outline-none focus:border-primary block w-20" />
                    <textarea value={editBio} onChange={e => setEditBio(e.target.value)} className="text-sm text-muted-foreground border border-border bg-transparent rounded-md p-2 focus:outline-none focus:ring-1 focus:ring-ring w-full" rows={2} />
                  </div>
                ) : (
                  <>
                    <h2 className="font-display font-bold text-xl">{currentUser.name}</h2>
                    <div className="space-y-0.5 mt-1">
                      <p className="text-sm text-muted-foreground flex items-center gap-1" title="Private Address"><MapPin size={12} className="text-primary" /> <span className="font-medium text-foreground/80">{currentUser.location_private}</span></p>
                      <p className="text-sm text-muted-foreground flex items-center gap-1" title="Public Display Area"><MapPin size={12} /> {currentUser.location_public}</p>
                    </div>
                    <p className="text-sm text-muted-foreground">Age: {currentUser.age}</p>
                    <p className="text-sm text-muted-foreground mt-1 italic">{currentUser.bio}</p>
                  </>
                )}
              </div>
            </div>
            {editing ? (
              <div className="flex gap-2">
                <button onClick={handleSave} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium">Save</button>
                <button onClick={() => setEditing(false)} className="px-4 py-2 rounded-lg bg-secondary text-secondary-foreground text-sm font-medium">Cancel</button>
              </div>
            ) : (
              <button onClick={() => { setEditing(true); setEditInterests(currentUser.interests); setEditName(currentUser.name); setEditBio(currentUser.bio); setEditLocationPrivate(currentUser.location_private); setEditLocationPublic(currentUser.location_public); setEditAge(currentUser.age); setEditHours(currentUser.weeklyHours); }} className="px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-secondary transition-colors flex items-center gap-1">
                <Edit size={14} /> Edit Profile
              </button>
            )}
          </div>
        </div>

        {/* Interests */}
        <div className="bg-card rounded-xl p-5 card-elevated mb-6">
          <h2 className="font-display font-semibold mb-3">Interests</h2>
          {editing ? (
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_INTERESTS.map(interest => (
                <button
                  key={interest}
                  onClick={() => toggleInterest(interest)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    editInterests.includes(interest)
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-secondary-foreground hover:bg-muted'
                  }`}
                >
                  {editInterests.includes(interest) ? '✓ ' : ''}{interest}
                </button>
              ))}
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {currentUser.interests.map(i => (
                <span key={i} className="interest-tag">{i}</span>
              ))}
              {currentUser.interests.length === 0 && (
                <p className="text-sm text-muted-foreground">No interests yet. Edit your profile to add some!</p>
              )}
            </div>
          )}
          {!editing && (
            <p className="text-xs text-muted-foreground mt-3">Your interests help us recommend groups and events for you.</p>
          )}
        </div>

        {/* Weekly hours */}
        <div className="bg-card rounded-xl p-5 card-elevated mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Clock size={16} className="text-primary" />
            <h2 className="font-display font-semibold">Weekly Social Hours Commitment</h2>
          </div>
          {editing ? (
            <div className="flex items-center gap-4">
              <input
                type="range"
                min={0}
                max={20}
                value={editHours}
                onChange={e => setEditHours(Number(e.target.value))}
                className="flex-1 accent-primary"
              />
              <span className="text-2xl font-display font-bold text-primary tabular-nums">{editHours}h</span>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full" style={{ width: `${(currentUser.weeklyHours / 20) * 100}%` }} />
              </div>
              <span className="text-2xl font-display font-bold text-primary tabular-nums">{currentUser.weeklyHours}h</span>
            </div>
          )}
          <p className="text-xs text-muted-foreground mt-2">How many hours per week you're available for social events and group activities.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Groups */}
          <div className="bg-card rounded-xl p-5 card-elevated">
            <h2 className="font-display font-semibold mb-3">My Groups ({userGroups.length})</h2>
            <div className="space-y-2">
              {userGroups.map(group => group && (
                <Link key={group.id} to={`/groups/${group.id}`} className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary transition-colors">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold" style={{ backgroundColor: group.color, color: 'white' }}>{group.name[0]}</div>
                  <p className="text-sm font-medium">{group.name}</p>
                </Link>
              ))}
              {userGroups.length === 0 && <p className="text-sm text-muted-foreground">No groups yet.</p>}
            </div>
          </div>

          {/* Event ratings */}
          <div className="bg-card rounded-xl p-5 card-elevated">
            <div className="flex items-center gap-2 mb-3">
              <h2 className="font-display font-semibold">Event Ratings</h2>
              <span className="text-xs bg-success/10 text-success px-2 py-0.5 rounded-full font-medium">Private</span>
            </div>
            <div className="space-y-3">
              {ratedEvents.map(({ event, rating }) => event && (
                <div key={event.id} className="flex items-center justify-between">
                  <p className="text-sm font-medium truncate flex-1">{event.title}</p>
                  <div className="flex gap-0.5">
                    {[1,2,3,4,5].map(s => (
                      <button key={s} onClick={() => handleRate(event.id, s)}>
                        <Star size={14} className={s <= rating ? 'text-warning fill-warning' : 'text-muted-foreground'} />
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              {ratedEvents.length === 0 && <p className="text-sm text-muted-foreground">No ratings yet.</p>}
            </div>
          </div>
        </div>

        {/* Friends */}
        {currentUser.friendIds.length > 0 && (
          <div className="bg-card rounded-xl p-5 card-elevated mt-6">
            <h2 className="font-display font-semibold mb-3">Friends ({currentUser.friendIds.length})</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {currentUser.friendIds.map(fId => {
                const friend = store.getUserById(fId);
                if (!friend) return null;
                return (
                  <Link key={fId} to={`/people/${fId}`} className="flex items-center gap-2 p-2 rounded-lg hover:bg-secondary transition-colors">
                    <img src={friend.avatar} alt={friend.name} className="w-8 h-8 rounded-full bg-secondary" />
                    <p className="text-sm font-medium truncate">{friend.name}</p>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </motion.div>
    </AppLayout>
  );
}

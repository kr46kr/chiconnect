import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { store } from '@/lib/store';
import { toast } from 'sonner';
import { MapPin, Calendar, Clock, ChevronRight, Check } from 'lucide-react';

const INTERESTS_LIST = [
  "Photography", "Reading", "Tech", "Yoga", "Karaoke", "Kayaking", "Music", "Hiking",
  "Dancing", "Cooking", "Fitness", "Trivia", "Rock Climbing", "Coffee", "Meditation",
  "Board Games", "Pottery", "Film", "Writing", "Bowling", "Skating", "Wine Tasting",
  "Volunteering", "Art & Culture", "Food & Drink", "Games", "Outdoors", "Wellness",
  "Books", "Professional"
];

export default function OnboardingPage() {
  const navigate = useNavigate();
  const currentUser = store.getCurrentUser();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [locationPrivate, setLocationPrivate] = useState(currentUser?.location_private || '');
  const [locationPublic, setLocationPublic] = useState(currentUser?.location_public || '');
  const [age, setAge] = useState(currentUser?.age ? currentUser.age.toString() : '');
  const [interests, setInterests] = useState<string[]>(currentUser?.interests || []);
  const [otherInterest, setOtherInterest] = useState('');
  const [weeklyHours, setWeeklyHours] = useState(currentUser?.weeklyHours?.toString() || '5');

  const toggleInterest = (interest: string) => {
    if (interests.includes(interest)) {
      setInterests(interests.filter(i => i !== interest));
    } else {
      setInterests([...interests, interest]);
    }
  };

  const handleNextStep = () => {
    if (step === 1) {
      if (!locationPrivate.trim() || !locationPublic.trim() || !age.trim()) {
        toast.error("Please fill out your address, display area, and age.");
        return;
      }
    }
    if (step === 2) {
      if (interests.length === 0 && !otherInterest.trim()) {
        toast.error("Please select at least one interest.");
        return;
      }
    }
    setStep(prev => prev + 1);
  };

  const handleFinish = async () => {
    if (!weeklyHours.trim()) {
      toast.error("Please provide your commitment level.");
      return;
    }

    setLoading(true);
    try {
      let finalInterests = [...interests];
      if (otherInterest.trim()) {
        const others = otherInterest.split(',').map(i => i.trim()).filter(Boolean);
        finalInterests = [...finalInterests, ...others];
      }

      // Deduplicate interests
      finalInterests = [...new Set(finalInterests)];

      await store.updateUser(currentUser.id, {
        location: locationPublic, // For backward compatibility
        location_private: locationPrivate,
        location_public: locationPublic,
        age: parseInt(age, 10),
        interests: finalInterests,
        weeklyHours: parseInt(weeklyHours, 10),
      });
      toast.success("Profile setup complete!");
      navigate('/');
    } catch (error) {
      toast.error("Failed to save profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const variants = {
    enter: { opacity: 0, x: 20 },
    center: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
  };

  if (!currentUser) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-10">
          <h1 className="font-display text-4xl font-bold mb-3">
            Welcome to <span className="text-primary">Chi</span>Connect
          </h1>
          <p className="text-muted-foreground text-lg">Let's personalize your experience</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8" border-border>
          <div className="flex justify-between mb-2">
            {[1, 2, 3].map((num) => (
              <span key={num} className={`text-sm font-medium ${step >= num ? 'text-primary' : 'text-muted-foreground'}`}>
                Step {num}
              </span>
            ))}
          </div>
          <div className="h-2 w-full bg-secondary rounded-full overflow-hidden flex">
            <motion.div 
              className="h-full bg-primary"
              initial={{ width: '33%' }}
              animate={{ width: `${(step / 3) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        <div className="bg-card rounded-2xl p-8 card-elevated h-[480px] flex flex-col relative overflow-hidden">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.2 }}
                className="flex-1 flex flex-col"
              >
                <h2 className="text-2xl font-semibold mb-6">Basic Info</h2>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1.5 opacity-80">What is your precise address? (Private)</label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                        <input
                          type="text"
                          value={locationPrivate}
                          onChange={(e) => setLocationPrivate(e.target.value)}
                          placeholder="e.g. 123 N Lincoln Ave, Chicago, IL 60614"
                          className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-secondary/50 focus:bg-background focus:ring-2 focus:ring-primary transition-all outline-none"
                        />
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-1 px-1 italic">This is only used for verification and nearby recommendations, and is never shared with others.</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1.5 opacity-80">How should your area be displayed? (Public)</label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-3 h-5 w-5 text-muted-foreground opacity-60" />
                        <input
                          type="text"
                          value={locationPublic}
                          onChange={(e) => setLocationPublic(e.target.value)}
                          placeholder="e.g. Lincoln Park"
                          className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-secondary/50 focus:bg-background focus:ring-2 focus:ring-primary transition-all outline-none"
                        />
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-1 px-1 italic">This is what other users will see on your profile.</p>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 opacity-80">How old are you?</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                      <input
                        type="number"
                        min="13"
                        max="120"
                        value={age}
                        onChange={(e) => setAge(e.target.value)}
                        placeholder="e.g. 28"
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-secondary/50 focus:bg-background focus:ring-2 focus:ring-primary transition-all outline-none"
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.2 }}
                className="flex-1 flex flex-col h-full"
              >
                <h2 className="text-2xl font-semibold mb-4">What do you enjoy?</h2>
                <p className="text-sm text-muted-foreground mb-4">Select all that apply.</p>
                <div className="flex-1 overflow-y-auto pr-2 pb-4 space-y-4 sleek-scrollbar">
                  <div className="flex flex-wrap gap-2">
                    {INTERESTS_LIST.map((interest) => {
                      const isSelected = interests.includes(interest);
                      return (
                        <button
                          key={interest}
                          onClick={() => toggleInterest(interest)}
                          className={`px-4 py-2 rounded-full border text-sm font-medium transition-all duration-200 ${
                            isSelected 
                              ? 'bg-primary border-primary text-primary-foreground shadow-sm' 
                              : 'bg-background border-border hover:border-primary/50 text-foreground'
                          }`}
                        >
                          {interest}
                        </button>
                      );
                    })}
                  </div>
                  <div className="mt-6 pt-4 border-t border-border">
                    <label className="block text-sm font-medium mb-2 text-muted-foreground">Other (comma separated)</label>
                    <input
                      type="text"
                      value={otherInterest}
                      onChange={(e) => setOtherInterest(e.target.value)}
                      placeholder="e.g. Graphic Design, Astronomy"
                      className="w-full px-4 py-3 rounded-xl border border-border bg-secondary/50 focus:bg-background focus:ring-2 focus:ring-primary transition-all outline-none text-sm"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.2 }}
                className="flex-1 flex flex-col"
              >
                <h2 className="text-2xl font-semibold mb-6">Commitment Level</h2>
                <p className="text-sm text-muted-foreground mb-8">
                  How many hours per week do you intend to dedicate to community activities?
                </p>
                
                <div className="relative pt-6 pb-2">
                  <div className="flex justify-between text-xs text-muted-foreground font-medium mb-4 absolute top-0 w-full px-1">
                    <span>1 hr</span>
                    <span>10+ hrs</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={weeklyHours}
                    onChange={(e) => setWeeklyHours(e.target.value)}
                    className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                  <div className="mt-8 text-center">
                    <span className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary font-bold text-2xl border-4 border-primary/20 shadow-sm">
                      {weeklyHours}{weeklyHours === '10' ? '+' : ''}
                    </span>
                    <p className="font-medium text-foreground mt-3">hours/week</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-auto pt-6 flex justify-between gap-4 border-t border-border/50">
            {step > 1 ? (
              <button
                onClick={() => setStep(step - 1)}
                className="px-6 py-3 rounded-xl font-medium text-foreground hover:bg-secondary transition-colors"
              >
                Back
              </button>
            ) : (
              <div></div> // Empty div to keep 'Next' button on the right
            )}

            {step < 3 ? (
              <button
                onClick={handleNextStep}
                className="flex items-center gap-2 px-8 py-3 rounded-xl bg-primary text-primary-foreground font-medium shadow-sm hover:opacity-90 transition-opacity"
              >
                Continue <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                disabled={loading}
                onClick={handleFinish}
                className="flex items-center gap-2 px-8 py-3 rounded-xl bg-primary text-primary-foreground font-medium shadow-sm hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Finish'} <Check className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

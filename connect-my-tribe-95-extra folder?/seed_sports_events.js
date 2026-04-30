import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log("Loading chicago_sports_events.json...");
  const rawData = fs.readFileSync('./chicago_sports_events.json', 'utf-8');
  const eventsData = JSON.parse(rawData);

  console.log(`Found ${eventsData.length} events to seed.`);

  // Notice: We are NOT deleting existing events! We are just adding these 22 new ones.

  const mappedEvents = eventsData.map((ev, i) => {
    return {
      title: ev["Event Title"],
      category: "Sports",
      date: ev["Date"],
      description: "Come support Chicago teams and enjoy a great game!",
      location: ev["Location"],
      price: "Paid",
      max_attendees: 100 + Math.floor(Math.random() * 400),
      rating: 4.0 + (Math.random()),
      time: ev["Time"],
      dress_code: "Casual/Sports Gear"
    };
  });

  console.log("Inserting new sports events...");
  const { data, error } = await supabase.from('events').insert(mappedEvents);

  if (error) {
    console.error("Error inserting events:", error);
  } else {
    console.log("Successfully seeded sports events!");
  }
}

run();

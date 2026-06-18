import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://foexoyakzskviskmkqqn.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZvZXhveWFrenNrdmlza21rcXFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk1OTk2OTMsImV4cCI6MjA5NTE3NTY5M30.NLo_SYWaI59DIdOZLwvJI-fePk_SRh7ZCuzPSv1rC18';
const supabase = createClient(supabaseUrl, supabaseKey);

const users = [
  {
    id: 'att-1234',
    name: 'Rishi',
    email: 'rishi@tixque.com',
    password: 'attendee123',
    role: 'attendee',
    is_verified: true,
    is_suspended: false,
    interests: [],
    wishlist: [],
    wallet_balance: 0,
    city: 'Mumbai'
  },
  {
    id: 'org-1234',
    name: 'Priya',
    email: 'priya@tixque.com',
    password: 'organizer123',
    role: 'organizer',
    is_verified: true,
    is_suspended: false,
    interests: [],
    wishlist: [],
    wallet_balance: 0,
    city: 'Delhi'
  },
  {
    id: 'adm-1234',
    name: 'Super Admin',
    email: 'admin@tixque.com',
    password: 'admin123',
    role: 'admin',
    is_verified: true,
    is_suspended: false,
    interests: [],
    wishlist: [],
    wallet_balance: 0,
    city: 'Mumbai'
  }
];

async function seed() {
  const { data, error } = await supabase.from('users').insert(users).select();
  if (error) console.error('Error inserting:', error);
  else console.log('Successfully inserted users:', data.length);
}
seed();

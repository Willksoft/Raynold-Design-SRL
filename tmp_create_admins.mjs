import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ymiqmbzsmeqexgztquwj.supabase.co';
const supabaseKey = 'sb_publishable_eVkngE3UJjXF6C8RiRPiMg_B895azE7'; // Your anon key
const supabase = createClient(supabaseUrl, supabaseKey);

const accounts = [
  'admin@raynolddesignssrl.com',
  'ventas@raynolddesignssrl.com',
  'finanzas@raynolddesignssrl.com',
  'gerencia@raynolddesignssrl.com'
];

async function run() {
  for (const email of accounts) {
    console.log(`Creating ${email}...`);
    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: 'RaynoldAdmin2026', // Contraseña maestra temporal
      options: {
        data: {
          role: 'admin' // Some custom metadata
        }
      }
    });
    
    if (error) {
      console.error(`Error with ${email}:`, error.message);
    } else {
      console.log(`Success: ${email}`);
    }
  }
}

run();

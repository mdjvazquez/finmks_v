import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zozsbxivnpmmblypcbaq.supabase.co';
const supabaseKey = 'sb_publishable_KmLOQ9CgrsM-gZX8vw-Ekg_XKthRVTQ';

export const supabase = createClient(supabaseUrl, supabaseKey);
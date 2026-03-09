import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env explicitly if node --env-file isn't used
const envFile = fs.readFileSync(path.join(__dirname, '.env.local'), 'utf-8');
const env = {};
for (const line of envFile.split('\n')) {
    if (line.includes('=')) {
        const [key, ...rest] = line.split('=');
        env[key.trim()] = rest.join('=').trim();
    }
}

const supabaseUrl = process.env.VITE_SUPABASE_URL || env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing SUPABASE URL or KEY");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const TRABAJOS_DIR = path.join(__dirname, 'trabajos');

async function uploadTrabajos() {
    const files = fs.readdirSync(TRABAJOS_DIR);
    const supportedExtensions = ['.jpg', '.jpeg', '.png'];

    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    for (const file of files) {
        const ext = path.extname(file).toLowerCase();

        if (!supportedExtensions.includes(ext)) {
            console.log(`Skipping unsupported file: ${file}`);
            skipCount++;
            continue;
        }

        const filePath = path.join(TRABAJOS_DIR, file);
        const fileBuffer = fs.readFileSync(filePath);
        const fileName = `projects/${Date.now()}_${file.replace(/\s+/g, '_')}`;

        console.log(`Uploading ${file}...`);

        // Upload image
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('raynold-media')
            .upload(fileName, fileBuffer, {
                contentType: `image/${ext === '.png' ? 'png' : 'jpeg'}`,
                upsert: false
            });

        if (uploadError) {
            console.error(`Error uploading ${file}:`, uploadError.message);
            errorCount++;
            continue;
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from('raynold-media')
            .getPublicUrl(fileName);

        // Insert into projects table
        // Category inferred, we can just set a default like "Desarrollo y Montaje" or "Remodelacion Comercial"
        const title = file.replace(ext, '').replace(/[_-]/g, ' ').replace(/\d{8}/, '').trim() || 'Proyecto Trabajos';

        const { error: dbError } = await supabase
            .from('projects')
            .insert({
                title: title.length > 3 ? title : 'Proyecto ' + Date.now().toString().slice(-4),
                description: 'Proyecto realizado por Raynold Design SRL',
                image_url: publicUrl,
                category: 'Remodelacion Comercial'
            });

        if (dbError) {
            console.error(`Error inserting into DB for ${file}:`, dbError.message);
            errorCount++;
        } else {
            console.log(`Successfully processed ${file}`);
            successCount++;
        }
    }

    console.log('---');
    console.log(`Finished processing. Uploaded: ${successCount}. Skipped: ${skipCount}. Errors: ${errorCount}.`);
}

uploadTrabajos().catch(console.error);

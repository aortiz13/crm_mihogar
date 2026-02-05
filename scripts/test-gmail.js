
require('dotenv').config({ path: '.env.local' });
const { google } = require('googleapis');
const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');

// --- Mock Encryption Utils (Since we can't easily import ts files in node js without compilation) ---
// Copying logic from lib/utils/encryption.ts
const ALGORITHM = 'aes-256-gcm';
const SECRET_KEY = process.env.ENCRYPTION_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'default-secret-key-32-chars-at-least!!';

const getKey = () => {
    return crypto.scryptSync(SECRET_KEY, 'salt', 32);
}

function decrypt(text) {
    const parts = text.split(':');
    if (parts.length !== 3) return null;
    const [ivHex, authTagHex, encryptedHex] = parts;

    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), iv);

    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
}

// --- Main Test Logic ---

async function runTest() {
    const communityId = '2972a3a6-75e0-43fa-b2b2-efb1b9c08529';
    console.log(`Testing Sync for Community: ${communityId}`);

    // Create Supabase Client (Service Role preferred for standalone, but reusing env vars)
    // We need SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY or ANON_KEY
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
        console.error("Missing Supabase Env Vars");
        return;
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Get Integration
    const { data: integration, error } = await supabase
        .from('community_integrations')
        .select('*')
        .eq('community_id', communityId)
        .eq('provider', 'google')
        .single();

    if (error || !integration) {
        console.error("Integration not found or error:", error);
        return;
    }

    console.log("Integration found:", integration.email);

    // 2. Decrypt Token
    const accessToken = decrypt(integration.access_token);
    const refreshToken = integration.refresh_token ? decrypt(integration.refresh_token) : null;

    if (!accessToken) {
        console.error("Failed to decrypt access token");
        return;
    }

    console.log("Access Token Decrypted (first 10 chars):", accessToken.substring(0, 10));

    // 3. Setup Google Client
    const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET
    );

    oauth2Client.setCredentials({
        access_token: accessToken,
        refresh_token: refreshToken,
        expiry_date: integration.expires_at
    });

    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    // 4. List Messages
    try {
        console.log("Listing messages from Gmail...");
        const res = await gmail.users.messages.list({
            userId: 'me',
            maxResults: 10,
            labelIds: ['INBOX']
        });

        console.log("Messages API Response Status:", res.status);

        if (!res.data.messages) {
            console.log("No messages found in INBOX response.");
            // Try listing without label
            console.log("Trying without label filter...");
            const resAll = await gmail.users.messages.list({ userId: 'me', maxResults: 5 });
            console.log("All Messages Count:", resAll.data.messages ? resAll.data.messages.length : 0);
            return;
        }

        console.log(`Found ${res.data.messages.length} messages.`);

        for (const msg of res.data.messages) {
            console.log(`Fetching details for message ${msg.id}...`);
            const fullMsg = await gmail.users.messages.get({ userId: 'me', id: msg.id, format: 'full' });
            const snippet = fullMsg.data.snippet;
            console.log(`- Snippet: ${snippet}`);

            // Try Insert
            const headers = fullMsg.data.payload?.headers;
            const subject = headers?.find(h => h.name === 'Subject')?.value || 'Sin Asunto';
            const from = headers?.find(h => h.name === 'From')?.value || '';
            const date = headers?.find(h => h.name === 'Date')?.value;
            // from parsing
            const fromMatch = from.match(/(.*)<(.*)>/);
            const senderName = fromMatch ? fromMatch[1].trim().replace(/"/g, '') : from;
            const senderEmail = fromMatch ? fromMatch[2].trim() : from;

            console.log(`  Preview: [${subject}] from [${senderEmail}]`);

            const { error: insertError } = await supabase.from('communications').upsert({
                id: undefined, // Let DB generate? No, upsert needs constraint? 
                // Using insert for existing check logic
                community_id: communityId,
                subject,
                sender_email: senderEmail,
                sender_name: senderName,
                body: snippet || 'Body placeholder', // Simplified for test
                status: 'new',
                received_at: date ? new Date(date).toISOString() : new Date().toISOString(),
                thread_id: msg.threadId,
                metadata: { gmail_id: msg.id, snippet: snippet }
            }, { onConflict: 'id' }); // Actually relying on default simple insert usually

            // In original code I check strict existence.
            if (insertError) {
                console.error("  Insert Error:", insertError);
            } else {
                console.log("  Insert Success");
            }
        }

    } catch (e) {
        console.error("Google API Error:", e.response ? e.response.data : e.message);
    }
}

runTest();

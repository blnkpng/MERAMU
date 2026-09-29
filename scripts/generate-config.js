const fs = require("fs");
const path = require("path");

const supabaseUrl = process.env.SUPABASE_URL || "";
const supabasePublishableKey =
    process.env.SUPABASE_PUBLISHABLE_KEY || "";

if (!supabaseUrl || !supabasePublishableKey) {
    console.error("❌ Supabase environment variables belum tersedia.");
    console.error("Pastikan SUPABASE_URL dan SUPABASE_PUBLISHABLE_KEY sudah diatur di Netlify.");
    process.exit(1);
}

const output = `window.MERAMU_CONFIG = {
    SUPABASE_URL: ${JSON.stringify(supabaseUrl)},
    SUPABASE_PUBLISHABLE_KEY: ${JSON.stringify(supabasePublishableKey)}
};
`;

const outputPath = path.join(__dirname, "..", "js", "config.js");

fs.writeFileSync(outputPath, output, "utf8");

console.log("✅ MERAMU Supabase config generated.");

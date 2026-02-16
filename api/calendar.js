
import { google } from 'googleapis';

export default async function handler(req, res) {
    try {
        const { calendarId = 'primary', date } = req.query; // Default to 'primary' or use a specific ID if known

        // SECURITY: Use environment variables. Never hardcode keys.
        const SCOPES = ['https://www.googleapis.com/auth/calendar.readonly'];
        const key = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'); // Handle newlines in ENV
        const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
        const projectId = process.env.GOOGLE_PROJECT_ID;

        if (!key || !email) {
            console.error("Missing Google Credentials in Environment Code");
            return res.status(500).json({ error: 'Server configuration error: Missing credentials' });
        }

        const auth = new google.auth.JWT({
            email: email,
            key: key,
            scopes: SCOPES,
        });

        const calendar = google.calendar({ version: 'v3', auth });

        // Calculate timeMin (start of day) and timeMax (end of day) for the requested date
        const targetDate = date ? new Date(date) : new Date();
        const timeMin = new Date(targetDate.setHours(0, 0, 0, 0)).toISOString();
        const timeMax = new Date(targetDate.setHours(23, 59, 59, 999)).toISOString();

        const response = await calendar.events.list({
            calendarId: calendarId, // Use the ID from query or env
            timeMin: timeMin,
            timeMax: timeMax,
            singleEvents: true,
            orderBy: 'startTime',
        });

        res.status(200).json(response.data.items);
    } catch (error) {
        console.error('Google Calendar API Error:', error);
        res.status(500).json({ error: 'Failed to fetch calendar events', details: error.message });
    }
}

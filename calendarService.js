const { google } = require('googleapis');

// Initialize OAuth2 client with credentials from environment variables
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  'http://localhost' // Redirect URI (not used for refresh token flow)
);

// Set refresh token for automatic authentication
oauth2Client.setCredentials({
  refresh_token: process.env.GOOGLE_REFRESH_TOKEN
});

// Initialize Google Calendar API client
const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

/**
 * Create a calendar event
 * @param {string} name - User's name
 * @param {string} date - Date in YYYY-MM-DD format
 * @param {string} time - Time in HH:MM format (24-hour)
 * @param {string} title - Optional meeting title
 * @returns {Promise<Object>} Created event details
 */
async function createCalendarEvent(name, date, time, title = null) {
  try {
    // Validate inputs
    if (!name || !date || !time) {
      throw new Error('Missing required fields: name, date, or time');
    }

    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      throw new Error('Invalid date format. Expected YYYY-MM-DD');
    }

    // Validate time format (HH:MM)
    const timeRegex = /^\d{2}:\d{2}$/;
    if (!timeRegex.test(time)) {
      throw new Error('Invalid time format. Expected HH:MM (24-hour)');
    }

    // Create start datetime (ISO 8601 format)
    const startDateTime = `${date}T${time}:00`;
    
    // Calculate end time (1 hour later)
    const [hours, minutes] = time.split(':').map(Number);
    const endHour = (hours + 1).toString().padStart(2, '0');
    const endDateTime = `${date}T${endHour}:${minutes.toString().padStart(2, '0')}:00`;

    // Prepare event data
    const eventTitle = title || `Meeting with ${name}`;
    
    const event = {
      summary: eventTitle,
      description: `Scheduled meeting with ${name}`,
      start: {
        dateTime: startDateTime,
        timeZone: 'Asia/Kolkata', // Change to your timezone
      },
      end: {
        dateTime: endDateTime,
        timeZone: 'Asia/Kolkata', // Change to your timezone
      },
      attendees: [],
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 }, // 1 day before
          { method: 'popup', minutes: 30 },       // 30 minutes before
        ],
      },
    };

    console.log('Creating calendar event:', {
      title: eventTitle,
      start: startDateTime,
      end: endDateTime
    });

    // Insert event into Google Calendar
    const response = await calendar.events.insert({
      calendarId: 'primary',
      resource: event,
    });

    console.log('Event created successfully:', response.data.id);

    return {
      success: true,
      eventId: response.data.id,
      eventLink: response.data.htmlLink,
      summary: response.data.summary,
      start: response.data.start.dateTime,
      end: response.data.end.dateTime
    };

  } catch (error) {
    console.error('Error creating calendar event:', error.message);
    throw error;
  }
}

module.exports = { createCalendarEvent };
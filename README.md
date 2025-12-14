# Voice Scheduling Backend

Backend server for voice AI scheduling agent that creates Google Calendar events.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file with your credentials (see `.env.example`)

3. Update timezone in `calendarService.js` (lines 52 and 56)

## Running the Server

Development mode (auto-restart on changes):
```bash
npm run dev
```

Production mode:
```bash
npm start
```

## Testing

Test calendar event creation:
```bash
npm test
```

## API Endpoints

- `GET /health` - Health check
- `POST /webhook/create-event` - Create calendar event (called by VAPI)

### Webhook Request Format
```json
{
  "name": "John Doe",
  "date": "2024-12-20",
  "time": "14:30",
  "title": "Team Meeting"
}
```

### Webhook Response Format
```json
{
  "success": true,
  "message": "Calendar event created successfully for John Doe",
  "event": {
    "id": "event_id_here",
    "link": "https://calendar.google.com/...",
    "summary": "Team Meeting",
    "start": "2024-12-20T14:30:00-05:00",
    "end": "2024-12-20T15:30:00-05:00"
  }
}
```

## Environment Variables

See `.env.example` for required variables.
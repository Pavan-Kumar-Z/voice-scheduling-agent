# Voice Scheduling Agent 🎙️📅

A full-stack AI solution that leverages a voice-based assistant to schedule meetings directly into Google Calendar. This project consists of a **Node.js/Express backend** and is integrated with **Vapi AI** and **Google Calendar API**.

The system is deployed on **Render** and acts as the bridge between the AI's natural language processing and the user's digital calendar.

---

## 🚀 Features

* **Natural Language Understanding**: Users can speak naturally (e.g., "Schedule a meeting for next Tuesday at 3 PM") and the AI extracts the correct date and time.
* **Google Calendar Integration**: Automatically creates events with titles, descriptions, and 1-hour durations.
* **Vapi AI Assistant**: Uses a custom-configured voice assistant ("Elliot") powered by GPT-4o.
* **Smart Reminders**: Automatically sets email reminders (1 day before) and popup notifications (30 minutes before).

---

## 🛠️ Technology Stack

| Component | Technology |
| --- | --- |
| **Backend** | Node.js, Express.js |
| **AI Orchestration** | [Vapi AI](https://vapi.ai/) |
| **LLM** | OpenAI GPT-4o |
| **Calendar Service** | Google Calendar API (OAuth2) |
| **Voice/STT** | Elliot (Vapi) / Deepgram (flux-general-en) |

---

## 🤖 Vapi Assistant Configuration

The assistant is configured with the following specifications:

* **Assistant Name**: Voice Scheduling Agent
* **Voice**: Elliot (Vapi Provider)
* **Transcriber**: Deepgram (`flux-general-en`)
* **System Prompt**: Instructs the AI to greet users warmly, collect Name, Date, Time, and Title, convert natural language to strict `YYYY-MM-DD` and `HH:MM` formats, and wait for explicit confirmation before calling the tool.

### Integrated Tools

The assistant utilizes a specific tool for calendar operations:

* **Tool Name**: `Calendar`
* **Type**: Function Call
* **Required Parameters**: `name`, `date`, `time`
* **Logic**: Only triggered after the user provides a verbal "Yes" to the summarized details.

---

## 📡 API Endpoints

The backend is deployed on Render. While the internal logic handles Vapi's complex request wrappers, the primary functional endpoint is:

* **GET `/health**`: Check if the server is active.
* **POST `/webhook/create-event**`: The main webhook that receives tool calls from Vapi or manual requests.

---

## 💻 Manual Testing (cURL)

You can manually test the calendar creation logic without a voice call by sending a POST request to the endpoint:

```bash
curl -X POST https://your-deployed-app.com/webhook/create-event \
-H "Content-Type: application/json" \
-d '{
  "name": "John Doe",
  "date": "2025-12-25",
  "time": "10:00",
  "title": "Christmas Strategy Session"
}'

```

---

## ⚙️ Setup & Installation

### 1. Prerequisites

* Node.js (v16+)
* Google Cloud Project with Calendar API enabled
* Google OAuth2 Credentials (Client ID, Secret, and Refresh Token)

### 2. Installation

```bash
npm install

```

### 3. Environment Variables

Create a `.env` file based on `.env.example`:

```env
GOOGLE_CLIENT_ID=your_id
GOOGLE_CLIENT_SECRET=your_secret
GOOGLE_REFRESH_TOKEN=your_refresh_token
PORT=3000

```

### 4. Running Locally

```bash
# Development
npm run dev

# Test Calendar Logic
npm test

```

---

## 📝 Timezone Note

The default timezone is set to `Asia/Kolkata` in `calendarService.js`. To change this, update the `timeZone` field in the `event` object within the `createCalendarEvent` function.

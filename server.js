require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createCalendarEvent } = require('./calendarService');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors()); // Allow requests from VAPI
app.use(express.json()); // Parse JSON request bodies

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    message: 'Voice Scheduling Backend is running',
    timestamp: new Date().toISOString()
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'Voice Scheduling Backend API',
    endpoints: {
      health: '/health',
      createEvent: '/webhook/create-event'
    }
  });
});

// Webhook endpoint for VAPI to create calendar events
app.post('/webhook/create-event', async (req, res) => {
  try {
    console.log('Received webhook request:', JSON.stringify(req.body, null, 2));

    // Extract data from VAPI request
    const { name, date, time, title } = req.body;

    // Validate required fields
    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: name'
      });
    }

    if (!date) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: date'
      });
    }

    if (!time) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: time'
      });
    }

    console.log('Processing event creation:', { name, date, time, title });

    // Call Google Calendar service
    const result = await createCalendarEvent(name, date, time, title);

    console.log('Calendar event created successfully');

    // Send success response back to VAPI
    res.status(200).json({
      success: true,
      message: `Calendar event created successfully for ${name}`,
      event: {
        id: result.eventId,
        link: result.eventLink,
        summary: result.summary,
        start: result.start,
        end: result.end
      }
    });

  } catch (error) {
    console.error('Error in webhook endpoint:', error.message);
    
    // Send error response back to VAPI
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create calendar event'
    });
  }
});

// 404 handler for unknown routes
app.use((req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    availableEndpoints: {
      health: '/health',
      createEvent: '/webhook/create-event'
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
  console.log(`📍 Webhook endpoint: http://localhost:${PORT}/webhook/create-event`);
  console.log(`\n✅ Ready to receive requests from VAPI\n`);
});
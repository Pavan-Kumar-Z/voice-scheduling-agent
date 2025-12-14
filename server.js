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

// Webhook endpoint for VAPI to create calendar events (with detailed logging)
app.post('/webhook/create-event', async (req, res) => {
  try {
    // LOG EVERYTHING FOR DEBUGGING
    console.log('=== WEBHOOK REQUEST RECEIVED ===');
    console.log('Headers:', JSON.stringify(req.headers, null, 2));
    console.log('Body:', JSON.stringify(req.body, null, 2));
    console.log('Body type:', typeof req.body);
    console.log('Body keys:', req.body ? Object.keys(req.body) : 'No body');
    console.log('================================');

    // Extract data from VAPI request
    const { name, date, time, title } = req.body || {};

    console.log('Extracted values:');
    console.log(' name:', name, '(type:', typeof name, ')');
    console.log(' date:', date, '(type:', typeof date, ')');
    console.log(' time:', time, '(type:', typeof time, ')');
    console.log(' title:', title, '(type:', typeof title, ')');

    // Validate required fields
    if (!name) {
      console.error('ERROR: Missing name');
      return res.status(400).json({
        success: false,
        error: 'Missing required field: name'
      });
    }

    if (!date) {
      console.error('ERROR: Missing date');
      return res.status(400).json({
        success: false,
        error: 'Missing required field: date'
      });
    }

    if (!time) {
      console.error('ERROR: Missing time');
      return res.status(400).json({
        success: false,
        error: 'Missing required field: time'
      });
    }

    console.log('All validations passed. Calling calendar service...');

    // Call Google Calendar service
    const result = await createCalendarEvent(name, date, time, title);

    console.log('Calendar service returned:', result);

    // Prepare success response
    const response = {
      success: true,
      message: `Calendar event created successfully for ${name}`,
      event: {
        id: result.eventId,
        link: result.eventLink,
        summary: result.summary,
        start: result.start,
        end: result.end
      }
    };

    console.log('Sending response to VAPI:', JSON.stringify(response, null, 2));
    
    res.status(200).json(response);

  } catch (error) {
    console.error('=== ERROR IN WEBHOOK ===');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('========================');

    // Send error response back to VAPI
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create calendar event',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
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
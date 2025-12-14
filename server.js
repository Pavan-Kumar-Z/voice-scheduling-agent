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
    console.log('=== WEBHOOK REQUEST RECEIVED ===');
    console.log('Full request body:', JSON.stringify(req.body, null, 2));
    if (req.body) {
      console.log('Body keys:', Object.keys(req.body));
    }

    let name, date, time, title;

    // Case 1: Standard VAPI format - wrapped in message.tool_calls
    if (req.body.message && req.body.message.tool_calls && req.body.message.tool_calls.length > 0) {
      console.log('Detected VAPI format with message wrapper');
      const toolCall = req.body.message.tool_calls[0];
      const argsString = toolCall.function.arguments;
      console.log('Arguments string:', argsString);

      try {
        const args = JSON.parse(argsString);
        console.log('Parsed arguments:', args);
        ({ name, date, time, title } = args);
      } catch (parseError) {
        console.error('Failed to parse arguments JSON:', parseError);
        return res.status(400).json({
          success: false,
          error: 'Invalid JSON in tool call arguments'
        });
      }
    }
    // Case 2: Alternative VAPI format - tool_calls at root level
    else if (req.body.tool_calls && req.body.tool_calls.length > 0) {
      console.log('Detected VAPI format with tool_calls at root');
      const toolCall = req.body.tool_calls[0];
      const argsString = toolCall.function.arguments;
      console.log('Arguments string:', argsString);

      try {
        const args = JSON.parse(argsString);
        console.log('Parsed arguments:', args);
        ({ name, date, time, title } = args);
      } catch (parseError) {
        console.error('Failed to parse arguments JSON:', parseError);
        return res.status(400).json({
          success: false,
          error: 'Invalid JSON in tool call arguments'
        });
      }
    }
    // Case 3: Direct format (useful for curl/testing)
    else if (req.body && (req.body.name || req.body.date || req.body.time)) {
      console.log('Detected direct format (testing/curl)');
      ({ name, date, time, title } = req.body);
    }
    // Unknown format
    else {
      console.error('Unknown request format');
      console.error('Request body:', JSON.stringify(req.body, null, 2));
      return res.status(400).json({
        success: false,
        error: 'Unknown request format. Could not extract parameters.',
        receivedBody: req.body
      });
    }

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

    console.log('✅ All validations passed. Creating calendar event...');

    // Call Google Calendar service
    const result = await createCalendarEvent(name, date, time, title);

    console.log('✅ Calendar event created successfully!');
    console.log('Event ID:', result.eventId);
    console.log('Event Link:', result.eventLink);

    // Send success response back to VAPI
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

    console.log('Sending success response to VAPI:', JSON.stringify(response, null, 2));
    res.status(200).json(response);

  } catch (error) {
    console.error('=== ERROR IN WEBHOOK ===');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('========================');

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
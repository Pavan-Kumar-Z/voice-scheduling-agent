require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createCalendarEvent } = require('./calendarService');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors()); // Allow requests from VAPI
app.use(express.json({ limit: '10mb' })); // Parse JSON request bodies, with limit for safety

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
    let toolCallId = null; // For error responses to Vapi

    // Case 0: Vapi with assistant wrapper (common in some integrations)
    if (req.body.assistant && req.body.assistant.toolCalls && req.body.assistant.toolCalls.length > 0) {
      console.log('Case 0: Detected VAPI format with assistant wrapper');
      const toolCall = req.body.assistant.toolCalls[0];
      toolCallId = toolCall.id;
      const args = toolCall.function.arguments;
      console.log('Arguments type:', typeof args);
      console.log('Raw arguments:', args);
      try {
        let parsedArgs = args;
        if (typeof args === 'string') {
          let cleanArgs = args.trim();
          cleanArgs = cleanArgs.replace(/\\"/g, '"');
          parsedArgs = JSON.parse(cleanArgs);
        }
        console.log('Parsed arguments:', parsedArgs);
        ({ name, date, time, title } = parsedArgs);
      } catch (parseError) {
        console.error('Failed to parse arguments JSON:', parseError);
        return res.status(400).json({
          success: false,
          error: 'Invalid JSON in tool call arguments',
          tool_call_id: toolCallId
        });
      }
    }
    // Case 1: Standard VAPI format - wrapped in message.toolCalls (camelCase)
    else if (req.body.message && req.body.message.toolCalls && req.body.message.toolCalls.length > 0) {
      console.log('Case 1: Detected VAPI format with message.toolCalls wrapper');
      const toolCall = req.body.message.toolCalls[0];
      toolCallId = toolCall.id;
      const args = toolCall.function.arguments;
      console.log('Arguments type:', typeof args);
      console.log('Raw arguments:', args);
      try {
        let parsedArgs = args;
        if (typeof args === 'string') {
          let cleanArgs = args.trim();
          cleanArgs = cleanArgs.replace(/\\"/g, '"');
          parsedArgs = JSON.parse(cleanArgs);
        }
        console.log('Parsed arguments:', parsedArgs);
        ({ name, date, time, title } = parsedArgs);
      } catch (parseError) {
        console.error('Failed to parse arguments JSON:', parseError);
        return res.status(400).json({
          success: false,
          error: 'Invalid JSON in tool call arguments',
          tool_call_id: toolCallId
        });
      }
    }
    // Case 1b: Fallback to message.toolCallList if toolCalls empty
    else if (req.body.message && req.body.message.toolCallList && req.body.message.toolCallList.length > 0) {
      console.log('Case 1b: Detected VAPI format with message.toolCallList fallback');
      const toolCall = req.body.message.toolCallList[0];
      toolCallId = toolCall.id;
      const args = toolCall.function.arguments;
      console.log('Arguments type:', typeof args);
      console.log('Raw arguments:', args);
      try {
        let parsedArgs = args;
        if (typeof args === 'string') {
          let cleanArgs = args.trim();
          cleanArgs = cleanArgs.replace(/\\"/g, '"');
          parsedArgs = JSON.parse(cleanArgs);
        }
        console.log('Parsed arguments:', parsedArgs);
        ({ name, date, time, title } = parsedArgs);
      } catch (parseError) {
        console.error('Failed to parse arguments JSON:', parseError);
        return res.status(400).json({
          success: false,
          error: 'Invalid JSON in tool call arguments',
          tool_call_id: toolCallId
        });
      }
    }
    // Case 2: Alternative VAPI format - toolCalls at root level (camelCase)
    else if (req.body.toolCalls && req.body.toolCalls.length > 0) {
      console.log('Case 2: Detected VAPI format with toolCalls at root');
      const toolCall = req.body.toolCalls[0];
      toolCallId = toolCall.id;
      const args = toolCall.function.arguments;
      console.log('Arguments type:', typeof args);
      console.log('Raw arguments:', args);
      try {
        let parsedArgs = args;
        if (typeof args === 'string') {
          let cleanArgs = args.trim();
          cleanArgs = cleanArgs.replace(/\\"/g, '"');
          parsedArgs = JSON.parse(cleanArgs);
        }
        console.log('Parsed arguments:', parsedArgs);
        ({ name, date, time, title } = parsedArgs);
      } catch (parseError) {
        console.error('Failed to parse arguments JSON:', parseError);
        return res.status(400).json({
          success: false,
          error: 'Invalid JSON in tool call arguments',
          tool_call_id: toolCallId
        });
      }
    }
    // Case 3: Direct format (useful for curl/testing)
    else if (req.body && (req.body.name || req.body.date || req.body.time)) {
      console.log('Case 3: Detected direct format (testing/curl)');
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

    // Sanitize inputs (trim strings)
    name = (name || '').trim();
    date = (date || '').trim();
    time = (time || '').trim();
    title = title ? title.trim() : undefined;

    console.log('Extracted values:');
    console.log(' name:', name, '(type:', typeof name, ')');
    console.log(' date:', date, '(type:', typeof date, ')');
    console.log(' time:', time, '(type:', typeof time, ')');
    console.log(' title:', title, '(type:', typeof title, ')');

    // Validate required fields (title is optional)
    if (!name) {
      console.error('ERROR: Missing name');
      return res.status(400).json({
        success: false,
        error: 'Missing required field: name',
        tool_call_id: toolCallId
      });
    }
    if (!date) {
      console.error('ERROR: Missing date');
      return res.status(400).json({
        success: false,
        error: 'Missing required field: date',
        tool_call_id: toolCallId
      });
    }
    if (!time) {
      console.error('ERROR: Missing time');
      return res.status(400).json({
        success: false,
        error: 'Missing required field: time',
        tool_call_id: toolCallId
      });
    }

    console.log('✅ All validations passed. Creating calendar event...');

    // Call Google Calendar service
    let result;
    try {
      result = await createCalendarEvent(name, date, time, title);
      console.log('✅ Calendar event created successfully!');
      console.log('Event ID:', result.eventId);
      console.log('Event Link:', result.eventLink);
    } catch (serviceError) {
      console.error('❌ Service error in createCalendarEvent:', serviceError.message);
      console.error('Full service error:', serviceError);
      // Still return 200 for Vapi, but flag error
      return res.status(200).json({
        success: false,
        error: `Failed to create event: ${serviceError.message}`,
        tool_call_id: toolCallId
      });
    }

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
require('dotenv').config();
const { createCalendarEvent } = require('./calendarService');

async function testCalendarCreation() {
  console.log('🧪 Testing Google Calendar Event Creation\n');

  try {
    // Test data - Change to tomorrow's date
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const testDate = tomorrow.toISOString().split('T')[0]; // YYYY-MM-DD
    const testTime = '14:00'; // 2:00 PM
    const testName = 'Test User';
    const testTitle = 'Test Meeting from Voice Agent';

    console.log('Test Parameters:');
    console.log(`  Name: ${testName}`);
    console.log(`  Date: ${testDate}`);
    console.log(`  Time: ${testTime}`);
    console.log(`  Title: ${testTitle}\n`);

    console.log('Creating event...\n');

    const result = await createCalendarEvent(testName, testDate, testTime, testTitle);

    console.log('✅ SUCCESS! Event created:\n');
    console.log(`  Event ID: ${result.eventId}`);
    console.log(`  Event Link: ${result.eventLink}`);
    console.log(`  Summary: ${result.summary}`);
    console.log(`  Start: ${result.start}`);
    console.log(`  End: ${result.end}\n`);
    
    console.log('🎉 Check your Google Calendar to see the event!');

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    console.error('\nPossible issues:');
    console.error('  1. Check your .env file has correct credentials');
    console.error('  2. Verify Google Calendar API is enabled');
    console.error('  3. Confirm refresh token is valid');
    console.error('  4. Make sure you added yourself as test user in OAuth consent screen');
  }
}

testCalendarCreation();
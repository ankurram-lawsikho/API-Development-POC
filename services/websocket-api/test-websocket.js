/**
 * WebSocket API Test Script
 * 
 * This script demonstrates how to test the WebSocket API programmatically.
 * Run with: node test-websocket.js
 */

const { io } = require('socket.io-client');

// Configuration
const WEBSOCKET_URL = 'http://localhost:3004';
// No JWT token needed - authentication removed for demo
const TEST_ROOM_ID = 'test-room-123';

// Create WebSocket connection
const socket = io(WEBSOCKET_URL, {
  transports: ['websocket', 'polling']
});

// Test results
let testsPassed = 0;
let testsFailed = 0;
const testResults = [];

function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️';
  console.log(`[${timestamp}] ${prefix} ${message}`);
}

function runTest(testName, testFunction) {
  log(`Running test: ${testName}`, 'info');
  try {
    testFunction();
    testsPassed++;
    testResults.push({ name: testName, status: 'PASSED' });
    log(`Test passed: ${testName}`, 'success');
  } catch (error) {
    testsFailed++;
    testResults.push({ name: testName, status: 'FAILED', error: error.message });
    log(`Test failed: ${testName} - ${error.message}`, 'error');
  }
}

// Connection Events
socket.on('connect', () => {
  log('Connected to WebSocket server', 'success');
  
  // Run tests after connection
  setTimeout(() => {
    runTests();
  }, 1000);
});

socket.on('disconnect', (reason) => {
  log(`Disconnected: ${reason}`, 'error');
});

socket.on('connect_error', (error) => {
  log(`Connection error: ${error.message}`, 'error');
  process.exit(1);
});

// Event listeners for testing
let receivedEvents = {};

socket.on('room_joined', (data) => {
  receivedEvents.room_joined = data;
  log(`Received room_joined event: ${JSON.stringify(data)}`, 'success');
});

socket.on('room_left', (data) => {
  receivedEvents.room_left = data;
  log(`Received room_left event: ${JSON.stringify(data)}`, 'success');
});

socket.on('message_sent', (data) => {
  receivedEvents.message_sent = data;
  log(`Received message_sent event: ${JSON.stringify(data)}`, 'success');
});

socket.on('user_typing', (data) => {
  receivedEvents.user_typing = data;
  log(`Received user_typing event: ${JSON.stringify(data)}`, 'success');
});

socket.on('error', (data) => {
  log(`Received error event: ${JSON.stringify(data)}`, 'error');
});

// Test functions
function testConnection() {
  if (!socket.connected) {
    throw new Error('Socket is not connected');
  }
}

function testJoinRoom() {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('Timeout waiting for room_joined event'));
    }, 5000);

    socket.once('room_joined', (data) => {
      clearTimeout(timeout);
      if (data.roomId === TEST_ROOM_ID) {
        resolve(data);
      } else {
        reject(new Error(`Expected roomId ${TEST_ROOM_ID}, got ${data.roomId}`));
      }
    });

    socket.emit('join_room', { roomId: TEST_ROOM_ID });
  });
}

function testLeaveRoom() {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('Timeout waiting for room_left event'));
    }, 5000);

    socket.once('room_left', (data) => {
      clearTimeout(timeout);
      if (data.roomId === TEST_ROOM_ID) {
        resolve(data);
      } else {
        reject(new Error(`Expected roomId ${TEST_ROOM_ID}, got ${data.roomId}`));
      }
    });

    socket.emit('leave_room', { roomId: TEST_ROOM_ID });
  });
}

function testSendMessage() {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('Timeout waiting for message_sent event'));
    }, 5000);

    socket.once('message_sent', (data) => {
      clearTimeout(timeout);
      if (data.message.content === 'Test message from Node.js') {
        resolve(data);
      } else {
        reject(new Error(`Expected message content 'Test message from Node.js', got '${data.message.content}'`));
      }
    });

    socket.emit('send_message', {
      roomId: TEST_ROOM_ID,
      content: 'Test message from Node.js',
      type: 'text'
    });
  });
}

function testTypingEvents() {
  return new Promise((resolve, reject) => {
    let typingStartReceived = false;
    let typingStopReceived = false;

    const timeout = setTimeout(() => {
      reject(new Error('Timeout waiting for typing events'));
    }, 5000);

    const checkComplete = () => {
      if (typingStartReceived && typingStopReceived) {
        clearTimeout(timeout);
        resolve({ typingStart: true, typingStop: true });
      }
    };

    socket.once('user_typing', (data) => {
      if (data.isTyping) {
        typingStartReceived = true;
        log('Received typing_start event', 'success');
      } else {
        typingStopReceived = true;
        log('Received typing_stop event', 'success');
      }
      checkComplete();
    });

    // Start typing
    socket.emit('typing_start', { roomId: TEST_ROOM_ID });
    
    // Stop typing after 1 second
    setTimeout(() => {
      socket.emit('typing_stop', { roomId: TEST_ROOM_ID });
    }, 1000);
  });
}

// Main test runner
async function runTests() {
  log('Starting WebSocket API tests...', 'info');
  
  try {
    // Test 1: Connection
    runTest('Connection Test', testConnection);
    
    // Test 2: Join Room
    await runTest('Join Room Test', async () => {
      await testJoinRoom();
    });
    
    // Test 3: Send Message
    await runTest('Send Message Test', async () => {
      await testSendMessage();
    });
    
    // Test 4: Typing Events
    await runTest('Typing Events Test', async () => {
      await testTypingEvents();
    });
    
    // Test 5: Leave Room
    await runTest('Leave Room Test', async () => {
      await testLeaveRoom();
    });
    
  } catch (error) {
    log(`Test execution error: ${error.message}`, 'error');
  }
  
  // Print test results
  log('\n=== TEST RESULTS ===', 'info');
  testResults.forEach(result => {
    const status = result.status === 'PASSED' ? '✅' : '❌';
    log(`${status} ${result.name}: ${result.status}`, result.status === 'PASSED' ? 'success' : 'error');
    if (result.error) {
      log(`   Error: ${result.error}`, 'error');
    }
  });
  
  log(`\nTotal: ${testsPassed} passed, ${testsFailed} failed`, testsFailed === 0 ? 'success' : 'error');
  
  // Disconnect and exit
  socket.disconnect();
  process.exit(testsFailed === 0 ? 0 : 1);
}

// Handle process termination
process.on('SIGINT', () => {
  log('Test interrupted by user', 'info');
  socket.disconnect();
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  log(`Uncaught exception: ${error.message}`, 'error');
  socket.disconnect();
  process.exit(1);
});

// Start the test
log('WebSocket API Test Script Started', 'info');
log(`Connecting to: ${WEBSOCKET_URL}`, 'info');
log(`Using token: ${AUTH_TOKEN.substring(0, 20)}...`, 'info');

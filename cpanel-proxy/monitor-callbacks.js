#!/usr/bin/env node

/**
 * PAN Services Callback Monitor
 * 
 * This script monitors the proxy server callback logs and alerts on failures.
 * Run this on your cPanel server to track callback delivery issues in real-time.
 * 
 * Usage:
 *   node monitor-callbacks.js
 */

const fs = require('fs');
const path = require('path');

// Configuration
const LOG_DIR = '/path/to/cpanel-proxy'; // Update this path
const CHECK_INTERVAL = 10000; // Check every 10 seconds
const ALERT_THRESHOLD = 3; // Alert after 3 consecutive failures

// Log files to monitor
const LOG_FILES = {
    incoming: path.join(LOG_DIR, 'callback_logs.txt'),
    forwarding: path.join(LOG_DIR, 'callback_forward_logs.txt'),
    success: path.join(LOG_DIR, 'callback_success.txt'),
    failures: path.join(LOG_DIR, 'callback_failures.txt'),
    errors: path.join(LOG_DIR, 'callback_errors.txt')
};

// State tracking
let lastPositions = {};
let failureCount = 0;
let stats = {
    total: 0,
    success: 0,
    failures: 0,
    errors: 0
};

/**
 * Read new lines from a file since last position
 */
function readNewLines(filePath) {
    if (!fs.existsSync(filePath)) {
        return [];
    }

    const currentSize = fs.statSync(filePath).size;
    const lastPosition = lastPositions[filePath] || 0;

    if (currentSize < lastPosition) {
        // File was rotated or truncated
        lastPositions[filePath] = 0;
        return [];
    }

    if (currentSize === lastPosition) {
        // No new data
        return [];
    }

    const buffer = Buffer.alloc(currentSize - lastPosition);
    const fd = fs.openSync(filePath, 'r');
    fs.readSync(fd, buffer, 0, buffer.length, lastPosition);
    fs.closeSync(fd);

    lastPositions[filePath] = currentSize;

    const content = buffer.toString('utf8');
    return content.trim().split('\n').filter(line => line.trim());
}

/**
 * Process incoming callbacks
 */
function processIncomingCallbacks() {
    const lines = readNewLines(LOG_FILES.incoming);

    lines.forEach(line => {
        try {
            const data = JSON.parse(line);
            stats.total++;

            console.log(`\n📞 [INCOMING] Callback received at ${data.timestamp}`);
            console.log(`   Order ID: ${data.query_params?.txid || 'N/A'}`);
            console.log(`   Status: ${data.query_params?.status || 'N/A'}`);
            console.log(`   OPID: ${data.query_params?.opid || 'N/A'}`);
        } catch (e) {
            console.error('Failed to parse incoming callback:', e.message);
        }
    });
}

/**
 * Process successful forwards
 */
function processSuccesses() {
    const lines = readNewLines(LOG_FILES.success);

    lines.forEach(line => {
        try {
            const data = JSON.parse(line);
            stats.success++;
            failureCount = 0; // Reset failure counter

            console.log(`\n✅ [SUCCESS] Callback forwarded successfully`);
            console.log(`   Order ID: ${data.txid}`);
            console.log(`   Status: ${data.status}`);
            console.log(`   Attempt: ${data.attempt}/${3}`);
            console.log(`   HTTP Code: ${data.http_code}`);
        } catch (e) {
            console.error('Failed to parse success log:', e.message);
        }
    });
}

/**
 * Process failures
 */
function processFailures() {
    const lines = readNewLines(LOG_FILES.failures);

    lines.forEach(line => {
        try {
            const data = JSON.parse(line);
            stats.failures++;
            failureCount++;

            console.log(`\n❌ [FAILURE] Callback forward failed after ${data.attempts} attempts`);
            console.log(`   Order ID: ${data.txid}`);
            console.log(`   Status: ${data.status}`);
            console.log(`   Last Error: ${data.last_error}`);
            console.log(`   Last HTTP Code: ${data.last_http_code}`);

            if (failureCount >= ALERT_THRESHOLD) {
                console.log(`\n🚨 [ALERT] ${failureCount} consecutive failures detected!`);
                console.log(`   This may indicate a problem with the Vercel endpoint.`);
            }
        } catch (e) {
            console.error('Failed to parse failure log:', e.message);
        }
    });
}

/**
 * Process errors
 */
function processErrors() {
    const lines = readNewLines(LOG_FILES.errors);

    lines.forEach(line => {
        try {
            const data = JSON.parse(line);
            stats.errors++;

            console.log(`\n⚠️ [ERROR] Callback validation error`);
            console.log(`   Error: ${data.error}`);
            console.log(`   Data: ${JSON.stringify(data.data)}`);
        } catch (e) {
            console.error('Failed to parse error log:', e.message);
        }
    });
}

/**
 * Display statistics
 */
function displayStats() {
    const successRate = stats.total > 0 ? ((stats.success / stats.total) * 100).toFixed(2) : 0;

    console.log(`\n📊 [STATS] Callback Statistics`);
    console.log(`   Total Callbacks: ${stats.total}`);
    console.log(`   Successful: ${stats.success}`);
    console.log(`   Failed: ${stats.failures}`);
    console.log(`   Errors: ${stats.errors}`);
    console.log(`   Success Rate: ${successRate}%`);
    console.log(`   Consecutive Failures: ${failureCount}`);
}

/**
 * Main monitoring loop
 */
function monitor() {
    console.log('🔍 Checking for new callbacks...');

    processIncomingCallbacks();
    processSuccesses();
    processFailures();
    processErrors();

    // Display stats every 10 checks (100 seconds)
    if (Math.random() < 0.1) {
        displayStats();
    }
}

/**
 * Initialize monitoring
 */
function init() {
    console.log('🚀 PAN Services Callback Monitor Started');
    console.log(`📁 Monitoring directory: ${LOG_DIR}`);
    console.log(`⏱️  Check interval: ${CHECK_INTERVAL}ms`);
    console.log(`🚨 Alert threshold: ${ALERT_THRESHOLD} consecutive failures\n`);

    // Initialize file positions
    Object.values(LOG_FILES).forEach(filePath => {
        if (fs.existsSync(filePath)) {
            lastPositions[filePath] = fs.statSync(filePath).size;
        }
    });

    // Start monitoring
    setInterval(monitor, CHECK_INTERVAL);

    // Display stats every minute
    setInterval(displayStats, 60000);
}

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n\n👋 Shutting down monitor...');
    displayStats();
    process.exit(0);
});

// Start the monitor
init();

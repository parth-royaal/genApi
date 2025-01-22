// static/js/tradingSimulator.js

// State Variables
let totalTrades = 0;
let profitableTrades = 0;
let totalProfit = 0;
let longTrades = 0;
let shortTrades = 0;
let isPaused = false;
let isLong = false;
let isShort = false;
let entryPrice = 0;
let latestPrice = null; // Track the latest price from WebSocket
let activeTrade = null; // Track the active trade (Long or Short)

// DOM Elements
const floatingRectangleId = 'floatingRectangle';

// Helper Functions
function formatTime(timestamp) {
    return new Date(timestamp).toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
    });
}

function calculateProfit(entryPrice, exitPrice, isLong) {
    return (((isLong ? exitPrice - entryPrice : entryPrice - exitPrice) / entryPrice) * 100).toFixed(2);
}

function logChartUpdate(message) {
    document.getElementById('chartUpdateLog').innerHTML = `Chart Updates<br>${message}`;
}

function logTrade(message) {
    const tradeLog = document.getElementById('tradeLog');
    tradeLog.innerHTML += `<div class="log-entry">${message}</div>`;
    tradeLog.scrollTop = tradeLog.scrollHeight; // Auto-scroll to the latest log
}

function updateProfitLog() {
    const profitPercentage = totalProfit.toFixed(2);
    const profitClass = profitPercentage >= 0 ? 'profit-positive' : 'profit-negative';

    document.getElementById('profitLog').innerHTML = `
        Overall Profit<br>
        <span class="${profitClass}">Total Profit: ${profitPercentage}%</span><br>
        Total Trades: ${totalTrades}<br>
        Profitable Trades: ${profitableTrades}<br>
        Long Trades: ${longTrades}<br>
        Short Trades: ${shortTrades}
    `;
}

// Floating Rectangle Functions
function initializeFloatingRectangle() {
    const floatingRectangle = document.getElementById(floatingRectangleId);
    let isDragging = false;
    let offsetX = 0;
    let offsetY = 0;

    const startDrag = (e) => {
        isDragging = true;
        const rect = floatingRectangle.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        offsetX = clientX - rect.left;
        offsetY = clientY - rect.top;
        floatingRectangle.style.cursor = 'grabbing';
    };

    const onDrag = (e) => {
        if (!isDragging) return;
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        floatingRectangle.style.left = `${clientX - offsetX}px`;
        floatingRectangle.style.top = `${clientY - offsetY}px`;
    };

    const endDrag = () => {
        isDragging = false;
        floatingRectangle.style.cursor = 'grab';
    };

    floatingRectangle.addEventListener('mousedown', startDrag);
    floatingRectangle.addEventListener('touchstart', startDrag, { passive: false });
    document.addEventListener('mousemove', onDrag);
    document.addEventListener('touchmove', onDrag, { passive: false });
    document.addEventListener('mouseup', endDrag);
    document.addEventListener('touchend', endDrag);
}

// Trade Functions
function executeLongTrade() {
    if (!latestPrice) {
        alert("No price data available. Please wait for the WebSocket to update.");
        return;
    }

    if (isLong) {
        const profit = parseFloat(calculateProfit(entryPrice, latestPrice, true));
        logTrade(`Long Close: ${profit}%, Price: $${latestPrice.toFixed(2)}, Time: ${formatTime(Date.now())}`);
        totalTrades++;
        totalProfit += profit;
        if (profit > 0) profitableTrades++;
        longTrades++;
        activeTrade = null; // Clear active trade
    } else {
        logTrade(`Long Entry: Price: $${latestPrice.toFixed(2)}, Time: ${formatTime(Date.now())}`);
        activeTrade = { type: 'Long', entryPrice: latestPrice }; // Set active trade
    }
    isLong = !isLong;
    entryPrice = latestPrice;
    updateProfitLog();
}

function executeShortTrade() {
    if (!latestPrice) {
        alert("No price data available. Please wait for the WebSocket to update.");
        return;
    }

    if (isShort) {
        const profit = parseFloat(calculateProfit(entryPrice, latestPrice, false));
        logTrade(`Short Close: ${profit}%, Price: $${latestPrice.toFixed(2)}, Time: ${formatTime(Date.now())}`);
        totalTrades++;
        totalProfit += profit;
        if (profit > 0) profitableTrades++;
        shortTrades++;
        activeTrade = null; // Clear active trade
    } else {
        logTrade(`Short Entry: Price: $${latestPrice.toFixed(2)}, Time: ${formatTime(Date.now())}`);
        activeTrade = { type: 'Short', entryPrice: latestPrice }; // Set active trade
    }
    isShort = !isShort;
    entryPrice = latestPrice;
    updateProfitLog();
}

function togglePause() {
    isPaused = !isPaused;
    logTrade(isPaused ? 'Paused' : 'Resumed');
}

// Update Real-Time Profit/Loss
function updateRealTimeProfitLoss() {
    if (activeTrade && latestPrice) {
        const profit = parseFloat(calculateProfit(activeTrade.entryPrice, latestPrice, activeTrade.type === 'Long'));
        const profitClass = profit >= 0 ? 'profit-positive' : 'profit-negative';
        const tradeLog = document.getElementById('tradeLog');

        // Find the last log entry for the active trade
        const lastLogEntry = tradeLog.querySelector('.log-entry:last-child');
        if (lastLogEntry) {
            // Append real-time profit/loss to the last log entry
            lastLogEntry.innerHTML += `<br><span class="${profitClass}">Real-Time P/L: ${profit}%</span>`;
        }
    }
}

// Main Function
function initializeTradingSimulator() {
    initializeFloatingRectangle();

    // Attach event listeners
    document.getElementById('l').onclick = executeLongTrade;
    document.getElementById('s').onclick = executeShortTrade;
    document.getElementById('p').onclick = togglePause;

    // Connect to WebSocket for real-time updates
    const ws = new WebSocket('ws://localhost:5000/realtime');

    ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        latestPrice = data.close; // Update the latest price
        logChartUpdate(`Price: $${latestPrice.toFixed(2)}, Time: ${formatTime(data.time)}`);

        // Update real-time profit/loss
        updateRealTimeProfitLoss();
    };

    ws.onerror = (error) => {
        console.error('WebSocket error:', error);
    };

    ws.onclose = () => {
        console.log('WebSocket connection closed');
    };
}

// Export the function to update the latest price
function updateLatestPrice(price) {
    latestPrice = price;
    logChartUpdate(`Price: $${latestPrice.toFixed(2)}, Time: ${formatTime(Date.now())}`);
}

// Export the initialize function
window.initializeTradingSimulator = initializeTradingSimulator;
window.updateLatestPrice = updateLatestPrice;
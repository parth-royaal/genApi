How the Widget Receives Updates
WebSocket Connection:

The TradingView widget uses the subscribeBars method in the Datafeed to connect to the WebSocket endpoint (ws://localhost:5000/realtime).

When a new message is received from the WebSocket, the onRealtimeCallback function is called with the latest price data.

Datafeed Implementation:

The subscribeBars method in the Datafeed is responsible for handling real-time updates.

The WebSocket messages are parsed, and the onRealtimeCallback function is used to update the TradingView chart with the latest price data.


Instead of having the trading simulator connect to the WebSocket independently, we can use the same WebSocket connection that the TradingView widget is using


In the index.html file, we will modify the subscribeBars method in the TradingView Datafeed to call the updateLatestPrice function whenever a new price update is received.
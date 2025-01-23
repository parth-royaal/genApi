from flask import Flask, render_template_string
from flask_socketio import SocketIO
from flask_cors import CORS

# Create Flask and SocketIO instances
app = Flask(__name__)
CORS(app)  # Enable CORS for all routes
app.config['SECRET_KEY'] = 'your_secret_key'
socketio = SocketIO(app, cors_allowed_origins="*")  # Allow WebSocket connections from any origin

# Function to reverse the input string
def rev(input_string):
    return input_string[::-1]

# HTML Template with WebSocket client
html_template = """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reverse String Example</title>
    <script src="https://cdn.socket.io/4.5.1/socket.io.min.js"></script>
    <script>
        document.addEventListener('DOMContentLoaded', () => {
            const socket = io();  // Connect to the WebSocket server

            // Listen for the 'response' event and update the response section
            socket.on('response', (data) => { 
                document.getElementById('response').textContent = "Reversed String: " + data.reversed;
            });

            // Function to send the input text to the server when user types
            document.getElementById('inputText').addEventListener('input', (event) => {
                const inputText = event.target.value;
                socket.emit('reverse_input', { text: inputText });  // Send the input text to the server
            });
        });
    </script>
</head>
<body>
    <h1>Reverse String</h1>

    <!-- Input field for the user to type text -->
    <input type="text" id="inputText" placeholder="Type something...">

    <div>
        <h3>Response:</h3>
        <p id="response">Waiting for input...</p>
    </div>
</body>
</html>
"""

# Serve the HTML template at the home route
@app.route('/')
def index():
    return render_template_string(html_template)

# Handle the reverse string event and send the response back to the client
@socketio.on('reverse_input')
def handle_reverse(data):
    input_text = data['text']  # Get the input text from the client
    reversed_text = rev(input_text)  # Reverse the text
    socketio.emit('response', {'reversed': reversed_text})  # Emit the reversed text back to the client

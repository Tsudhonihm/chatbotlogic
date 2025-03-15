import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';

// Message Interface
interface Message {
  id: string;
  sender: string;
  message: string;
  timestamp: Date;
}

// API URL Configuration
const API_URL = import.meta.env.PROD
  ? 'https://chatbotlogic.vercel.app' // Production backend URL
  : '/api'; // Development backend URL

function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [userInput, setUserInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Function to add a new message to the chat
  const addMessage = (sender: string, message: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      sender,
      message,
      timestamp: new Date(),
    };
    setMessages((prevMessages) => [...prevMessages, newMessage]);
  };

  // Handle sending a message
  const handleSendMessage = async () => {
    if (!userInput.trim() || isLoading) return;

    setIsLoading(true); // Start loading state
    addMessage('You', userInput); // Add user's message to the chat
    setUserInput(''); // Clear the input field

    try {
      // Send the message to the backend API
      const response = await axios.post(`${API_URL}/message`, { message: userInput });

      // Validate the response
      if (response?.data?.response) {
        addMessage('Bot', response.data.response); // Add bot's response to the chat
      } else {
        console.error('Invalid response from the server:', response);
        addMessage('Bot', 'Sorry, I received an invalid response. Please try again.');
      }
    } catch (error) {
      // Handle errors gracefully
      console.error('Error fetching bot response:', error);

      if (error?.response) {
        console.error('Server responded with status:', error.response.status);
        console.error('Response data:', error.response.data);
        addMessage('Bot', `Error: ${error.response.statusText}`);
      } else if (error?.request) {
        console.error('No response received from the server.');
        addMessage('Bot', 'Error: No response from the server. Please check your connection.');
      } else {
        console.error('Unexpected error:', error.message);
        addMessage('Bot', 'Sorry, an unexpected error occurred. Please try again.');
      }
    } finally {
      setIsLoading(false); // Stop loading state regardless of success or failure
    }
  };

  // Scroll to the bottom of the chat container when messages update
  useEffect(() => {
    if (messagesContainerRef.current) {
      const scrollContainer = messagesContainerRef.current;
      scrollContainer.scrollTop = scrollContainer.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-100 to-gray-200">
      {/* Header Section */}
      <div className="max-w-7xl mx-auto p-4">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-8">
          {/* Top Bar */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-800 p-4">
            <div className="flex items-center justify-between">
              {/* Title */}
              <motion.h1
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className="text-3xl font-bold text-white"
              >
                Welcome to Anything Boes Studio
              </motion.h1>
              {/* Social Links */}
            </div>
          </div>
        </div>

        {/* Chat Messages */}
        <div
          ref={messagesContainerRef}
          className="w-full max-w-2xl p-4 overflow-y-auto"
          style={{ height: '80vh' }}
        >
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`my-2 p-3 rounded-lg ${
                msg.sender === 'You' ? 'bg-blue-500 self-end' : 'bg-gray-700 self-start'
              }`}
            >
              <p className="text-sm">{msg.message}</p>
              <span className="text-xs text-gray-400">{msg.timestamp.toLocaleTimeString()}</span>
            </div>
          ))}
        </div>

        {/* Input Section */}
        <div className="w-full max-w-2xl p-4 flex gap-2">
          <input
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black placeholder-gray-500"
            disabled={isLoading}
          />
          <motion.button
            onClick={handleSendMessage}
            disabled={isLoading}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Send
          </motion.button>
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center text-white mt-8 pb-4">
        © 2025 Anything Boes Design Studio. All rights reserved.
      </footer>
    </div>
  );
}

export default App;

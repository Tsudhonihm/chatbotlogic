from flask import Flask, request, jsonify
from flask_cors import CORS
from transformers import AutoTokenizer, AutoModelForCausalLM
import os

# Initialize Flask app
app = Flask(__name__)

# Enable CORS for the frontend domain
CORS(app, origins=["https://anything-boes-chat-git-main-peter-boes-projects.vercel.app"])

# Load environment variables
HUGGINGFACE_API_KEY = os.getenv("HUGGINGFACE_API_KEY")

# Load tokenizer and model (DialoGPT-small)
print("Loading model and tokenizer...")
tokenizer = AutoTokenizer.from_pretrained("microsoft/DialoGPT-small", padding_side="left")
model = AutoModelForCausalLM.from_pretrained("microsoft/DialoGPT-small")
print("Model and tokenizer loaded successfully!")

@app.route('/message', methods=['POST'])
def message():
    try:
        # Parse JSON payload from the request
        data = request.get_json()

        # Validate input
        if not data or 'message' not in data:
            return jsonify({'error': 'Message cannot be empty'}), 400
        
        user_message = data['message'].strip()
        
        if not user_message:
            return jsonify({'error': 'Message cannot be empty'}), 400
        if len(user_message) > 500:
            return jsonify({'error': 'Message is too long'}), 400
        
        # Encode the user's input
        inputs = tokenizer.encode(user_message + tokenizer.eos_token, return_tensors="pt")
        
        # Generate a response using DialoGPT
        outputs = model.generate(
            inputs,
            max_length=1000,  # Maximum length of the generated response
            pad_token_id=tokenizer.eos_token_id,
            no_repeat_ngram_size=2,  # Prevent repeating phrases
            top_p=0.95,              # Top-p sampling for more natural responses
            top_k=50,                # Top-k sampling
            do_sample=True           # Enable sampling for diverse responses
        )
        
        # Decode the bot's response
        bot_response = tokenizer.decode(outputs[:, inputs.shape[-1]:][0], skip_special_tokens=True)
        
        # Return the response
        return jsonify({"response": bot_response}), 200
    
    except Exception as e:
        app.logger.error(f"Error: {str(e)}")  # Log the error for debugging
        return jsonify({"error": "An unexpected error occurred"}), 500

if __name__ == '__main__':
    # Get the port from the environment variable or default to 5000
    port = int(os.getenv('PORT', 5000))
    app.run(host='0.0.0.0', port=port)

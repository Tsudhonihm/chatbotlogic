from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from transformers import AutoTokenizer, AutoModelForCausalLM
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = Flask(__name__)

# Configure CORS with environment variable
allowed_origins = os.getenv('ALLOWED_ORIGINS', '').split(',')
CORS(app, origins=allowed_origins)

# Load DialoGPT tokenizer and model
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
        input_ids = tokenizer.encode(user_message + tokenizer.eos_token, return_tensors="pt")
        
        # Generate a response using DialoGPT
        response_ids = model.generate(
            input_ids,
            max_length=int(os.getenv('HF_MAX_LENGTH', 1000)),
            pad_token_id=tokenizer.eos_token_id,
            no_repeat_ngram_size=2,
            top_p=float(os.getenv('HF_TOP_P', 0.95)),
            top_k=int(os.getenv('HF_TOP_K', 50)),
            do_sample=True
        )
        
        # Decode the bot's response
        bot_response = tokenizer.decode(response_ids[:, input_ids.shape[-1]:][0], skip_special_tokens=True)
        
        return jsonify({'response': bot_response}), 200
    
    except Exception as e:
        app.logger.error(f"Error: {str(e)}")
        return jsonify({'error': 'An unexpected error occurred'}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)

import os
import openai
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Fetch the YNAB access token and base URL
openai.api_key = os.getenv("AI_OPENAI_API_KEY")

def suggest_category(transaction, categories):
    """Suggest a category for a transaction using OpenAI."""
    category_names = ", ".join([category["name"] for category in categories])
    prompt = f"""
    Suggest the most suitable category for the following transaction based on these available categories: {category_names}.
    Transaction Details:
    - Description: {transaction['payee_name']}
    - Amount: {transaction['amount']}
    - Date: {transaction['date']}

    Return only the name of the category.
    """

    response = openai.ChatCompletion.create(
        model="gpt-4",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.2
    )

    return response['choices'][0]['message']['content'].strip()

import os
from google import genai
from dotenv import load_dotenv

# بارگذاری کلید API از فایل .env
load_dotenv()
API_KEY = os.getenv("GEMINI_API_KEY")
print(f"API Key loaded: {API_KEY[:5]}... (Hidden for security)")

try:
    print("در حال ارتباط با سرورهای گوگل...")
    client = genai.Client(api_key=API_KEY)
    response = client.models.generate_content(
        model='gemini-2.0-flash',
        contents='سلام! آیا صدای من را می‌شنوی؟ به زبان دری جواب بده.'
    )
    print("\n✅ پاسخ گوگل دریافت شد:")
    print(response.text)
except Exception as e:
    print("\n❌ خطا در اتصال به گوگل. لطفاً VPN یا تحریم‌شکن خود را روشن کنید.")
    print("جزئیات خطا:", str(e))
import os
from dotenv import load_dotenv

load_dotenv()

OPENCODE_API_KEY = os.getenv("OPENCODE_API_KEY", "")
OPENCODE_MODEL = os.getenv("OPENCODE_MODEL", "big-pickle")
OPENCODE_URL = os.getenv("OPENCODE_URL", "https://opencode.ai/zen/v1/chat/completions")

MAX_FILE_SIZE_MB = 20
UPLOAD_DIR = "uploads"
DATABASE_URL = "sqlite:///./autodataset.db"

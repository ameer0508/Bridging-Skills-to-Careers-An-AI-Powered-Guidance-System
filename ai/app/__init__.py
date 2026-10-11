import os
from pathlib import Path
from dotenv import load_dotenv

# Ensure .env in the ai package directory is loaded into os.environ
env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

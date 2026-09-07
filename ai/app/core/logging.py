import logging
import sys

def setup_logging() -> logging.Logger:
    # Basic log configuration targeting stdout
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s [%(levelname)s] %(name)s - %(message)s',
        handlers=[
            logging.StreamHandler(sys.stdout)
        ]
    )
    
    # Establish parent logger for the AI service namespaces
    logger = logging.getLogger("skillbridge-ai")
    logger.setLevel(logging.INFO)
    return logger

logger = setup_logging()

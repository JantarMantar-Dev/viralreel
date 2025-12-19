import logging
import sys

def configure_logging(name: str = "videoapp", level: int = logging.INFO):
    """
    Configures a standardized logger with formatted output.
    """
    logger = logging.getLogger(name)
    logger.setLevel(level)
    
    # Check if handlers already exist to avoid duplicate logs in watch mode/reloads
    if not logger.handlers:
        handler = logging.StreamHandler(sys.stdout)
        formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - [%(filename)s:%(lineno)d] - %(message)s'
        )
        handler.setFormatter(formatter)
        logger.addHandler(handler)
    
    return logger

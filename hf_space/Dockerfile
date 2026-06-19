# VoiceAid Health — HuggingFace Spaces Docker Backend
# Uses Python 3.11 slim with ffmpeg for audio processing

FROM python:3.11-slim

# Install ffmpeg (required by pydub for audio format conversion)
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Install Python dependencies first (cached layer)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy app code
COPY app.py .

# HuggingFace Spaces expects the app to listen on port 7860
EXPOSE 7860

# Start the FastAPI server
CMD ["python", "app.py"]

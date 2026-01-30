/**
 * =====================================================
 * CLOUD RUN TRANSCODING MICROSERVICE - DEPLOYMENT GUIDE
 * =====================================================
 * 
 * This file contains the complete code for deploying the FFmpeg
 * transcoding microservice to Google Cloud Run.
 * 
 * COPY THE CODE BELOW TO YOUR LOCAL MACHINE AND DEPLOY!
 */

// ==================== DOCKERFILE ====================
export const DOCKERFILE = `
# Cloud Run FFmpeg Transcoding Service
FROM python:3.11-slim

# Install FFmpeg
RUN apt-get update && apt-get install -y \\
    ffmpeg \\
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy requirements and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create temp directory for processing
RUN mkdir -p /tmp/transcoding

# Set environment variables
ENV PORT=8080
ENV PYTHONUNBUFFERED=1

# Run the application
CMD ["python", "main.py"]
`;

// ==================== REQUIREMENTS.TXT ====================
export const REQUIREMENTS_TXT = `
flask==3.0.0
gunicorn==21.2.0
requests==2.31.0
google-cloud-storage==2.14.0
`;

// ==================== MAIN.PY ====================
export const MAIN_PY = `
"""
Cloud Run FFmpeg Transcoding Service
Handles audio normalization and chunking for Whisper transcription.
"""

import os
import json
import subprocess
import tempfile
import shutil
import logging
from flask import Flask, request, jsonify
import requests

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)

# Constants
TARGET_MAX_BYTES = 24_117_248  # 23MB safe limit
NORMALIZED_BITRATE_KBPS = 64
DEFAULT_CHUNK_DURATION_SEC = 2700  # 45 minutes
DEFAULT_OVERLAP_SEC = 3
SERVICE_TOKEN = os.environ.get('SERVICE_TOKEN', '')

def verify_auth(req):
    """Verify service-to-service authentication."""
    token = req.headers.get('X-SERVICE-TOKEN', '')
    if not SERVICE_TOKEN:
        logger.warning("SERVICE_TOKEN not configured - skipping auth")
        return True
    return token == SERVICE_TOKEN

def get_audio_info(file_path):
    """Get audio file information using ffprobe."""
    try:
        cmd = [
            'ffprobe', '-v', 'quiet', '-print_format', 'json',
            '-show_format', '-show_streams', file_path
        ]
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=60)
        if result.returncode != 0:
            logger.error(f"ffprobe error: {result.stderr}")
            return None
        
        data = json.loads(result.stdout)
        format_info = data.get('format', {})
        duration = float(format_info.get('duration', 0))
        
        audio_stream = None
        for stream in data.get('streams', []):
            if stream.get('codec_type') == 'audio':
                audio_stream = stream
                break
        
        return {
            'duration_sec': duration,
            'sample_rate': int(audio_stream.get('sample_rate', 0)) if audio_stream else 0,
            'channels': audio_stream.get('channels', 0) if audio_stream else 0,
            'codec': audio_stream.get('codec_name', 'unknown') if audio_stream else 'unknown',
            'bit_rate': int(format_info.get('bit_rate', 0)),
            'format': format_info.get('format_name', 'unknown')
        }
    except Exception as e:
        logger.error(f"Error getting audio info: {e}")
        return None

def normalize_audio(input_path, output_path):
    """Normalize audio to MP3 64kbps mono 16kHz."""
    try:
        cmd = [
            'ffmpeg', '-y', '-i', input_path,
            '-vn',  # No video
            '-ac', '1',  # Mono
            '-ar', '16000',  # 16kHz sample rate
            '-b:a', f'{NORMALIZED_BITRATE_KBPS}k',  # 64kbps
            '-f', 'mp3',
            output_path
        ]
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=600)
        if result.returncode != 0:
            logger.error(f"FFmpeg normalize error: {result.stderr}")
            return False
        return True
    except Exception as e:
        logger.error(f"Error normalizing audio: {e}")
        return False

def calculate_chunk_boundaries(duration_sec, chunk_duration_sec, overlap_sec):
    """Calculate chunk start/end times with overlap."""
    chunks = []
    current_start = 0
    chunk_index = 0
    
    while current_start < duration_sec:
        end_time = min(current_start + chunk_duration_sec, duration_sec)
        chunks.append({
            'index': chunk_index,
            'start_sec': current_start,
            'end_sec': end_time
        })
        current_start = end_time - overlap_sec
        chunk_index += 1
        
        if duration_sec - current_start < overlap_sec * 2:
            break
    
    return chunks

def split_audio(input_path, output_dir, chunks):
    """Split audio into chunks based on calculated boundaries."""
    chunk_files = []
    
    for chunk in chunks:
        output_file = os.path.join(output_dir, f"chunk_{chunk['index']:03d}.mp3")
        duration = chunk['end_sec'] - chunk['start_sec']
        
        cmd = [
            'ffmpeg', '-y', '-i', input_path,
            '-ss', str(chunk['start_sec']),
            '-t', str(duration),
            '-c', 'copy',
            output_file
        ]
        
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=300)
        if result.returncode != 0:
            logger.error(f"FFmpeg split error for chunk {chunk['index']}: {result.stderr}")
            continue
        
        chunk_size = os.path.getsize(output_file)
        chunk_files.append({
            'index': chunk['index'],
            'start_sec': chunk['start_sec'],
            'end_sec': chunk['end_sec'],
            'file_path': output_file,
            'size_bytes': chunk_size
        })
    
    return chunk_files

def download_file(url, output_path):
    """Download file from URL."""
    try:
        response = requests.get(url, stream=True, timeout=300)
        response.raise_for_status()
        with open(output_path, 'wb') as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)
        return True
    except Exception as e:
        logger.error(f"Download error: {e}")
        return False

def upload_file(file_path, put_url):
    """Upload file to pre-signed PUT URL."""
    try:
        with open(file_path, 'rb') as f:
            response = requests.put(
                put_url,
                data=f,
                headers={'Content-Type': 'audio/mpeg'},
                timeout=300
            )
            response.raise_for_status()
        return True
    except Exception as e:
        logger.error(f"Upload error: {e}")
        return False

@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'healthy', 'service': 'transcoding'})

@app.route('/transcode-and-split', methods=['POST'])
def transcode_and_split():
    if not verify_auth(request):
        return jsonify({'error': 'Unauthorized'}), 401
    
    try:
        data = request.get_json()
        source_url = data['sourceUrl']
        job_id = data['jobId']
        chunk_duration_sec = data.get('chunkDurationSec', DEFAULT_CHUNK_DURATION_SEC)
        overlap_sec = data.get('overlapSec', DEFAULT_OVERLAP_SEC)
        upload_targets = data.get('uploadTargets', {})
        storage_keys = data.get('storageKeys', {})
    except (KeyError, TypeError) as e:
        return jsonify({'error': f'Invalid request: {e}'}), 400
    
    work_dir = tempfile.mkdtemp(prefix=f'transcode_{job_id}_')
    
    try:
        # Step 1: Download
        logger.info(f"[{job_id}] Downloading source file...")
        source_file = os.path.join(work_dir, 'source_audio')
        if not download_file(source_url, source_file):
            return jsonify({'error': 'Failed to download source file'}), 500
        
        # Step 2: Get info
        source_info = get_audio_info(source_file)
        if not source_info:
            return jsonify({'error': 'Failed to analyze source file'}), 500
        
        logger.info(f"[{job_id}] Source: {source_info['duration_sec']:.1f}s")
        
        # Step 3: Normalize
        normalized_file = os.path.join(work_dir, 'audio_normalized.mp3')
        if not normalize_audio(source_file, normalized_file):
            return jsonify({'error': 'Failed to normalize audio'}), 500
        
        normalized_size = os.path.getsize(normalized_file)
        normalized_info = get_audio_info(normalized_file)
        
        # Step 4: Split if needed
        needs_splitting = normalized_size > TARGET_MAX_BYTES
        chunks_result = []
        
        if needs_splitting:
            chunk_boundaries = calculate_chunk_boundaries(
                normalized_info['duration_sec'], chunk_duration_sec, overlap_sec
            )
            
            chunks_dir = os.path.join(work_dir, 'chunks')
            os.makedirs(chunks_dir, exist_ok=True)
            chunk_files = split_audio(normalized_file, chunks_dir, chunk_boundaries)
            
            chunks_put_urls = upload_targets.get('chunksPutUrls', [])
            chunks_prefix = storage_keys.get('chunksPrefix', f'transcripts/{job_id}/chunks/')
            
            for i, chunk in enumerate(chunk_files):
                if i < len(chunks_put_urls):
                    if upload_file(chunk['file_path'], chunks_put_urls[i]):
                        chunks_result.append({
                            'index': chunk['index'],
                            'startSec': chunk['start_sec'],
                            'endSec': chunk['end_sec'],
                            'storageKey': f"{chunks_prefix}chunk_{chunk['index']:03d}.mp3",
                            'sizeBytes': chunk['size_bytes']
                        })
        
        # Step 5: Upload normalized
        normalized_put_url = upload_targets.get('normalizedPutUrl')
        normalized_storage_key = storage_keys.get('normalized', f'transcripts/{job_id}/audio_normalized.mp3')
        
        if normalized_put_url:
            upload_file(normalized_file, normalized_put_url)
        
        return jsonify({
            'success': True,
            'jobId': job_id,
            'sourceInfo': {
                'durationSec': source_info['duration_sec'],
                'codec': source_info['codec'],
                'sampleRate': source_info['sample_rate']
            },
            'normalizedAudio': {
                'storageKey': normalized_storage_key,
                'durationSec': normalized_info['duration_sec'],
                'sizeBytes': normalized_size
            },
            'chunks': chunks_result,
            'needsSplitting': needs_splitting
        })
        
    except Exception as e:
        logger.exception(f"[{job_id}] Unexpected error")
        return jsonify({'error': str(e)}), 500
    finally:
        shutil.rmtree(work_dir, ignore_errors=True)

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8080))
    app.run(host='0.0.0.0', port=port, debug=False)
`;

// ==================== DEPLOYMENT COMMANDS ====================
export const DEPLOYMENT_COMMANDS = `
# ============================================
# DEPLOYMENT TO GOOGLE CLOUD RUN
# ============================================

# 1. Set variables
export PROJECT_ID=your-gcp-project
export REGION=me-west1
export SERVICE_TOKEN=your-random-secret-token

# 2. Create project directory
mkdir transcoding-service && cd transcoding-service

# 3. Create files (copy the content from above)
# - Dockerfile
# - requirements.txt
# - main.py

# 4. Build and push
gcloud builds submit --tag gcr.io/$PROJECT_ID/transcoding-service

# 5. Deploy
gcloud run deploy transcoding-service \\
  --image gcr.io/$PROJECT_ID/transcoding-service \\
  --region $REGION \\
  --platform managed \\
  --memory 4Gi \\
  --cpu 2 \\
  --timeout 900 \\
  --concurrency 1 \\
  --max-instances 5 \\
  --set-env-vars "SERVICE_TOKEN=$SERVICE_TOKEN" \\
  --no-allow-unauthenticated

# 6. Get URL
gcloud run services describe transcoding-service \\
  --region $REGION \\
  --format 'value(status.url)'

# 7. Update Supabase secrets with the URL and TOKEN
`;

export default function TranscodingMicroserviceDoc() {
  return (
    <div className="p-8 max-w-4xl mx-auto" dir="ltr">
      <h1 className="text-2xl font-bold mb-4">Transcoding Microservice Documentation</h1>
      <p className="text-gray-600 mb-8">
        This component contains the complete code for the Cloud Run microservice.
        Copy the exported constants to create your deployment files.
      </p>
      
      <div className="space-y-6">
        <section>
          <h2 className="text-xl font-semibold mb-2">Files to Create:</h2>
          <ul className="list-disc list-inside space-y-1 text-gray-700">
            <li><code>Dockerfile</code> - Container definition with FFmpeg</li>
            <li><code>requirements.txt</code> - Python dependencies</li>
            <li><code>main.py</code> - Flask application</li>
          </ul>
        </section>
        
        <section>
          <h2 className="text-xl font-semibold mb-2">API Endpoint:</h2>
          <code className="block bg-gray-100 p-3 rounded">
            POST /transcode-and-split
          </code>
        </section>
      </div>
    </div>
  );
}
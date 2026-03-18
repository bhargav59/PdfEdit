FROM python:3.12-slim

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends poppler-utils wget curl && rm -rf /var/lib/apt/lists/*

# Set up user
RUN useradd -m -u 1000 user
WORKDIR /app

# Combine requirements
COPY backend/requirements.txt ./backend-reqs.txt
COPY worker/requirements.txt ./worker-reqs.txt
RUN pip install --no-cache-dir -r backend-reqs.txt -r worker-reqs.txt

# Copy all code
COPY --chown=1000:1000 shared/ ./shared/
COPY --chown=1000:1000 backend/ ./backend/
COPY --chown=1000:1000 worker/ ./worker/
COPY --chown=1000:1000 start.sh ./start.sh

# Download the fonts
RUN mkdir -p shared/fonts \
    && wget -qO shared/fonts/Roboto-Regular.ttf "https://raw.githubusercontent.com/googlefonts/roboto/main/src/hinted/Roboto-Regular.ttf" \
    && wget -qO shared/fonts/Lato-Regular.ttf "https://raw.githubusercontent.com/google/fonts/main/ofl/lato/Lato-Regular.ttf" \
    && wget -qO shared/fonts/Montserrat-Regular.ttf "https://raw.githubusercontent.com/JulietaUla/Montserrat/master/fonts/ttf/Montserrat-Regular.ttf" \
    && wget -qO shared/fonts/OpenSans-Regular.ttf "https://raw.githubusercontent.com/googlefonts/opensans/main/fonts/ttf/OpenSans-Regular.ttf" \
    && chown -R 1000:1000 shared/fonts

# Ensure storage directories exist
RUN mkdir -p /storage/uploads /storage/output && chown -R 1000:1000 /storage
ENV STORAGE_PATH=/storage
ENV PYTHONPATH=/app

# Expose
EXPOSE 7860
USER user
CMD ["./start.sh"]

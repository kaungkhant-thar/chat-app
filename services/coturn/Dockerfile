# Start with a base image
FROM alpine:latest

# Install coturn
RUN apk update && apk add coturn

# Copy the custom turnserver.conf file (optional)
COPY turnserver.conf /etc/turnserver.conf

# Expose ports for STUN and TURN
EXPOSE 3478 5349 49152-65535

# Run the coturn server
ENTRYPOINT ["turnserver", "-c", "/etc/turnserver.conf", "--no-cli"]

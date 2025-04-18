# Use the official coturn image from Docker Hub
FROM coturn/coturn

# Copy your custom turnserver.conf into the Docker container
COPY turnserver.conf /etc/turnserver.conf

# Expose the necessary ports for TURN/STUN
EXPOSE 3478 5349 49152-65535

# Set the default command to run the coturn server with the configuration file
ENTRYPOINT ["turnserver", "-c", "/etc/turnserver.conf", "--no-cli"]

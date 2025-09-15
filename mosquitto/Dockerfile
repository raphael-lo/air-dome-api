# Use the official Mosquitto image as a base
FROM eclipse-mosquitto:2.0.15

# Set the username and password from ARGs. These can be passed during the build.
# We use the values from your .env file as defaults here.
ARG MQTT_USER=ytech-mqtt-broker
ARG MQTT_PASSWORD=air-dome2025@

# Create a temporary password file with the plaintext password
# Then, use mosquitto_passwd to create the final, hashed password file
# This runs as root to ensure permissions are correct
RUN echo "${MQTT_USER}:${MQTT_PASSWORD}" > /tmp/passwordfile.txt && \
    mosquitto_passwd -U /tmp/passwordfile.txt && \
    mv /tmp/passwordfile.txt /mosquitto/config/password.txt && \
    rm -f /tmp/passwordfile.txt

# Copy the main configuration file
COPY mosquitto.conf /mosquitto/config/mosquitto.conf

# The new mosquitto.conf should point to this password file
# We also need to explicitly set the user to mosquitto for security
USER mosquitto

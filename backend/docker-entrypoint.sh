#!/bin/sh
# docker-entrypoint.sh

# Abort on any error
set -e

# Wait for the MQTT broker to be available
# The host and port can be passed as arguments, with defaults
MQTT_HOST=${1:-mqtt-broker}
MQTT_PORT=${2:-1883}

# Use netcat (nc) to check for connectivity
# Loop until the host and port are available
echo "Waiting for MQTT broker at ${MQTT_HOST}:${MQTT_PORT}..."
while ! nc -z "${MQTT_HOST}" "${MQTT_PORT}"; do
  sleep 1
done
echo "MQTT broker is up."

# Execute the main command (e.g., "npm start")
exec "$@"

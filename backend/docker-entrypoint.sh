#!/bin/sh
# docker-entrypoint.sh

# Abort on any error
set -e

# Hardcode the host and port for the service we are waiting for
MQTT_HOST="mqtt-broker"
MQTT_PORT="1883"

# Use netcat (nc) to check for connectivity
echo "Waiting for MQTT broker at ${MQTT_HOST}:${MQTT_PORT}..."
while ! nc -z "${MQTT_HOST}" "${MQTT_PORT}"; do
  sleep 1
done
echo "MQTT broker is up."

# Execute the main command passed as arguments (e.g., ["npm", "start"])
exec "$@"
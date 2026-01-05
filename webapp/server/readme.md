# Find the local container ID
docker ps | grep viralreel_server
# Execute the script
docker exec -it <CONTAINER_ID> npm run db:seed:plans:prod
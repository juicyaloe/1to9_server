echo "wait db server"
dockerize -wait tcp://mysql:3306 -timeout 30s

echo "start node server"
npm start
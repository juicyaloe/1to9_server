echo "wait db server"
dockerize -wait tcp://mysql:3306

echo "start node server"
npm start
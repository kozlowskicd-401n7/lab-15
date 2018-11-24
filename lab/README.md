## OAuth with Auth0
This project uses Auto0 to authorize a client and grant access to specific routes.

### Running the App
From the command line, navigate into the auth-server folder and run nodemon.  The auth server will start locally on port 3000.  Then navigate to the web-server folder and run nodemon.  The web server will start locally on port 8080.  In a web browser, navigate to http://localhost:8080.  On the bottom of the page will be a link to login with Auth0.  Click that link and provide your credentials.  Auth0 will authorize the client and allow access to the /callback route.
# React Example App of Chat Engine with Iframe

To set up this project on your local machine, 
1. Clone the repository using `git clone https://github.com/RocketChat/interaction.demos.git`.
2. Navigate to the project directory with this command:

```
cd interaction.demos
cd iframe-integration
```

3. Create a `.env` file with the following content:

```
REACT_APP_REST_URL = 'https://<your-workspace-domain>/api/v1'
REACT_APP_ADMIN_ACCESS_TOKEN = '<admin-personal-access-token>'
REACT_APP_ADMIN_USER_ID = '<admin-userId>'
```
Update the values of variables with details from your workspace. If your Rocket.Chat workspace is running locally on http://localhost:3000, use this instead:

```
REACT_APP_REST_URL = 'http://localhost:3000/api/v1'
REACT_APP_ADMIN_ACCESS_TOKEN = '<admin-personal-access-token>'
REACT_APP_ADMIN_USER_ID = '<admin-userId>'
```

4. Navigate to *_src/App.js_* and replace <your-workspace-url> with the URL of your workspace.
4. Run `npm install`.
5. Run `npm start` and go to http://localhost:3006 on your browser to access the project.

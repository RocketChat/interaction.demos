import { useState, useEffect, useRef } from 'react';

const REST_URL = import.meta.env.VITE_REST_URL;
const ADMIN_USER_ID = import.meta.env.VITE_ADMIN_USER_ID;
const ADMIN_ACCESS_TOKEN = import.meta.env.VITE_ADMIN_ACCESS_TOKEN;
const CREATE_TOKEN_SECRET = import.meta.env.VITE_CREATE_TOKEN_SECRET;
const WORKSPACE_URL = REST_URL.replace('/api/v1', '');

const App = () => {
  // Login form state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // Session token used to log the user in to the iframe
  const [authToken, setAuthToken] = useState(localStorage.getItem('authToken'));

  // Reference to the iframe element
  const iframeRef = useRef(null);

  // Step 5: authenticate the user and mint a session token
  const loginUser = async (e) => {
    e.preventDefault();
    setError('');
    if (!username || !password) return;

    try {
      // 1. Verify the user's credentials
      const loginResponse = await fetch(`${REST_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user: username, password }),
      });
      const loginData = await loginResponse.json();
      if (!loginResponse.ok || loginData.status !== 'success') {
        throw new Error(loginData.message || loginData.error || 'Login failed');
      }
      const userId = loginData.data.userId;

      // 2. Mint a session token for that user with the admin account
      const tokenResponse = await fetch(`${REST_URL}/users.createToken`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': ADMIN_USER_ID,
          'X-Auth-Token': ADMIN_ACCESS_TOKEN,
        },
        body: JSON.stringify({ userId, secret: CREATE_TOKEN_SECRET }),
      });
      const tokenData = await tokenResponse.json();
      if (!tokenResponse.ok || !tokenData.success) {
        throw new Error(tokenData.error || 'Could not create a session token');
      }

      // 3. Store the token; the iframe effect below picks it up
      localStorage.setItem('authToken', tokenData.data.authToken);
      setAuthToken(tokenData.data.authToken);
    } catch (err) {
      setError(err.message);
    } finally {
      setPassword('');
    }
  };

  const logoutUser = () => {
    iframeRef.current?.contentWindow.postMessage({ externalCommand: 'logout' }, '*');
    localStorage.removeItem('authToken');
    setAuthToken(null);
  };

  // Step 6: log the user in to the iframe once it is ready
  useEffect(() => {
    if (!authToken) return;

    const handleMessage = (event) => {
      const iframe = iframeRef.current;
      if (!iframe) return;

      if (event.data?.eventName === 'startup') {
        // The iframe only listens after 'startup'
        iframe.contentWindow.postMessage(
          { event: 'login-with-token', loginToken: authToken },
          '*',
        );
      }

      if (event.data?.eventName === 'Custom_Script_Logged_In') {
        // Navigate only after the login succeeded
        iframe.contentWindow.postMessage(
          { externalCommand: 'go', path: '/channel/general?layout=embedded' },
          '*',
        );
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [authToken]);

  // Step 7: user interface
  return (
    <div className="container">
      <div className="title-section">
        <h1>Rocket.Chat Iframe Example</h1>
        <p>Chat Engine with Iframe using React</p>
      </div>

      {!authToken ? (
        <form onSubmit={loginUser} className="login-form">
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button type="submit">Login</button>
          {error && <p className="error">{error}</p>}
        </form>
      ) : (
        <div className="flex-chat-section">
          <div className="rooms">
            <h2>Embed a Rocket.Chat Room via Iframe</h2>
            <hr />
            <p>Start chatting in the general channel embedded from your Rocket.Chat workspace.</p>
            <button onClick={logoutUser}>Logout</button>
          </div>
          <div className="messages">
            {/* Requires 'Restrict access inside any Iframe' to be disabled on the workspace */}
            <iframe
              ref={iframeRef}
              src={`${WORKSPACE_URL}/?layout=embedded`}
              title="embedroom"
            ></iframe>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;

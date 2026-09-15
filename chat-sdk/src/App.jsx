import { DDPSDK } from '@rocket.chat/ddp-client';
import { useState, useEffect } from 'react';

// One SDK instance for the whole app, created from the workspace URL in .env
const sdk = DDPSDK.create(import.meta.env.VITE_WORKSPACE_URL);

// The SDK expects the password as a SHA-256 hash in hexadecimal, not in plain text
async function hashPassword(password) {
  const data = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

// Messages arrive from two sources with different timestamp formats:
// the REST API sends an ISO string, the real-time stream sends { $date: <milliseconds> }
function formatTime(ts) {
  const date = new Date(ts?.$date ?? ts);
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric' });
}

// Which history endpoint to call depends on the room type
const HISTORY_ENDPOINT = {
  c: '/v1/channels.history', // public channel
  p: '/v1/groups.history',   // private channel
  d: '/v1/im.history',       // direct message
};

const App = () => {
  // Login form
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // Session and chat
  const [loggedIn, setLoggedIn] = useState(false);
  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [messages, setMessages] = useState(new Map());
  const [messageInput, setMessageInput] = useState('');

  // Step 6: log in with username and password
  const loginUser = async (e) => {
    e.preventDefault();
    setError('');
    if (!username || !password) return;

    try {
      await sdk.connection.connect();
      await sdk.account.loginWithPassword(username, await hashPassword(password));
      localStorage.setItem('authToken', sdk.account.user.token);
      setLoggedIn(true);
      setUsername('');
      await fetchRooms();
    } catch (err) {
      // The SDK rejects with { error: 401, reason: 'User not found' } for bad credentials
      setError(err.reason || err.message || 'Login failed');
    } finally {
      setPassword('');
    }
  };

  // Step 6: on reload, resume the previous session if a token was saved
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) return;
    (async () => {
      try {
        await sdk.connection.connect();
        await sdk.account.loginWithToken(token);
        setLoggedIn(true);
        await fetchRooms();
      } catch {
        localStorage.removeItem('authToken');
      }
    })();
  }, []);

  const logoutUser = async () => {
    await sdk.account.logout();
    localStorage.removeItem('authToken');
    setLoggedIn(false);
    setRooms([]);
    setSelectedRoom(null);
    setMessages(new Map());
  };

  // Step 7: list the rooms the user is a member of
  const fetchRooms = async () => {
    const response = await sdk.rest.get('/v1/subscriptions.get');
    setRooms(response.update || []);
  };

  // Step 7: select a room and load its recent messages
  const selectRoom = async (room) => {
    setSelectedRoom(room);
    setMessages(new Map()); // clear the previous room's messages
    setError('');
    try {
      const endpoint = HISTORY_ENDPOINT[room.t];
      if (!endpoint) return;
      const { messages: history } = await sdk.rest.get(`${endpoint}?roomId=${room.rid}&count=50`);
      // Skip system messages (they carry a `t` field), and store oldest first for display
      const userMessages = history.filter((m) => !m.t).reverse();
      setMessages(new Map(userMessages.map((m) => [m._id, m])));
    } catch (err) {
      setError('Could not load message history');
    }
  };

  // Step 7: receive new messages for the selected room in real time
  useEffect(() => {
    if (!selectedRoom) return;
    const stream = sdk.stream('room-messages', selectedRoom.rid, (message) => {
      if (message.t) return; // ignore system messages
      setMessages((current) => new Map(current).set(message._id, message));
    });
    return () => stream.stop();
  }, [selectedRoom]);

  // Step 7: send a message to the selected room
  const sendChatMessage = async (e) => {
    e.preventDefault();
    const msg = messageInput.trim();
    if (!msg || !selectedRoom) return;
    try {
      await sdk.rest.post('/v1/chat.sendMessage', {
        message: { rid: selectedRoom.rid, msg },
      });
      setMessageInput('');
    } catch {
      setError('Could not send the message');
    }
  };

  return (
    <div className="container">
      <div className="title-section">
        <h1>Chat SDK Example</h1>
        <p>Rocket.Chat React + Vite App</p>
      </div>

      {!loggedIn ? (
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
            <h2>Rooms</h2>
            <hr />
            <ul>
              {rooms.map((room) => (
                <li
                  key={room._id}
                  onClick={() => selectRoom(room)}
                  className={selectedRoom?.rid === room.rid ? 'selected' : ''}
                >
                  {room.fname || room.name}
                </li>
              ))}
            </ul>
            <button type="button" onClick={logoutUser}>Logout</button>
          </div>

          <div className="messages">
            {selectedRoom ? (
              <div className="messages-col">
                <ul className="messages-container">
                  {[...messages.values()].map((message) => (
                    <li key={message._id}>
                      <div className="message">
                        <p className="user">
                          {message.u.name || message.u.username} - {formatTime(message.ts)}
                        </p>
                        <p className="text">{message.msg}</p>
                      </div>
                    </li>
                  ))}
                </ul>
                <form className="composer" onSubmit={sendChatMessage}>
                  <textarea
                    placeholder="Type your message here..."
                    rows="2"
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                  />
                  <button type="submit">Send</button>
                </form>
                {error && <p className="error">{error}</p>}
              </div>
            ) : (
              <p className="load-message-alert">Select a room to start chatting</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
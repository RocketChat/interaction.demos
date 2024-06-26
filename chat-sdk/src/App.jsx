import { DDPSDK } from '@rocket.chat/ddp-client';

import { useState, useEffect } from 'react';

// Initialize the Chat SDK with your workspace URL
const sdk = DDPSDK.create('<your-workspace-url>');

async function hashPassword(password) {
  // Step 1: Convert the input string to a Uint8Array
  const encoder = new TextEncoder();
  const data = encoder.encode(password);

  // Step 2: Use the SubtleCrypto API to create a hash
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);

  // Step 3: Convert the hash buffer to a hex string
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');

  // Step 4: Return the hashed string
  return hashHex;
}


const App = () => {
  // State for login form
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // State for chat
  const [loggedIn, setLoggedIn] = useState(false);
  const [rooms, setRooms] = useState([]);
  const [roomId, setRoomId] = useState('');
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [messages, setMessages] = useState(new Map());
  const [messageInput, setMessageInput] = useState('');

  const loginUser = async (e) => {
    e.preventDefault();
    await sdk.connection.connect();
    await sdk.account.loginWithPassword(username, await hashPassword(password));
    setLoggedIn(true);
    setUsername('');
    setPassword('');
    fetchRooms();
  };

 // Fetch Rooms
 const fetchRooms = async () => {
  const response = await sdk.rest.get('/v1/subscriptions.get');
  if (response && response.update) { // Verify response structure
    setRooms(response.update); // Ensure this matches the actual structure of the response
  }
};

const fetchRoomData = async (rid) => {
  setRoomId(rid);
  setSelectedRoom(rid);
};

  // Stream room messages
  useEffect(() => {
    return sdk.stream('room-messages', roomId, (args) => {
      setMessages((messages) => {
        messages.set(args._id, args);
        return new Map(messages);
      });
    }).stop;
  }, [roomId]);


    // Format ISO date
    const formatIsoDate = (isoDate) => {
      const date = new Date(isoDate);
      // format for chat time, remove seconds
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: 'numeric',
      });
    };
  
// Send chat message
const sendChatMessage = async (e, msg) => {
  e.preventDefault();
  await sdk.rest.post('/v1/chat.sendMessage', {
    message: {
      rid: roomId,
      msg,
    },
  });

  setMessageInput('');

};

return (
  <div className="container">
    <div className="title-section">
      <h1>Chat SDK Example</h1>
      <p>Rocket.Chat React + Vite App </p>
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
                onClick={() => fetchRoomData(room.rid)}
                className={selectedRoom === room.rid ? 'selected' : ''}
              >
                {room.name}
              </li>
            ))}
          </ul>
        </div>
        <div className="messages">
          {selectedRoom ? (
            <div className="messages-col">
              <ul className="messages-container">
                {[...messages.values()].map((message) => (
                  <li key={message._id} className="box">
                    <div className="message">
                      <p className="user">
                        {message.u.name} - {formatIsoDate(message.ts.$date)}
                      </p>
                      <p className="text">{message.msg}</p>
                    </div>
                  </li>
                ))}

              </ul>
              <div className="form">
                <textarea
                  placeholder="Type your message here..."
                  rows="2"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                ></textarea>
                <a
                  onClick={(e) => sendChatMessage(e, messageInput)}
                  className="send-button"
                >
                  Send
                </a>
              </div>
            </div>
          ) : (
            <p className="load-message-alert">
              Select a room to start chatting!
            </p>
          )}
        </div>
      </div>
    )}
  </div>
);

  };

  export default App;



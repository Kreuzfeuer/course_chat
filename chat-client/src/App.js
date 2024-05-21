// src/App.js
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Chat from './Chat';
import ChatRoomPage from './ChatRoomPage';

const App = () => {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<Chat />} />
                <Route path="/chat/:chatRoomName" element={<ChatRoomPage />} />
            </Routes>
        </Router>
    );
};

export default App;

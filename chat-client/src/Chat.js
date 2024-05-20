import React, { useState, useEffect } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { Box, Button, Container, TextField, Typography, List, ListItem, ListItemText, Divider, Select, MenuItem } from '@mui/material';

const Chat = () => {
    const [messages, setMessages] = useState([]);
    const [message, setMessage] = useState('');
    const [nickname, setNickname] = useState(localStorage.getItem('nickname') || '');
    const [client, setClient] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const [isNicknameSet, setIsNicknameSet] = useState(!!localStorage.getItem('nickname'));
    const [chatRooms, setChatRooms] = useState([]);
    const [selectedChatRoom, setSelectedChatRoom] = useState('');

    useEffect(() => {
        const socket = new SockJS('http://localhost:8080/ws');
        const stompClient = new Client({
            webSocketFactory: () => socket,
            onConnect: () => {
                setIsConnected(true);
                stompClient.subscribe('/topic/messages', (message) => {
                    const receivedMessage = JSON.parse(message.body);
                    setMessages((prevMessages) => [...prevMessages, receivedMessage]);
                });
                stompClient.subscribe('/topic/chatRooms', (message) => {
                    const rooms = JSON.parse(message.body);
                    setChatRooms(rooms);
                });
                stompClient.subscribe('/user/topic/chatHistory', (message) => {
                    const history = JSON.parse(message.body);
                    setMessages(history);
                });
                stompClient.publish({
                    destination: '/app/getChatRooms',
                });
            },
            onDisconnect: () => {
                setIsConnected(false);
            }
        });
        stompClient.activate();
        setClient(stompClient);

        return () => {
            if (stompClient) {
                stompClient.deactivate();
            }
        };
    }, []);

    const sendMessage = () => {
        if (client && message.trim() !== '' && nickname.trim() !== '' && selectedChatRoom !== '') {
            client.publish({
                destination: '/app/sendMessage',
                body: JSON.stringify({ from: 'User', text: message, nickname: nickname }),
                headers: { chatRoomName: selectedChatRoom }
            });
            setMessage('');
        }
    };

    const handleSetNickname = () => {
        if (nickname.trim() !== '') {
            localStorage.setItem('nickname', nickname);
            setIsNicknameSet(true);
        }
    };

    const handleResetNickname = () => {
        localStorage.removeItem('nickname');
        setNickname('');
        setIsNicknameSet(false);
    };

    const handleCreateChatRoom = (chatRoomName) => {
        if (chatRoomName.trim() !== '' && client) {
            client.publish({
                destination: '/app/createChat',
                body: chatRoomName,
            });
        }
    };

    const handleSelectChatRoom = (chatRoomName) => {
        setSelectedChatRoom(chatRoomName);
        if (client) {
            client.publish({
                destination: '/app/getChatHistory',
                body: chatRoomName,
            });
        }
    };

    return (
        <Container maxWidth="sm">
            {!isConnected && <Typography variant="h6">Connecting...</Typography>}
            {isConnected && (
                <Box my={4}>
                    <Typography variant="h4" gutterBottom>Chat</Typography>
                    <Box mb={2}>
                        <TextField
                            label="Create new chat room"
                            variant="outlined"
                            fullWidth
                            onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                    handleCreateChatRoom(e.target.value);
                                    e.target.value = '';
                                }
                            }}
                        />
                    </Box>
                    <Box mb={2}>
                        <Select
                            value={selectedChatRoom}
                            onChange={(e) => handleSelectChatRoom(e.target.value)}
                            displayEmpty
                            fullWidth
                        >
                            <MenuItem value="" disabled>Select Chat Room</MenuItem>
                            {chatRooms.map((room, index) => (
                                <MenuItem key={index} value={room}>{room}</MenuItem>
                            ))}
                        </Select>
                    </Box>
                    <List>
                        {messages.map((msg, index) => (
                            <ListItem key={index} alignItems="flex-start">
                                <ListItemText
                                    primary={msg.nickname}
                                    secondary={msg.text}
                                />
                                <Divider component="li" />
                            </ListItem>
                        ))}
                    </List>
                </Box>
            )}
            <Box my={4}>
                {!isNicknameSet ? (
                    <Box display="flex" flexDirection="column" alignItems="center">
                        <TextField
                            label="Enter your nickname"
                            variant="outlined"
                            value={nickname}
                            onChange={(e) => setNickname(e.target.value)}
                            margin="normal"
                        />
                        <Button variant="contained" color="primary" onClick={handleSetNickname}>
                            Set Nickname
                        </Button>
                    </Box>
                ) : (
                    <Box>
                        <Typography variant="h6">Nickname: {nickname}</Typography>
                        <Button variant="contained" color="secondary" onClick={handleResetNickname} sx={{ mb: 2 }}>
                            Change Nickname
                        </Button>
                        <TextField
                            fullWidth
                            label="Enter your message"
                            variant="outlined"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            margin="normal"
                            disabled={selectedChatRoom === ''}
                        />
                        <Button
                            fullWidth
                            variant="contained"
                            color="primary"
                            onClick={sendMessage}
                            disabled={!isConnected || selectedChatRoom === ''}
                        >
                            Send
                        </Button>
                    </Box>
                )}
            </Box>
        </Container>
    );
};

export default Chat;

import React, { useState, useEffect } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import {
    Box, Button, Container, TextField, Typography, List, ListItem, ListItemText,
    Divider, Select, MenuItem, Grid, Paper
} from '@mui/material';

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

                // Подписка на получение сообщений
                stompClient.subscribe('/topic/messages', (message) => {
                    const receivedMessage = JSON.parse(message.body);
                    setMessages((prevMessages) => [...prevMessages, receivedMessage]);
                });

                // Подписка на получение списка чатов
                stompClient.subscribe('/topic/chatRooms', (message) => {
                    const rooms = JSON.parse(message.body);
                    setChatRooms(rooms);
                });

                // Подписка на получение истории чата
                stompClient.subscribe(`/user/topic/chatHistory`, (message) => {
                    const history = JSON.parse(message.body);
                    setMessages(history);
                });

                // Запрос списка чатов после подключения
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
        if (client && isConnected && message.trim() !== '' && nickname.trim() !== '' && selectedChatRoom !== '') {
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
        if (chatRoomName.trim() !== '' && client && isConnected) {
            client.publish({
                destination: '/app/createChat',
                body: chatRoomName,
            });
        }
    };

    const handleSelectChatRoom = (chatRoomName) => {
        setSelectedChatRoom(chatRoomName);
        if (client && isConnected) {
            client.publish({
                destination: '/app/getChatHistory',
                body: chatRoomName,
            });
        }
    };

    return (
        <Container maxWidth="md">
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Box>
                    <TextField
                        label="Enter your nickname"
                        variant="outlined"
                        value={nickname}
                        onChange={(e) => setNickname(e.target.value)}
                        margin="normal"
                    />
                    <Button variant="contained" color="primary" onClick={handleSetNickname} disabled={isNicknameSet}>
                        Set Nickname
                    </Button>
                </Box>
                <Box>
                    <Button variant="contained" color="secondary" onClick={handleResetNickname} disabled={!isNicknameSet}>
                        Change Nickname
                    </Button>
                    <TextField
                        id="create-new-room"
                        label="Create new chat room"
                        variant="outlined"
                    />
                    <Button variant="contained" color="primary" onClick={() => handleCreateChatRoom(document.getElementById('create-new-room').value)}>
                        Create Chat Room
                    </Button>
                </Box>
            </Box>
            <Grid container spacing={2}>
                <Grid item xs={4}>
                    <Box mb={2}>
                        <Typography variant="h6">Chat Rooms</Typography>
                        <Select
                            value={selectedChatRoom}
                            onChange={(e) => handleSelectChatRoom(e.target.value)}
                            fullWidth
                        >
                            <MenuItem value="">Select Chat Room</MenuItem>
                            {chatRooms.map((room, index) => (
                                <MenuItem key={index} value={room}>{room}</MenuItem>
                            ))}
                        </Select>
                    </Box>
                </Grid>
                <Grid item xs={8}>
                    <Paper elevation={3} style={{ height: '400px', overflowY: 'auto' }}>
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
                    </Paper>
                    <Box mt={2}>
                        <TextField
                            label="Enter your message"
                            variant="outlined"
                            fullWidth
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            disabled={!isConnected || selectedChatRoom === ''}
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
                </Grid>
            </Grid>
        </Container>
    );
};

export default Chat;

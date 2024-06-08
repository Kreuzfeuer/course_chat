import React, { useState, useEffect } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { useNavigate } from 'react-router-dom';
import {
    Box, Button, Container, TextField, Typography, Select, MenuItem, Grid, Paper, FormControl, InputLabel, AppBar, Toolbar, IconButton
} from '@mui/material';
import { Chat as ChatIcon, Home as HomeIcon } from '@mui/icons-material';

const Chat = () => {
    const [nickname, setNickname] = useState(localStorage.getItem('nickname') || '');
    const [client, setClient] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const [isNicknameSet, setIsNicknameSet] = useState(!!localStorage.getItem('nickname'));
    const [chatRooms, setChatRooms] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        const socket = new SockJS('http://localhost:8080/ws');
        const stompClient = new Client({
            webSocketFactory: () => socket,
            onConnect: () => {
                setIsConnected(true);

                // Подписка на получение списка чатов
                stompClient.subscribe('/topic/chatRooms', (message) => {
                    const rooms = JSON.parse(message.body);
                    setChatRooms(rooms);
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
        navigate(`/chat/${chatRoomName}`);
    };

    return (
        <Container maxWidth="md">
            <AppBar position="static" style={{ marginBottom: '20px' }}>
                <Toolbar>
                    <IconButton edge="start" color="inherit" aria-label="home" onClick={() => navigate('/')}>
                        <HomeIcon />
                    </IconButton>
                    <Typography variant="h6" style={{ flexGrow: 1 }}>
                        Chat Application
                    </Typography>
                    <IconButton color="inherit">
                        <ChatIcon />
                    </IconButton>
                </Toolbar>
            </AppBar>

            <Paper elevation={3} style={{ padding: '20px' }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Box>
                        <TextField
                            label="Enter your nickname"
                            variant="outlined"
                            value={nickname}
                            onChange={(e) => setNickname(e.target.value)}
                            margin="normal"
                            fullWidth
                            style={{ marginBottom: '10px' }}
                        />
                        <Box display="flex" justifyContent="space-between">
                            <Button variant="contained" color="primary" onClick={handleSetNickname} disabled={isNicknameSet} style={{ marginRight: '10px' }}>
                                Set Nickname
                            </Button>
                            <Button variant="contained" color="secondary" onClick={handleResetNickname} disabled={!isNicknameSet}>
                                Change Nickname
                            </Button>
                        </Box>
                    </Box>
                    <Box>
                        <TextField
                            id="create-new-room"
                            label="Create new chat room"
                            variant="outlined"
                            fullWidth
                            style={{ marginBottom: '10px' }}
                        />
                        <Button variant="contained" color="primary" onClick={() => handleCreateChatRoom(document.getElementById('create-new-room').value)}>
                            Create Chat Room
                        </Button>
                    </Box>
                </Box>

                <Grid container spacing={2}>
                    <Grid item xs={12}>
                        <Box mb={2}>
                            <Typography variant="h6">Chat Rooms</Typography>
                            <FormControl variant="outlined" fullWidth>
                                <InputLabel id="select-chat-room-label">Select Chat Room</InputLabel>
                                <Select
                                    labelId="select-chat-room-label"
                                    value=""
                                    onChange={(e) => handleSelectChatRoom(e.target.value)}
                                    label="Select Chat Room"
                                >
                                    <MenuItem value="">Select Chat Room</MenuItem>
                                    {chatRooms.map((room, index) => (
                                        <MenuItem key={index} value={room}>{room}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Box>
                    </Grid>
                </Grid>
            </Paper>
        </Container>
    );
};

export default Chat;

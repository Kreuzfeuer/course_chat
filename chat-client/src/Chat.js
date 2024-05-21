// src/Chat.js
import React, { useState, useEffect } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { useNavigate } from 'react-router-dom';
import {
    Box, Button, Container, TextField, Typography, Select, MenuItem, Grid
} from '@mui/material';

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
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Box>
                    <TextField
                        label="Enter your nickname"
                        variant="outlined"
                        value={nickname}
                        onChange={(e) => setNickname(e.target.value)}
                        margin="normal"
                    />
                    <Box>
                        <Button variant="contained" color="primary" onClick={handleSetNickname} disabled={isNicknameSet}>
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
                    />
                    <Box>
                        <Button variant="contained" color="primary" onClick={() => handleCreateChatRoom(document.getElementById('create-new-room').value)}>
                            Create Chat Room
                        </Button>
                    </Box>
                    
                </Box>
            </Box>
            <Grid container spacing={2}>
                <Grid item xs={12}>
                    <Box mb={2}>
                        <Typography variant="h6">Chat Rooms</Typography>
                        <Select
                            value=""
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
            </Grid>
        </Container>
    );
};

export default Chat;

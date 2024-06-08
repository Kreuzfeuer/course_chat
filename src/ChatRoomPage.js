// src/ChatRoomPage.js
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { Box, Button, TextField, Typography, TabScrollButton,  List, ListItem, ListItemText, Divider, Paper, AppBar, Toolbar, IconButton } from '@mui/material';
import { Chat as ChatIcon, Home as HomeIcon } from '@mui/icons-material';
const ChatRoomPage = () => {
    const { chatRoomName } = useParams();
    const navigate = useNavigate();
    const [messages, setMessages] = useState([]);
    const [message, setMessage] = useState('');
    const [nickname, setNickname] = useState(localStorage.getItem('nickname') || '');
    const [client, setClient] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        const socket = new SockJS('http://localhost:8080/ws');
        const stompClient = new Client({
            webSocketFactory: () => socket,
            onConnect: () => {
                setIsConnected(true);

                // получение сообщений
                stompClient.subscribe(`/topic/messages/${chatRoomName}`, (message) => {
                    const receivedMessage = JSON.parse(message.body);
                    setMessages((prevMessages) => [...prevMessages, receivedMessage]);
                });

                // получение истории
                stompClient.subscribe(`/topic/chatHistory/${chatRoomName}`, (message) => {
                    const history = JSON.parse(message.body);
                    console.log(message.body)
                    setMessages(history);
                });

                // Запрос истории после подключения
                stompClient.publish({
                    destination: '/app/getChatHistory',
                    body: chatRoomName,
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
    }, [chatRoomName]);
    
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const sendMessage = () => {
        if (client && isConnected && message.trim() !== '' && nickname.trim() !== '') {
            client.publish({
                destination: '/app/sendMessage',
                body: JSON.stringify({ fromUser: nickname, text: message }),
                headers: { chatRoomName: chatRoomName }
            });
            setMessage('');
        }
    };

    return (
        <Box>
             <AppBar position="static" style={{ marginBottom: '20px' }}>
                <Toolbar>
                    <IconButton edge="start" color="inherit" aria-label="home" onClick={() => navigate('/')}>
                        <HomeIcon />
                    </IconButton>
                    <Typography variant="h6" style={{ flexGrow: 1 }}>
                        Chat Room: {chatRoomName}
                    </Typography>
                    <IconButton color="inherit">
                        <ChatIcon />
                    </IconButton>
                </Toolbar>
            </AppBar>
            <Paper elevation={3} style={{ height: '400px', overflowY: 'auto', margin: '20px 0' }}>
                <List >
                    {messages.map((msg, index) => (
                        <ListItem key={index} alignItems="flex-start">
                            <ListItemText
                                primary={msg.fromUser}
                                secondary={msg.text}
                            />
                            <Divider component="li" />
                        </ListItem>
                    ))}
                </List>
            </Paper>
            <Box>
                <TextField
                    label="Enter your message"
                    variant="outlined"
                    fullWidth
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            sendMessage();
                        }
                    }}
                    disabled={!isConnected}
                />
                <Button
                    fullWidth
                    variant="contained"
                    color="primary"
                    onClick={sendMessage}
                    disabled={!isConnected}
                >
                    Send
                </Button>
            </Box>
        </Box>
    );
};

export default ChatRoomPage;

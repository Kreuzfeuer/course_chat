// src/ChatRoomPage.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { Box, Button, TextField, Typography, List, ListItem, ListItemText, Divider, Paper } from '@mui/material';

const ChatRoomPage = () => {
    const { chatRoomName } = useParams();
    const navigate = useNavigate();
    const [messages, setMessages] = useState([]);
    const [message, setMessage] = useState('');
    const [nickname, setNickname] = useState(localStorage.getItem('nickname') || '');
    const [client, setClient] = useState(null);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        const socket = new SockJS('http://localhost:8080/ws');
        const stompClient = new Client({
            webSocketFactory: () => socket,
            onConnect: () => {
                setIsConnected(true);

                // Подписка на получение сообщений
                stompClient.subscribe(`/topic/messages/${chatRoomName}`, (message) => {
                    const receivedMessage = JSON.parse(message.body);
                    setMessages((prevMessages) => [...prevMessages, receivedMessage]);
                });

                // Подписка на получение истории чата
                stompClient.subscribe(`/topic/chatHistory/${chatRoomName}`, (message) => {
                    const history = JSON.parse(message.body);
                    console.log(message.body)
                    setMessages(history);
                });

                // Запрос истории чата после подключения
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
            <Button onClick={() => navigate('/')}>Back to Room Selection</Button>
            <Typography variant="h4">Chat Room: {chatRoomName}</Typography>
            <Paper elevation={3} style={{ height: '400px', overflowY: 'auto', margin: '20px 0' }}>
                <List>
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

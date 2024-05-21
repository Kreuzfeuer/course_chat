package com.kreuzfeuer.course_chat.controller;

import com.kreuzfeuer.course_chat.dto.ChatMessage;
import com.kreuzfeuer.course_chat.dto.ChatRoom;
import com.kreuzfeuer.course_chat.repository.ChatMessageRepository;
import com.kreuzfeuer.course_chat.repository.ChatRoomRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.util.List;
import java.util.stream.Collectors;

@Controller
public class ChatController {

    @Autowired
    private ChatRoomRepository chatRoomRepository;

    @Autowired
    private ChatMessageRepository chatMessageRepository;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @MessageMapping("/sendMessage")
    public void sendMessage(@Payload ChatMessage message, String chatRoomName) {
        ChatRoom chatRoom = chatRoomRepository.findByName(chatRoomName);
        message.setChatRoom(chatRoom);
        chatMessageRepository.save(message);
        messagingTemplate.convertAndSend("/topic/messages", message);
    }

    @MessageMapping("/createChat")
    public void createChat(@Payload String chatRoomName) {
        if (chatRoomRepository.findByName(chatRoomName) == null) {
            ChatRoom chatRoom = new ChatRoom(chatRoomName);
            chatRoomRepository.save(chatRoom);
        }
        List<String> chatRooms = getChatRoomNames();
        messagingTemplate.convertAndSend("/topic/chatRooms", chatRooms);
    }

    @MessageMapping("/getChatHistory")
    public void getChatHistory(@Payload String chatRoomName) {
        List<ChatMessage> chatHistory = chatMessageRepository.findByChatRoomNameOrderByIdAsc(chatRoomName);
        messagingTemplate.convertAndSendToUser(chatRoomName, "/topic/chatHistory", chatHistory);
    }

    @MessageMapping("/getChatRooms")
    public void getChatRooms() {
        List<String> chatRooms = getChatRoomNames();
        messagingTemplate.convertAndSend("/topic/chatRooms", chatRooms);
    }

    private List<String> getChatRoomNames() {
        return chatRoomRepository.findAll().stream()
                .map(ChatRoom::getName)
                .collect(Collectors.toList());
    }
}




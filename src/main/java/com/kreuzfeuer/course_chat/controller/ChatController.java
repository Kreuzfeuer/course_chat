package com.kreuzfeuer.course_chat.controller;

import com.kreuzfeuer.course_chat.dto.ChatMessage;
import com.kreuzfeuer.course_chat.dto.ChatRoom;
import com.kreuzfeuer.course_chat.repository.ChatMessageRepository;
import com.kreuzfeuer.course_chat.repository.ChatRoomRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.util.List;
import java.util.stream.Collectors;

@Controller
@Slf4j
public class ChatController {

    @Autowired
    private ChatRoomRepository chatRoomRepository;

    @Autowired
    private ChatMessageRepository chatMessageRepository;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @MessageMapping("/sendMessage")
    public void sendMessage(@Payload ChatMessage message, SimpMessageHeaderAccessor headerAccessor) {
        String chatRoomName = headerAccessor.getFirstNativeHeader("chatRoomName");
        ChatRoom chatRoom = chatRoomRepository.findByName(chatRoomName);
        message.setChatRoom(chatRoom);
        log.info("Message - {}, chatName - {}", message, chatRoomName);
        chatMessageRepository.save(message);
        messagingTemplate.convertAndSend("/topic/messages/" + chatRoomName, message);
    }

    @MessageMapping("/createChat")
    public void createChat(@Payload String chatRoomName) {
        log.info("Name chat - {}", chatRoomName);
        if (chatRoomRepository.findByName(chatRoomName) == null) {
            ChatRoom chatRoom = new ChatRoom(chatRoomName);
            chatRoomRepository.save(chatRoom);
            log.info("Create chatRoom with name - {}", chatRoom);
        }
        List<String> chatRooms = getChatRoomNames();
        log.info("Chats - {}",chatRooms);
        messagingTemplate.convertAndSend("/topic/chatRooms", chatRooms);
    }

    @MessageMapping("/getChatHistory")
    public void getChatHistory(@Payload String chatRoomName) {
        List<ChatMessage> chatHistory = chatMessageRepository.findByChatRoomNameOrderByIdAsc(chatRoomName);
        log.info("ChatName - {} , chatHistory - {} ", chatRoomName, chatHistory);
        messagingTemplate.convertAndSend( "/topic/chatHistory/" + chatRoomName, chatHistory);
    }

    @MessageMapping("/getChatRooms")
    public void getChatRooms() {
        List<String> chatRooms = getChatRoomNames();
        log.info("chatRooms - {}", chatRooms);
        messagingTemplate.convertAndSend("/topic/chatRooms", chatRooms);
    }

    private List<String> getChatRoomNames() {
        return chatRoomRepository.findAll().stream()
                .map(ChatRoom::getName)
                .collect(Collectors.toList());
    }
}




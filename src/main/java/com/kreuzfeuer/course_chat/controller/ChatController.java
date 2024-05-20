package com.kreuzfeuer.course_chat.controller;

import com.kreuzfeuer.course_chat.dto.ChatMessage;
import com.kreuzfeuer.course_chat.dto.ChatRoom;
import com.kreuzfeuer.course_chat.repository.ChatMessageRepository;
import com.kreuzfeuer.course_chat.repository.ChatRoomRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.annotation.SendToUser;
import org.springframework.stereotype.Controller;

import java.util.List;
import java.util.stream.Collectors;

@Controller
public class ChatController {

    @Autowired
    private ChatRoomRepository chatRoomRepository;

    @Autowired
    private ChatMessageRepository chatMessageRepository;

    @MessageMapping("/sendMessage")
    @SendTo("/topic/messages")
    public ChatMessage sendMessage(ChatMessage message, String chatRoomName) {
        ChatRoom chatRoom = chatRoomRepository.findByName(chatRoomName);
        message.setChatRoom(chatRoom);
        chatMessageRepository.save(message);
        return message;
    }

    @MessageMapping("/createChat")
    @SendTo("/topic/chatRooms")
    public List<String> createChat(String chatRoomName) {
        if (chatRoomRepository.findByName(chatRoomName) == null) {
            ChatRoom chatRoom = new ChatRoom(chatRoomName);
            chatRoomRepository.save(chatRoom);
        }
        return getChatRoomNames();
    }

    @MessageMapping("/getChatHistory")
    @SendToUser("/queue/chatHistory")
    public List<ChatMessage> getChatHistory(String chatRoomName) {
        return chatMessageRepository.findByChatRoomNameOrderByIdAsc(chatRoomName);
    }

    @MessageMapping("/getChatRooms")
    @SendToUser("/queue/chatRooms")
    public List<String> getChatRooms() {
        return getChatRoomNames();
    }

    private List<String> getChatRoomNames() {
        return chatRoomRepository.findAll().stream()
                .map(ChatRoom::getName)
                .collect(Collectors.toList());
    }
}
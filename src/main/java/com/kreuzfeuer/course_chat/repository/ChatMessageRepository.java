package com.kreuzfeuer.course_chat.repository;


import com.kreuzfeuer.course_chat.model.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {
    List<ChatMessage> findByChatRoomNameOrderByIdAsc(String chatRoomName);
}
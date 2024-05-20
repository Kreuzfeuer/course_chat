package com.kreuzfeuer.course_chat.repository;

import com.kreuzfeuer.course_chat.dto.ChatRoom;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ChatRoomRepository extends JpaRepository<ChatRoom, Long> {
    ChatRoom findByName(String name);
}
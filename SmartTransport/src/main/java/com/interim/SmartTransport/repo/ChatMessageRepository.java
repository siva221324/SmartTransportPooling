package com.interim.SmartTransport.repo;

import com.interim.SmartTransport.model.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {

    @Query("SELECT m FROM ChatMessage m WHERE m.trip.id = :tripId " +
           "AND ((m.sender.id = :userId) OR (m.receiver.id = :userId)) " +
           "ORDER BY m.sentAt ASC")
    List<ChatMessage> findConversation(@Param("tripId") Long tripId, @Param("userId") Long userId);

    @Query("SELECT COUNT(m) FROM ChatMessage m WHERE m.receiver.id = :userId AND m.readAt IS NULL")
    long countUnread(@Param("userId") Long userId);

    @Query("SELECT COUNT(m) FROM ChatMessage m WHERE m.trip.id = :tripId " +
           "AND m.receiver.id = :userId AND m.readAt IS NULL")
    long countUnreadByTrip(@Param("tripId") Long tripId, @Param("userId") Long userId);
}

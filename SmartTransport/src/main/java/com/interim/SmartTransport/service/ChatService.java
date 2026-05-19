package com.interim.SmartTransport.service;

import com.interim.SmartTransport.dto.ChatMessageDTO;
import com.interim.SmartTransport.model.*;
import com.interim.SmartTransport.model.enums.NotificationType;
import com.interim.SmartTransport.repo.ChatMessageRepository;
import com.interim.SmartTransport.repo.BookingRepository;
import com.interim.SmartTransport.repo.TripRepository;
import com.interim.SmartTransport.repo.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ChatService {

    private final ChatMessageRepository chatMessageRepository;
    private final TripRepository tripRepository;
    private final UserRepository userRepository;
    private final BookingRepository bookingRepository;
    private final NotificationService notificationService;

    @Transactional
    public ChatMessageDTO sendMessage(Long tripId, String senderEmail, String content) {
        User sender = userRepository.findByEmail(senderEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));
        Trip trip = tripRepository.findById(tripId)
                .orElseThrow(() -> new RuntimeException("Trip not found"));

        // Determine receiver: if sender is driver -> can message any booked passenger (we pick the context)
        // If sender is passenger -> receiver is driver
        User receiver;
        if (trip.getDriver().getId().equals(sender.getId())) {
            // Driver sending — need receiverId from request, but for simplicity in a trip chat,
            // we'll require a receiverId parameter. For now, throw if no bookings.
            throw new RuntimeException("Driver must specify a receiver. Use sendMessageToUser instead.");
        } else {
            // Passenger sending — receiver is always the driver
            receiver = trip.getDriver();
        }

        return saveAndMap(trip, sender, receiver, content);
    }

    @Transactional
    public ChatMessageDTO sendMessageToUser(Long tripId, String senderEmail, Long receiverId, String content) {
        User sender = userRepository.findByEmail(senderEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));
        Trip trip = tripRepository.findById(tripId)
                .orElseThrow(() -> new RuntimeException("Trip not found"));
        User receiver = userRepository.findById(receiverId)
                .orElseThrow(() -> new RuntimeException("Receiver not found"));

        // Validate: sender must be driver or have approved booking, same for receiver
        validateChatParticipant(trip, sender);
        validateChatParticipant(trip, receiver);

        return saveAndMap(trip, sender, receiver, content);
    }

    public List<ChatMessageDTO> getConversation(Long tripId, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return chatMessageRepository.findConversation(tripId, user.getId())
                .stream().map(this::toDTO).toList();
    }

    @Transactional
    public void markAsRead(Long messageId, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));
        ChatMessage msg = chatMessageRepository.findById(messageId)
                .orElseThrow(() -> new RuntimeException("Message not found"));
        if (msg.getReceiver().getId().equals(user.getId()) && msg.getReadAt() == null) {
            msg.setReadAt(LocalDateTime.now());
            chatMessageRepository.save(msg);
        }
    }

    @Transactional
    public void markTripMessagesAsRead(Long tripId, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));
        List<ChatMessage> unread = chatMessageRepository.findConversation(tripId, user.getId())
                .stream()
                .filter(m -> m.getReceiver().getId().equals(user.getId()) && m.getReadAt() == null)
                .toList();
        LocalDateTime now = LocalDateTime.now();
        unread.forEach(m -> m.setReadAt(now));
        chatMessageRepository.saveAll(unread);
    }

    public long getUnreadCount(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return chatMessageRepository.countUnread(user.getId());
    }

    private void validateChatParticipant(Trip trip, User user) {
        boolean isDriver = trip.getDriver().getId().equals(user.getId());
        boolean hasApprovedBooking = bookingRepository
                .findByTripIdAndStatus(trip.getId(), com.interim.SmartTransport.model.enums.BookingStatus.APPROVED)
                .stream().anyMatch(b -> b.getPassenger().getId().equals(user.getId()));
        if (!isDriver && !hasApprovedBooking) {
            throw new RuntimeException("User is not a participant in this trip");
        }
    }

    private ChatMessageDTO saveAndMap(Trip trip, User sender, User receiver, String content) {
        ChatMessage msg = ChatMessage.builder()
                .trip(trip)
                .sender(sender)
                .receiver(receiver)
                .content(content)
                .build();
        chatMessageRepository.save(msg);

        // Notify receiver
        String preview = content.length() > 50 ? content.substring(0, 50) + "..." : content;
        notificationService.notify(receiver, NotificationType.CHAT_MESSAGE,
                "New message from " + sender.getName(),
                preview,
                trip.getId());

        return toDTO(msg);
    }

    private ChatMessageDTO toDTO(ChatMessage msg) {
        return ChatMessageDTO.builder()
                .id(msg.getId())
                .tripId(msg.getTrip().getId())
                .senderId(msg.getSender().getId())
                .senderName(msg.getSender().getName())
                .receiverId(msg.getReceiver().getId())
                .receiverName(msg.getReceiver().getName())
                .content(msg.getContent())
                .sentAt(msg.getSentAt())
                .readAt(msg.getReadAt())
                .build();
    }
}

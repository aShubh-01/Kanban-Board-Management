package com.kanban.kanban_backend.service;

import com.kanban.kanban_backend.model.Notification;
import com.kanban.kanban_backend.repository.NotificationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
public class NotificationService {
    @Autowired
    private NotificationRepository notificationRepository;

    public List<Notification> getNotifications(String userId) {
        return notificationRepository.findByRecipientIdOrderByCreatedAtDesc(userId);
    }

    public Notification markAsRead(String id) {
        Optional<Notification> notif = notificationRepository.findById(id);
        if (notif.isPresent()) {
            notif.get().setRead(true);
            return notificationRepository.save(notif.get());
        }
        return null;
    }

    public Notification createNotification(Notification notification) {
        return notificationRepository.save(notification);
    }
    
    public Optional<Notification> getNotification(String id) {
        return notificationRepository.findById(id);
    }
    
    public void deleteNotification(String id) {
        notificationRepository.deleteById(id);
    }
}

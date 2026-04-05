package com.kanban.kanban_backend.service;

import com.kanban.kanban_backend.model.Board;
import com.kanban.kanban_backend.model.Notification;
import com.kanban.kanban_backend.model.User;
import com.kanban.kanban_backend.repository.BoardRepository;
import com.kanban.kanban_backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class BoardService {
    @Autowired
    private BoardRepository boardRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private NotificationService notificationService;

    public List<Board> getUserBoards(String userId) {
        return boardRepository.findByOwnerIdOrMemberIdsContaining(userId, userId);
    }

    public Board createBoard(Board board) {
        return boardRepository.save(board);
    }

    public Optional<Board> getBoard(String id) {
        return boardRepository.findById(id);
    }

    public Board updateBoard(Board board) {
        return boardRepository.save(board);
    }

    public void deleteBoard(String id) {
        boardRepository.deleteById(id);
    }

    public void inviteUser(String boardId, String email, String senderName) {
        Optional<User> recipient = userRepository.findByEmail(email);
        Optional<Board> board = boardRepository.findById(boardId);
        
        if (recipient.isPresent() && board.isPresent()) {
            Notification notif = new Notification();
            notif.setRecipientId(recipient.get().getId());
            notif.setBoardId(boardId);
            notif.setBoardTitle(board.get().getTitle());
            notif.setSenderName(senderName);
            notif.setType("INVITE");
            notif.setMessage(senderName + " invited you to join board: " + board.get().getTitle());
            notificationService.createNotification(notif);
        }
    }

    public void acceptInvite(String notificationId) {
        Optional<Notification> notifOpt = notificationService.getNotification(notificationId);
        if (notifOpt.isPresent() && !notifOpt.get().isProcessed()) {
            Notification notif = notifOpt.get();
            Optional<Board> boardOpt = boardRepository.findById(notif.getBoardId());
            if (boardOpt.isPresent()) {
                Board board = boardOpt.get();
                if (!board.getMemberIds().contains(notif.getRecipientId())) {
                    board.getMemberIds().add(notif.getRecipientId());
                    boardRepository.save(board);
                    
                    // Also add board to user's boardIds
                    Optional<User> userOpt = userRepository.findById(notif.getRecipientId());
                    if (userOpt.isPresent()) {
                        User user = userOpt.get();
                        user.getBoardIds().add(board.getId());
                        userRepository.save(user);
                    }
                }
            }
            notif.setProcessed(true);
            notif.setRead(true);
            notificationService.createNotification(notif);
        }
    }

    public List<User> getBoardMembers(String boardId) {
        Optional<Board> board = boardRepository.findById(boardId);
        if (board.isPresent()) {
            java.util.Set<String> userIds = new java.util.HashSet<>();
            if (board.get().getOwnerId() != null) userIds.add(board.get().getOwnerId());
            if (board.get().getMemberIds() != null) userIds.addAll(board.get().getMemberIds());
            
            Iterable<User> it = userRepository.findAllById(userIds);
            List<User> userList = new java.util.ArrayList<>();
            it.forEach(userList::add);
            return userList;
        }
        return new java.util.ArrayList<>();
    }
}

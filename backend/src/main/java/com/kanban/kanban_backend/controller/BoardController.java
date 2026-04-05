package com.kanban.kanban_backend.controller;

import com.kanban.kanban_backend.model.Board;
import com.kanban.kanban_backend.model.User;
import com.kanban.kanban_backend.security.UserDetailsImpl;
import com.kanban.kanban_backend.service.BoardService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/boards")
public class BoardController {
    @Autowired
    private BoardService boardService;

    @GetMapping
    public List<Board> getMyBoards(Authentication authentication) {
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        return boardService.getUserBoards(userDetails.getId());
    }

    @PostMapping
    public Board createBoard(@RequestBody Board board, Authentication authentication) {
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        board.setOwnerId(userDetails.getId());
        return boardService.createBoard(board);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Board> getBoard(@PathVariable String id) {
        return boardService.getBoard(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{id}/members")
    public ResponseEntity<List<User>> getBoardMembers(@PathVariable String id) {
        return ResponseEntity.ok(boardService.getBoardMembers(id));
    }

    @PutMapping("/{id}")
    public Board updateBoard(@PathVariable String id, @RequestBody Board board) {
        board.setId(id);
        return boardService.updateBoard(board);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteBoard(@PathVariable String id) {
        boardService.deleteBoard(id);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/invite")
    public ResponseEntity<?> inviteUser(@PathVariable String id, @RequestBody InviteRequest inviteRequest) {
        boardService.inviteUser(id, inviteRequest.getEmail(), inviteRequest.getSenderName());
        return ResponseEntity.ok().build();
    }

    @PostMapping("/accept-invite/{notificationId}")
    public ResponseEntity<?> acceptInvite(@PathVariable String notificationId) {
        boardService.acceptInvite(notificationId);
        return ResponseEntity.ok().build();
    }

    public static class InviteRequest {
        private String email;
        private String senderName;
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        public String getSenderName() { return senderName; }
        public void setSenderName(String senderName) { this.senderName = senderName; }
    }
}

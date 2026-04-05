package com.kanban.kanban_backend.controller;

import com.kanban.kanban_backend.model.Comment;
import com.kanban.kanban_backend.security.UserDetailsImpl;
import com.kanban.kanban_backend.service.CommentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/comments")
public class CommentController {
    @Autowired
    private CommentService commentService;

    @GetMapping("/task/{taskId}")
    public List<Comment> getTaskComments(@PathVariable String taskId) {
        return commentService.getTaskComments(taskId);
    }

    @PostMapping
    public Comment createComment(@RequestBody Comment comment, Authentication authentication) {
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        comment.setAuthorId(userDetails.getId());
        comment.setAuthorName(userDetails.getName());
        return commentService.createComment(comment);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteComment(@PathVariable String id) {
        commentService.deleteComment(id);
        return ResponseEntity.ok().build();
    }
}

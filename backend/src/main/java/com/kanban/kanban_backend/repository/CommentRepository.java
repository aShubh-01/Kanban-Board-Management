package com.kanban.kanban_backend.repository;
import com.kanban.kanban_backend.model.Comment;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;
public interface CommentRepository extends MongoRepository<Comment, String> {
    List<Comment> findByTaskIdOrderByCreatedAtDesc(String taskId);
}
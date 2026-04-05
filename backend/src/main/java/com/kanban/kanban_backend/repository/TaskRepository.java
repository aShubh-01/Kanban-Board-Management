package com.kanban.kanban_backend.repository;
import com.kanban.kanban_backend.model.Task;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;
public interface TaskRepository extends MongoRepository<Task, String> {
    List<Task> findByListIdOrderByPositionAsc(String listId);
}
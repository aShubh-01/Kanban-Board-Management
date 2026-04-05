package com.kanban.kanban_backend.repository;

import com.kanban.kanban_backend.model.Attachment;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface AttachmentRepository extends MongoRepository<Attachment, String> {
    List<Attachment> findByTaskId(String taskId);
}

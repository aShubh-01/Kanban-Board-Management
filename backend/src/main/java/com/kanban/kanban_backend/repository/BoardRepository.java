package com.kanban.kanban_backend.repository;
import com.kanban.kanban_backend.model.Board;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;
public interface BoardRepository extends MongoRepository<Board, String> {
    List<Board> findByOwnerIdOrMemberIdsContaining(String ownerId, String memberId);
}
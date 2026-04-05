package com.kanban.kanban_backend.repository;
import com.kanban.kanban_backend.model.BoardList;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;
public interface BoardListRepository extends MongoRepository<BoardList, String> {
    List<BoardList> findByBoardIdOrderByPositionAsc(String boardId);
}
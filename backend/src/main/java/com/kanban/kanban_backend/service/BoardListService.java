package com.kanban.kanban_backend.service;

import com.kanban.kanban_backend.model.BoardList;
import com.kanban.kanban_backend.repository.BoardListRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class BoardListService {
    @Autowired
    private BoardListRepository boardListRepository;

    public List<BoardList> getBoardLists(String boardId) {
        return boardListRepository.findByBoardIdOrderByPositionAsc(boardId);
    }

    public BoardList createList(BoardList boardList) {
        // Set position as current count + 1
        List<BoardList> existing = boardListRepository.findByBoardIdOrderByPositionAsc(boardList.getBoardId());
        boardList.setPosition(existing.size());
        return boardListRepository.save(boardList);
    }

    public BoardList updateList(BoardList boardList) {
        return boardListRepository.save(boardList);
    }

    public List<BoardList> reorderLists(List<String> listIds) {
        for (int i = 0; i < listIds.size(); i++) {
            String id = listIds.get(i);
            BoardList list = boardListRepository.findById(id).orElse(null);
            if (list != null) {
                list.setPosition(i);
                boardListRepository.save(list);
            }
        }
        return boardListRepository.findAllById(listIds);
    }

    public void deleteList(String id) {
        boardListRepository.deleteById(id);
    }
}

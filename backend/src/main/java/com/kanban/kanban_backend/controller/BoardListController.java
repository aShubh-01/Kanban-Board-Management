package com.kanban.kanban_backend.controller;

import com.kanban.kanban_backend.model.BoardList;
import com.kanban.kanban_backend.service.BoardListService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/lists")
public class BoardListController {
    @Autowired
    private BoardListService boardListService;

    @GetMapping("/board/{boardId}")
    public List<BoardList> getBoardLists(@PathVariable String boardId) {
        return boardListService.getBoardLists(boardId);
    }

    @PostMapping
    public BoardList createList(@RequestBody BoardList boardList) {
        return boardListService.createList(boardList);
    }

    @PutMapping("/{id}")
    public BoardList updateList(@PathVariable String id, @RequestBody BoardList boardList) {
        boardList.setId(id);
        return boardListService.updateList(boardList);
    }

    @PostMapping("/reorder")
    public List<BoardList> reorderLists(@RequestBody List<String> listIds) {
        return boardListService.reorderLists(listIds);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteList(@PathVariable String id) {
        boardListService.deleteList(id);
        return ResponseEntity.ok().build();
    }
}

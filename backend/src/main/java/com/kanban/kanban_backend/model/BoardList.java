package com.kanban.kanban_backend.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "lists")
public class BoardList {
    @Id
    private String id;
    private String title;
    private String boardId;
    private int position;

    public BoardList() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getBoardId() { return boardId; }
    public void setBoardId(String boardId) { this.boardId = boardId; }
    public int getPosition() { return position; }
    public void setPosition(int position) { this.position = position; }
}

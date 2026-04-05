package com.kanban.kanban_backend.controller;

import com.kanban.kanban_backend.model.Attachment;
import com.kanban.kanban_backend.service.AttachmentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/tasks/{taskId}/attachments")
@CrossOrigin(origins = "*")
public class AttachmentController {

    @Autowired
    private AttachmentService attachmentService;

    @PostMapping
    public ResponseEntity<Attachment> uploadAttachment(
            @PathVariable String taskId,
            @RequestParam("file") MultipartFile file) throws IOException {
        
        String userId = SecurityContextHolder.getContext().getAuthentication().getName();
        return ResponseEntity.ok(attachmentService.uploadFile(taskId, file, userId));
    }

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getAttachments(@PathVariable String taskId) {
        List<Attachment> attachments = attachmentService.getTaskAttachments(taskId);
        
        List<Map<String, Object>> response = attachments.stream().map(att -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", att.getId());
            map.put("fileName", att.getFileName());
            map.put("contentType", att.getContentType());
            map.put("size", att.getSize());
            map.put("url", attachmentService.generatePresignedUrl(att.getFileKey()));
            map.put("createdAt", att.getCreatedAt());
            map.put("uploadedBy", att.getUploadedBy());
            return map;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{attachmentId}")
    public ResponseEntity<Void> deleteAttachment(@PathVariable String attachmentId) {
        attachmentService.deleteAttachment(attachmentId);
        return ResponseEntity.noContent().build();
    }
}

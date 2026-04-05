package com.kanban.kanban_backend.service;

import com.amazonaws.HttpMethod;
import com.amazonaws.services.s3.AmazonS3;
import com.amazonaws.services.s3.model.ObjectMetadata;
import com.amazonaws.services.s3.model.PutObjectRequest;
import com.kanban.kanban_backend.model.Attachment;
import com.kanban.kanban_backend.repository.AttachmentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.URL;
import java.time.LocalDateTime;
import java.util.*;

@Service
public class AttachmentService {

    @Autowired
    private AmazonS3 s3Client;

    @Autowired
    private AttachmentRepository attachmentRepository;

    @Value("${aws.bucketName}")
    private String bucketName;

    public Attachment uploadFile(String taskId, MultipartFile file, String userId) throws IOException {
        String fileId = UUID.randomUUID().toString();
        String fileKey = "tasks/" + taskId + "/" + fileId + "_" + file.getOriginalFilename();

        ObjectMetadata metadata = new ObjectMetadata();
        metadata.setContentType(file.getContentType());
        metadata.setContentLength(file.getSize());

        s3Client.putObject(new PutObjectRequest(bucketName, fileKey, file.getInputStream(), metadata));

        Attachment attachment = new Attachment();
        attachment.setTaskId(taskId);
        attachment.setFileName(file.getOriginalFilename());
        attachment.setFileKey(fileKey);
        attachment.setContentType(file.getContentType());
        attachment.setSize(file.getSize());
        attachment.setUploadedBy(userId);
        attachment.setCreatedAt(LocalDateTime.now());

        return attachmentRepository.save(attachment);
    }

    public List<Attachment> getTaskAttachments(String taskId) {
        return attachmentRepository.findByTaskId(taskId);
    }

    public String generatePresignedUrl(String fileKey) {
        Date expiration = new Date();
        long expTimeMillis = expiration.getTime() + (1000 * 60 * 60); // 1 hour
        expiration.setTime(expTimeMillis);

        URL url = s3Client.generatePresignedUrl(bucketName, fileKey, expiration, HttpMethod.GET);
        return url.toString();
    }

    public void deleteAttachment(String attachmentId) {
        Attachment attachment = attachmentRepository.findById(attachmentId).orElseThrow(() -> new RuntimeException("Attachment not found"));
        s3Client.deleteObject(bucketName, attachment.getFileKey());
        attachmentRepository.deleteById(attachmentId);
    }
}

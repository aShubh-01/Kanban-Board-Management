package com.kanban.kanban_backend.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/test")
public class S3TestController {

    @Value("${aws.region}")
    private String region;

    @Value("${aws.bucketName}")
    private String bucketName;

    @Value("${aws.accessKey}")
    private String accessKey;

    @GetMapping("/s3-config")
    public Map<String, String> getS3Config() {
        Map<String, String> config = new HashMap<>();
        config.put("region", region);
        config.put("bucketName", bucketName);
        config.put("accessKeySet", (accessKey != null && !accessKey.isEmpty()) ? "Yes" : "No");
        return config;
    }
}

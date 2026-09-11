package com.keystone.backend.controller;

import com.keystone.backend.entity.StatusHistory;
import com.keystone.backend.repository.StatusHistoryRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/status-history")
@CrossOrigin(origins = "http://localhost:5173")
public class StatusHistoryController {

    private final StatusHistoryRepository statusHistoryRepository;

    public StatusHistoryController(
            StatusHistoryRepository statusHistoryRepository) {

        this.statusHistoryRepository =
                statusHistoryRepository;
    }

    // =========================================================
    // GET HISTORY FOR A REQUEST
    // =========================================================

    @GetMapping("/request/{requestId}")
    public List<StatusHistory> getRequestHistory(
            @PathVariable Long requestId) {

        return statusHistoryRepository
                .findByRequestIdOrderByChangedAtAsc(requestId);
    }

    // =========================================================
    // GET ALL HISTORY
    // =========================================================

    @GetMapping
    public List<StatusHistory> getAllHistory() {

        return statusHistoryRepository
                .findAll();
    }

    // =========================================================
    // GET HISTORY ENTRY
    // =========================================================

    @GetMapping("/{id}")
    public ResponseEntity<?> getHistoryById(
            @PathVariable Long id) {

        return statusHistoryRepository
                .findById(id)
                .map(ResponseEntity::ok)
                .orElseGet(
                        () -> ResponseEntity.notFound().build()
                );
    }
}
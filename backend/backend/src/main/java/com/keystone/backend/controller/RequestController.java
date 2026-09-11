package com.keystone.backend.controller;

import com.keystone.backend.entity.ServiceRequest;
import com.keystone.backend.entity.StatusHistory;
import com.keystone.backend.repository.ServiceRequestRepository;
import com.keystone.backend.repository.StatusHistoryRepository;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/requests")
@CrossOrigin(origins = "http://localhost:5173")
public class RequestController {

    private final ServiceRequestRepository requestRepository;
    private final StatusHistoryRepository historyRepository;

    public RequestController(
            ServiceRequestRepository requestRepository,
            StatusHistoryRepository historyRepository) {

        this.requestRepository = requestRepository;
        this.historyRepository = historyRepository;
    }

    @GetMapping
    public List<ServiceRequest> getAllRequests() {
        return requestRepository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<ServiceRequest> getRequest(@PathVariable Long id) {

        return requestRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/customer/{customerId}")
    public List<ServiceRequest> getCustomerRequests(
            @PathVariable Long customerId) {

        return requestRepository.findByCustomerId(customerId);
    }

    @GetMapping("/technician/{technicianId}")
    public List<ServiceRequest> getTechnicianRequests(
            @PathVariable Long technicianId) {

        return requestRepository.findByTechnicianId(technicianId);
    }

    @PostMapping
    public ResponseEntity<?> createRequest(
            @RequestBody ServiceRequest request,
            @RequestHeader(value = "X-User-Id", required = false) Long userId,
            @RequestHeader(value = "X-User-Role", required = false) String role) {

        if (request.getCustomerId() == null) {
            return ResponseEntity.badRequest()
                    .body("Customer ID is required");
        }

        if (request.getTitle() == null || request.getTitle().isBlank()) {
            return ResponseEntity.badRequest()
                    .body("Title is required");
        }

        if (request.getPriority() == null ||
                request.getPriority().isBlank()) {

            request.setPriority("MEDIUM");
        }

        if (request.getStatus() == null ||
                request.getStatus().isBlank()) {

            request.setStatus("PENDING");
        }

        ServiceRequest saved = requestRepository.save(request);

        saveHistory(
                saved,
                null,
                saved.getStatus(),
                userId,
                role,
                "Service request created"
        );

        return ResponseEntity.ok(saved);
    }

    @PutMapping("/{id}/assign/{technicianId}")
    public ResponseEntity<?> assignTechnician(
            @PathVariable Long id,
            @PathVariable Long technicianId,
            @RequestHeader(value = "X-User-Id", required = false) Long userId,
            @RequestHeader(value = "X-User-Role", required = false) String role) {

        Optional<ServiceRequest> optional = requestRepository.findById(id);

        if (optional.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        ServiceRequest request = optional.get();

        request.setTechnicianId(technicianId);

        if ("PENDING".equals(request.getStatus())) {
            request.setStatus("ASSIGNED");
        }

        ServiceRequest saved = requestRepository.save(request);

        saveHistory(
                saved,
                null,
                saved.getStatus(),
                userId,
                role,
                "Technician assigned: " + technicianId
        );

        return ResponseEntity.ok(saved);
    }

    @PutMapping("/{id}/status/{status}")
    public ResponseEntity<?> updateStatus(
            @PathVariable Long id,
            @PathVariable String status,
            @RequestHeader(value = "X-User-Id", required = false) Long userId,
            @RequestHeader(value = "X-User-Role", required = false) String role) {

        Optional<ServiceRequest> optional = requestRepository.findById(id);

        if (optional.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        ServiceRequest request = optional.get();

        String oldStatus = request.getStatus();

        status = status.toUpperCase();

        if (!isValidTransition(oldStatus, status)) {

            return ResponseEntity.badRequest()
                    .body("Invalid status transition: "
                            + oldStatus + " → " + status);
        }

        request.setStatus(status);

        LocalDateTime now = LocalDateTime.now();

        if ("IN_PROGRESS".equals(status)
                && request.getStartedAt() == null) {

            request.setStartedAt(now);
        }

        if ("COMPLETED".equals(status)
                && request.getCompletedAt() == null) {

            request.setCompletedAt(now);
        }

        ServiceRequest saved = requestRepository.save(request);

        saveHistory(
                saved,
                oldStatus,
                status,
                userId,
                role,
                "Status changed from "
                        + oldStatus + " to " + status
        );

        return ResponseEntity.ok(saved);
    }

    @PutMapping("/{id}/schedule")
    public ResponseEntity<?> scheduleRequest(
            @PathVariable Long id,
            @RequestBody Map<String, String> body,
            @RequestHeader(value = "X-User-Id", required = false) Long userId,
            @RequestHeader(value = "X-User-Role", required = false) String role) {

        Optional<ServiceRequest> optional = requestRepository.findById(id);

        if (optional.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        String scheduledAt = body.get("scheduledAt");

        if (scheduledAt == null || scheduledAt.isBlank()) {
            return ResponseEntity.badRequest()
                    .body("scheduledAt is required");
        }

        try {

            LocalDateTime dateTime =
                    LocalDateTime.parse(scheduledAt);

            ServiceRequest request = optional.get();

            request.setScheduledAt(dateTime);

            ServiceRequest saved =
                    requestRepository.save(request);

            return ResponseEntity.ok(saved);

        } catch (Exception e) {

            return ResponseEntity.badRequest()
                    .body("Invalid scheduledAt format. Use yyyy-MM-ddTHH:mm:ss");
        }
    }

    @PutMapping("/{id}/sla")
    public ResponseEntity<?> updateSla(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {

        Optional<ServiceRequest> optional =
                requestRepository.findById(id);

        if (optional.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        String slaDueAt = body.get("slaDueAt");

        if (slaDueAt == null || slaDueAt.isBlank()) {
            return ResponseEntity.badRequest()
                    .body("slaDueAt is required");
        }

        try {

            LocalDateTime due =
                    LocalDateTime.parse(slaDueAt);

            ServiceRequest request = optional.get();

            request.setSlaDueAt(due);

            return ResponseEntity.ok(
                    requestRepository.save(request)
            );

        } catch (Exception e) {

            return ResponseEntity.badRequest()
                    .body("Invalid SLA date format");
        }
    }

    @PutMapping("/{id}/technician-notes")
    public ResponseEntity<?> updateTechnicianNotes(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {

        Optional<ServiceRequest> optional =
                requestRepository.findById(id);

        if (optional.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        ServiceRequest request = optional.get();

        request.setTechnicianNotes(body.get("technicianNotes"));

        return ResponseEntity.ok(
                requestRepository.save(request)
        );
    }

    @PutMapping("/{id}/completion-notes")
    public ResponseEntity<?> updateCompletionNotes(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {

        Optional<ServiceRequest> optional =
                requestRepository.findById(id);

        if (optional.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        ServiceRequest request = optional.get();

        request.setCompletionNotes(
                body.get("completionNotes")
        );

        return ResponseEntity.ok(
                requestRepository.save(request)
        );
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateRequest(
            @PathVariable Long id,
            @RequestBody ServiceRequest incoming) {

        Optional<ServiceRequest> optional =
                requestRepository.findById(id);

        if (optional.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        ServiceRequest request = optional.get();

        if (incoming.getTitle() != null)
            request.setTitle(incoming.getTitle());

        if (incoming.getDescription() != null)
            request.setDescription(incoming.getDescription());

        if (incoming.getLocation() != null)
            request.setLocation(incoming.getLocation());

        if (incoming.getServiceType() != null)
            request.setServiceType(incoming.getServiceType());

        if (incoming.getPriority() != null)
            request.setPriority(incoming.getPriority());

        if (incoming.getScheduledAt() != null)
            request.setScheduledAt(incoming.getScheduledAt());

        if (incoming.getSlaDueAt() != null)
            request.setSlaDueAt(incoming.getSlaDueAt());

        return ResponseEntity.ok(
                requestRepository.save(request)
        );
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteRequest(
            @PathVariable Long id) {

        if (!requestRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }

        requestRepository.deleteById(id);

        return ResponseEntity.ok(
                "Request deleted successfully"
        );
    }

    @GetMapping("/{id}/sla-status")
    public ResponseEntity<?> getSlaStatus(
            @PathVariable Long id) {

        Optional<ServiceRequest> optional =
                requestRepository.findById(id);

        if (optional.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        ServiceRequest request = optional.get();

        LocalDateTime now = LocalDateTime.now();

        boolean completed =
                "COMPLETED".equals(request.getStatus())
                || "CLOSED".equals(request.getStatus());

        boolean overdue = false;

        if (!completed && request.getSlaDueAt() != null) {
            overdue = now.isAfter(request.getSlaDueAt());
        }

        long remainingMinutes = 0;

        if (!completed && request.getSlaDueAt() != null) {

            remainingMinutes =
                    java.time.Duration.between(
                            now,
                            request.getSlaDueAt()
                    ).toMinutes();
        }

        Map<String, Object> response =
                new LinkedHashMap<>();

        response.put("requestId", request.getId());
        response.put("slaDueAt", request.getSlaDueAt());
        response.put("overdue", overdue);
        response.put("completed", completed);
        response.put("remainingMinutes", remainingMinutes);

        if (completed) {
            response.put("status", "COMPLETED");
        } else if (overdue) {
            response.put("status", "OVERDUE");
        } else if (remainingMinutes <= 240) {
            response.put("status", "DUE_SOON");
        } else {
            response.put("status", "ON_TRACK");
        }

        return ResponseEntity.ok(response);
    }

    private boolean isValidTransition(
            String oldStatus,
            String newStatus) {

        if (oldStatus == null) {
            return true;
        }

        if (oldStatus.equals(newStatus)) {
            return true;
        }

        return switch (oldStatus.toUpperCase()) {

            case "PENDING" ->
                    newStatus.equals("ASSIGNED")
                    || newStatus.equals("CANCELLED");

            case "ASSIGNED" ->
                    newStatus.equals("IN_PROGRESS")
                    || newStatus.equals("CANCELLED");

            case "IN_PROGRESS" ->
                    newStatus.equals("ON_HOLD")
                    || newStatus.equals("COMPLETED")
                    || newStatus.equals("CANCELLED");

            case "ON_HOLD" ->
                    newStatus.equals("IN_PROGRESS")
                    || newStatus.equals("CANCELLED");

            case "COMPLETED" ->
                    newStatus.equals("CLOSED");

            case "CLOSED", "CANCELLED" ->
                    false;

            default ->
                    true;
        };
    }

    private void saveHistory(
            ServiceRequest request,
            String oldStatus,
            String newStatus,
            Long userId,
            String role,
            String note) {

        StatusHistory history =
                new StatusHistory();

        history.setRequestId(request.getId());
        history.setOldStatus(oldStatus);
        history.setNewStatus(newStatus);
        history.setChangedByUserId(userId);
        history.setChangedByRole(role);
        history.setNote(note);

        historyRepository.save(history);
    }
}
package com.keystone.backend.controller;

import com.keystone.backend.entity.TimeLog;
import com.keystone.backend.repository.TimeLogRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;
//import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/time-logs")
@CrossOrigin(origins = "http://localhost:5173")
public class TimeLogController {

    private final TimeLogRepository timeLogRepository;

    public TimeLogController(TimeLogRepository timeLogRepository) {
        this.timeLogRepository = timeLogRepository;
    }

    @GetMapping("/request/{requestId}")
    public List<TimeLog> getRequestTimeLogs(
            @PathVariable Long requestId) {

        return timeLogRepository
                .findByRequestIdOrderByStartTimeAsc(requestId);
    }

    @GetMapping("/technician/{technicianId}")
    public List<TimeLog> getTechnicianTimeLogs(
            @PathVariable Long technicianId) {

        return timeLogRepository
                .findByTechnicianIdOrderByStartTimeDesc(technicianId);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getTimeLog(
            @PathVariable Long id) {

        Optional<TimeLog> log =
                timeLogRepository.findById(id);

        if (log.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok(log.get());
    }

    @PostMapping
    public ResponseEntity<?> createTimeLog(
            @RequestBody TimeLog timeLog) {

        if (timeLog.getRequestId() == null) {
            return ResponseEntity.badRequest()
                    .body("requestId is required.");
        }

        if (timeLog.getTechnicianId() == null) {
            return ResponseEntity.badRequest()
                    .body("technicianId is required.");
        }

        if (timeLog.getStartTime() == null) {
            return ResponseEntity.badRequest()
                    .body("startTime is required.");
        }

        if (timeLog.getEndTime() != null) {

            if (timeLog.getEndTime()
                    .isBefore(timeLog.getStartTime())) {

                return ResponseEntity.badRequest()
                        .body("endTime cannot be before startTime.");
            }

            long minutes = Duration.between(
                    timeLog.getStartTime(),
                    timeLog.getEndTime()
            ).toMinutes();

            timeLog.setDurationMinutes((int) minutes);

        } else {

            timeLog.setDurationMinutes(0);
        }

        timeLog.setId(null);

        return ResponseEntity.ok(
                timeLogRepository.save(timeLog)
        );
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateTimeLog(
            @PathVariable Long id,
            @RequestBody TimeLog updated) {

        Optional<TimeLog> optional =
                timeLogRepository.findById(id);

        if (optional.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        TimeLog log = optional.get();

        if (updated.getStartTime() != null) {
            log.setStartTime(updated.getStartTime());
        }

        if (updated.getEndTime() != null) {
            log.setEndTime(updated.getEndTime());
        }

        if (updated.getDescription() != null) {
            log.setDescription(updated.getDescription());
        }

        if (log.getStartTime() != null &&
                log.getEndTime() != null) {

            if (log.getEndTime()
                    .isBefore(log.getStartTime())) {

                return ResponseEntity.badRequest()
                        .body("endTime cannot be before startTime.");
            }

            long minutes = Duration.between(
                    log.getStartTime(),
                    log.getEndTime()
            ).toMinutes();

            log.setDurationMinutes((int) minutes);
        }

        return ResponseEntity.ok(
                timeLogRepository.save(log)
        );
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteTimeLog(
            @PathVariable Long id) {

        if (!timeLogRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }

        timeLogRepository.deleteById(id);

        return ResponseEntity.ok(
                "Time log deleted successfully."
        );
    }
}
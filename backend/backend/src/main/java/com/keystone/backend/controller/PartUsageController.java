package com.keystone.backend.controller;

import com.keystone.backend.entity.PartUsage;
import com.keystone.backend.repository.PartUsageRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/part-usages")
@CrossOrigin(origins = "http://localhost:5173")
public class PartUsageController {

    private final PartUsageRepository partUsageRepository;

    public PartUsageController(
            PartUsageRepository partUsageRepository) {

        this.partUsageRepository = partUsageRepository;
    }

    @GetMapping("/request/{requestId}")
    public List<PartUsage> getRequestParts(
            @PathVariable Long requestId) {

        return partUsageRepository
                .findByRequestIdOrderByUsedAtDesc(requestId);
    }

    @GetMapping("/technician/{technicianId}")
    public List<PartUsage> getTechnicianParts(
            @PathVariable Long technicianId) {

        return partUsageRepository
                .findByTechnicianIdOrderByUsedAtDesc(technicianId);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getPartUsage(
            @PathVariable Long id) {

        Optional<PartUsage> part =
                partUsageRepository.findById(id);

        if (part.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok(part.get());
    }

    @PostMapping
    public ResponseEntity<?> createPartUsage(
            @RequestBody PartUsage partUsage) {

        if (partUsage.getRequestId() == null) {
            return ResponseEntity.badRequest()
                    .body("requestId is required.");
        }

        if (partUsage.getTechnicianId() == null) {
            return ResponseEntity.badRequest()
                    .body("technicianId is required.");
        }

        if (partUsage.getPartName() == null ||
                partUsage.getPartName().trim().isEmpty()) {

            return ResponseEntity.badRequest()
                    .body("partName is required.");
        }

        if (partUsage.getQuantity() == null ||
                partUsage.getQuantity() <= 0) {

            return ResponseEntity.badRequest()
                    .body("quantity must be greater than zero.");
        }

        if (partUsage.getUnitCost() != null &&
                partUsage.getUnitCost() < 0) {

            return ResponseEntity.badRequest()
                    .body("unitCost cannot be negative.");
        }

        partUsage.setId(null);

        return ResponseEntity.ok(
                partUsageRepository.save(partUsage)
        );
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updatePartUsage(
            @PathVariable Long id,
            @RequestBody PartUsage updated) {

        Optional<PartUsage> optional =
                partUsageRepository.findById(id);

        if (optional.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        PartUsage part = optional.get();

        if (updated.getPartName() != null) {
            part.setPartName(updated.getPartName());
        }

        if (updated.getPartNumber() != null) {
            part.setPartNumber(updated.getPartNumber());
        }

        if (updated.getQuantity() != null) {

            if (updated.getQuantity() <= 0) {
                return ResponseEntity.badRequest()
                        .body("quantity must be greater than zero.");
            }

            part.setQuantity(updated.getQuantity());
        }

        if (updated.getUnitCost() != null) {

            if (updated.getUnitCost() < 0) {
                return ResponseEntity.badRequest()
                        .body("unitCost cannot be negative.");
            }

            part.setUnitCost(updated.getUnitCost());
        }

        if (updated.getNotes() != null) {
            part.setNotes(updated.getNotes());
        }

        return ResponseEntity.ok(
                partUsageRepository.save(part)
        );
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deletePartUsage(
            @PathVariable Long id) {

        if (!partUsageRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }

        partUsageRepository.deleteById(id);

        return ResponseEntity.ok(
                "Part usage deleted successfully."
        );
    }
}
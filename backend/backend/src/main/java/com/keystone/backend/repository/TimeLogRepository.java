package com.keystone.backend.repository;

import com.keystone.backend.entity.TimeLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TimeLogRepository extends JpaRepository<TimeLog, Long> {

    List<TimeLog> findByRequestIdOrderByStartTimeAsc(Long requestId);

    List<TimeLog> findByTechnicianIdOrderByStartTimeDesc(Long technicianId);
}
package com.keystone.backend.repository;

import com.keystone.backend.entity.StatusHistory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface StatusHistoryRepository
        extends JpaRepository<StatusHistory, Long> {

    List<StatusHistory> findByRequestIdOrderByChangedAtAsc(
            Long requestId
    );
}
package com.servify.backend.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.servify.backend.entity.Convite;
import com.servify.backend.enums.ConviteStatus;

public interface ConviteRepository extends JpaRepository<Convite, Integer> {
    Optional<Convite> findByToken(String token);

    Optional<Convite> findByEmailAndStatus(
            String email,
            ConviteStatus status);
}

package com.servify.backend.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.servify.backend.entity.Perfil;

public interface PerfilRepository extends JpaRepository<Perfil, Integer> {
    Optional<Perfil> findById(Integer id);
}

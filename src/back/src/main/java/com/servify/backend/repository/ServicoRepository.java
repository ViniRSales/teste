package com.servify.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.servify.backend.entity.Servico;

public interface ServicoRepository extends JpaRepository<Servico, Long> {

    List<Servico> findAllByOrderByNomeAsc();

    List<Servico> findByNomeContainingIgnoreCaseOrderByNomeAsc(String nome);
}

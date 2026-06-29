package com.servify.backend.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.servify.backend.entity.Comissao;

public interface ComissaoRepository extends JpaRepository<Comissao, Long> {
    Optional<Comissao> findByUsuario_Id(Long usuarioId);

    List<Comissao> findAllByOrderByIdAsc();
}

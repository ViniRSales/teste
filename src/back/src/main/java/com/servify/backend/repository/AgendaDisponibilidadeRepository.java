package com.servify.backend.repository;

import java.time.DayOfWeek;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.servify.backend.entity.AgendaDisponibilidade;

public interface AgendaDisponibilidadeRepository extends JpaRepository<AgendaDisponibilidade, Long> {

    List<AgendaDisponibilidade> findByColaborador_Id(Long colaboradorId);

    Optional<AgendaDisponibilidade> findByColaborador_IdAndDiaSemana(
            Long colaboradorId,
            DayOfWeek diaSemana);

}

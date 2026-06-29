package com.servify.backend.constants;

import java.time.DayOfWeek;
import java.time.LocalTime;
import java.util.Set;

public final class AgendaDisponibilidadeConstants {
    private AgendaDisponibilidadeConstants() {
    }

    public static final LocalTime HORA_INICIO_PADRAO = LocalTime.of(8, 0);

    public static final LocalTime HORA_FIM_PADRAO = LocalTime.of(18, 0);

    public static final Set<DayOfWeek> DIAS_SEM_DISPONIBILIDADE_PADRAO = Set.of(
            DayOfWeek.SUNDAY);
}

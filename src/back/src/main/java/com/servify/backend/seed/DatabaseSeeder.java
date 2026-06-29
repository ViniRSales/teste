package com.servify.backend.seed;

import java.math.BigDecimal;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Random;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import com.servify.backend.constants.AgendaDisponibilidadeConstants;
import com.servify.backend.constants.PerfilConstants;
import com.servify.backend.entity.AgendaDisponibilidade;
import com.servify.backend.entity.Agendamento;
import com.servify.backend.entity.Comissao;
import com.servify.backend.entity.Perfil;
import com.servify.backend.entity.Servico;
import com.servify.backend.entity.Usuario;
import com.servify.backend.enums.AgendamentoStatus;
import com.servify.backend.repository.AgendaDisponibilidadeRepository;
import com.servify.backend.repository.AgendamentoRepository;
import com.servify.backend.repository.ComissaoRepository;
import com.servify.backend.repository.PerfilRepository;
import com.servify.backend.repository.ServicoRepository;
import com.servify.backend.repository.UsuarioRepository;

@Configuration
@Profile("seed")
public class DatabaseSeeder {

    // -------------------------------------------------------------------------
    // Dados estáticos
    // -------------------------------------------------------------------------

    private static final String SENHA_DEMO = "123456";

    private static final LocalDate DATA_INICIO = LocalDate.of(2026, 4, 1);
    private static final LocalDate DATA_FIM = LocalDate.of(2026, 7, 15);

    private static final String[][] COLABORADORES = {
            // { nome, email, cpf, telefone, nascimento }
            { "Carlos Eduardo Silva", "carlos.silva@servify.com", "11122233344", "11987651001", "1990-03-15" },
            { "Ana Paula Ferreira", "ana.ferreira@servify.com", "22233344455", "11987651002", "1988-07-22" },
            { "Roberto Souza", "roberto.souza@servify.com", "33344455566", "11987651003", "1992-11-08" },
            { "Juliana Costa", "juliana.costa@servify.com", "44455566677", "11987651004", "1995-01-30" },
            { "Marcos Oliveira", "marcos.oliveira@servify.com", "55566677788", "11987651005", "1987-06-12" },
            { "Fernanda Lima", "fernanda.lima@servify.com", "66677788899", "11987651006", "1993-09-25" },
            { "Diego Santos", "diego.santos@servify.com", "77788899900", "11987651007", "1991-04-18" },
            { "Patricia Mendes", "patricia.mendes@servify.com", "88899900011", "11987651008", "1989-12-03" },
            { "Thiago Rodrigues", "thiago.rodrigues@servify.com", "99900011122", "11987651009", "1994-08-07" },
            { "Camila Alves", "camila.alves@servify.com", "10011122233", "11987651010", "1996-02-14" },
    };

    // 50 clientes: índices 0–9 são crianças (nascidos após 2014), 10–49 são adultos
    private static final String[][] CLIENTES = {
            // Crianças (10)
            { "Pedro Henrique Souza", "pedro.h.souza@email.com", "12312312300", "11981110001", "2015-03-10" },
            { "Sophia Lima", "sophia.lima@email.com", "23423423400", "11981110002", "2016-07-22" },
            { "Gabriel Ferreira", "gabriel.ferreira@email.com", "34534534500", "11981110003", "2014-11-05" },
            { "Isabella Costa", "isabella.costa@email.com", "45645645600", "11981110004", "2017-01-18" },
            { "Lucas Oliveira", "lucas.oliveira@email.com", "56756756700", "11981110005", "2015-09-30" },
            { "Valentina Santos", "valentina.santos@email.com", "67867867800", "11981110006", "2016-04-14" },
            { "Enzo Rodrigues", "enzo.rodrigues@email.com", "78978978900", "11981110007", "2018-06-25" },
            { "Helena Alves", "helena.alves@email.com", "89089089000", "11981110008", "2014-02-08" },
            { "Matheus Mendes", "matheus.mendes@email.com", "90190190100", "11981110009", "2019-08-12" },
            { "Laura Silva", "laura.silva@email.com", "01201201200", "11981110010", "2017-12-03" },
            // Adultos (40)
            { "João Carlos Pereira", "joao.pereira@email.com", "11111222200", "11982220001", "1985-05-20" },
            { "Maria Aparecida Gomes", "maria.gomes@email.com", "22222333300", "11982220002", "1978-09-14" },
            { "José Antonio Barbosa", "jose.barbosa@email.com", "33333444400", "11982220003", "1992-03-28" },
            { "Ana Carolina Nascimento", "ana.nascimento@email.com", "44444555500", "11982220004", "1990-11-07" },
            { "Francisco Ribeiro", "francisco.ribeiro@email.com", "55555666600", "11982220005", "1983-07-16" },
            { "Antônia Carvalho", "antonia.carvalho@email.com", "66666777700", "11982220006", "1975-01-22" },
            { "Paulo Eduardo Martins", "paulo.martins@email.com", "77777888800", "11982220007", "1988-04-09" },
            { "Francisca Rocha", "francisca.rocha@email.com", "88888999900", "11982220008", "1995-10-31" },
            { "Antônio Melo", "antonio.melo@email.com", "99999000000", "11982220009", "1980-06-17" },
            { "Edilson Teixeira", "edilson.teixeira@email.com", "10010010010", "11982220010", "1972-02-25" },
            { "Bruna Freitas", "bruna.freitas@email.com", "20020020020", "11982220011", "1993-08-13" },
            { "Rafael Campos", "rafael.campos@email.com", "30030030030", "11982220012", "1987-12-04" },
            { "Camila Nunes", "camila.nunes@email.com", "40040040040", "11982220013", "1991-05-19" },
            { "Anderson Moreira", "anderson.moreira@email.com", "50050050050", "11982220014", "1984-03-07" },
            { "Daniela Cunha", "daniela.cunha@email.com", "60060060060", "11982220015", "1979-09-26" },
            { "Leandro Pinto", "leandro.pinto@email.com", "70070070070", "11982220016", "1996-01-11" },
            { "Tatiana Cavalcante", "tatiana.cavalcante@email.com", "80080080080", "11982220017", "1982-07-30" },
            { "Fábio Correia", "fabio.correia@email.com", "90090090090", "11982220018", "1977-04-15" },
            { "Renata Cardoso", "renata.cardoso@email.com", "11011011011", "11982220019", "1994-11-22" },
            { "Sérgio Lopes", "sergio.lopes@email.com", "21021021021", "11982220020", "1986-08-08" },
            { "Vanessa Aragão", "vanessa.aragao@email.com", "31031031031", "11982220021", "1990-02-14" },
            { "Rodrigo Farias", "rodrigo.farias@email.com", "41041041041", "11982220022", "1983-06-01" },
            { "Cristiane Vieira", "cristiane.vieira@email.com", "51051051051", "11982220023", "1976-10-19" },
            { "Marcelo Bezerra", "marcelo.bezerra@email.com", "61061061061", "11982220024", "1989-03-27" },
            { "Adriana Moura", "adriana.moura@email.com", "71071071071", "11982220025", "1997-07-05" },
            { "Gustavo Monteiro", "gustavo.monteiro@email.com", "81081081081", "11982220026", "1981-01-16" },
            { "Simone Dias", "simone.dias@email.com", "91091091091", "11982220027", "1974-09-23" },
            { "Leonardo Macedo", "leonardo.macedo@email.com", "12112112112", "11982220028", "1998-05-10" },
            { "Patrícia Borges", "patricia.borges@email.com", "22122122122", "11982220029", "1985-12-28" },
            { "Vinícius Pires", "vinicius.pires@email.com", "32132132132", "11982220030", "1992-04-06" },
            { "Aline Guimarães", "aline.guimaraes@email.com", "42142142142", "11982220031", "1988-08-21" },
            { "Fernando Queiroz", "fernando.queiroz@email.com", "52152152152", "11982220032", "1973-02-17" },
            { "Mônica Lacerda", "monica.lacerda@email.com", "62162162162", "11982220033", "1995-06-09" },
            { "Alexandre Ramos", "alexandre.ramos@email.com", "72172172172", "11982220034", "1980-10-30" },
            { "Luciana Andrade", "luciana.andrade@email.com", "82182182182", "11982220035", "1971-03-18" },
            { "Thiago Neto", "thiago.neto@email.com", "92192192192", "11982220036", "1993-07-25" },
            { "Priscila Xavier", "priscila.xavier@email.com", "13213213213", "11982220037", "1987-11-12" },
            { "Henrique Vasconcelos", "henrique.vasconcelos@email.com", "23223223223", "11982220038", "1976-05-04" },
            { "Juliana Pacheco", "juliana.pacheco@email.com", "33233233233", "11982220039", "1999-01-20" },
            { "Bruno Marques", "bruno.marques@email.com", "43243243243", "11982220040", "1984-09-07" },
    };

    // { nome, valor, duracaoMinutos, icone }
    private static final Object[][] SERVICOS = {
            { "Corte Cabelo Masculino", new BigDecimal("45.00"), 30, "scissors" },
            { "Corte Cabelo Feminino", new BigDecimal("80.00"), 60, "scissors" },
            { "Corte Infantil", new BigDecimal("35.00"), 30, "scissors" },
            { "Corte e Barba", new BigDecimal("65.00"), 60, "razor" },
            { "Barba", new BigDecimal("30.00"), 30, "razor" },
            { "Coloração", new BigDecimal("150.00"), 120, "palette" },
            { "Mechas / Luzes", new BigDecimal("200.00"), 120, "sparkles" },
            { "Escova Progressiva", new BigDecimal("180.00"), 120, "brush" },
            { "Hidratação Capilar", new BigDecimal("70.00"), 60, "water_drop" },
            { "Penteado", new BigDecimal("90.00"), 60, "crown" },
    };

    // Comissões: índice i → colaborador i (0-based). Valores entre 0.05 e 0.30
    private static final BigDecimal[] COMISSOES = {
            new BigDecimal("0.1500"), // Carlos 15%
            new BigDecimal("0.2000"), // Ana 20%
            new BigDecimal("0.1200"), // Roberto 12%
            new BigDecimal("0.1800"), // Juliana 18%
            new BigDecimal("0.2500"), // Marcos 25%
            new BigDecimal("0.1000"), // Fernanda 10%
            new BigDecimal("0.3000"), // Diego 30%
            new BigDecimal("0.0800"), // Patricia 8%
            new BigDecimal("0.2200"), // Thiago 22%
            new BigDecimal("0.0500"), // Camila 5%
    };

    // -------------------------------------------------------------------------
    // Bean principal
    // -------------------------------------------------------------------------

    @Bean
    CommandLineRunner seed(
            PerfilRepository perfilRepository,
            UsuarioRepository usuarioRepository,
            ComissaoRepository comissaoRepository,
            ServicoRepository servicoRepository,
            AgendaDisponibilidadeRepository agendaDisponibilidadeRepository,
            AgendamentoRepository agendamentoRepository) {

        return args -> {

            System.out.println("[SEED] Iniciando limpeza do banco...");

            // Ordem respeitando FKs
            agendamentoRepository.deleteAll();
            agendaDisponibilidadeRepository.deleteAll();
            comissaoRepository.deleteAll();
            usuarioRepository.deleteAll();
            servicoRepository.deleteAll();

            System.out.println("[SEED] Banco limpo. Criando dados de demonstração...");

            BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
            String senhaHash = encoder.encode(SENHA_DEMO);
            Random random = new Random(42); // seed fixo para reprodutibilidade

            // -----------------------------------------------------------------
            // Perfis (já existem no banco via migration/init — só buscamos)
            // -----------------------------------------------------------------
            Perfil perfilAdmin = perfilRepository.findById(PerfilConstants.ADMIN)
                    .orElseThrow(() -> new RuntimeException(
                            "[SEED] Perfil ADMIN não encontrado. Execute as migrations primeiro."));
            Perfil perfilColaborador = perfilRepository.findById(PerfilConstants.COLABORADOR)
                    .orElseThrow(() -> new RuntimeException("[SEED] Perfil COLABORADOR não encontrado."));
            Perfil perfilCliente = perfilRepository.findById(PerfilConstants.CLIENTE)
                    .orElseThrow(() -> new RuntimeException("[SEED] Perfil CLIENTE não encontrado."));

            // -----------------------------------------------------------------
            // Admin
            // -----------------------------------------------------------------
            Usuario admin = new Usuario();
            admin.setPerfil(perfilAdmin);
            admin.setCpf("00000000001");
            admin.setNome("Administrador Servify");
            admin.setEmail("admin@servify.com");
            admin.setSenha(senhaHash);
            admin.setTelefone("11900000001");
            admin.setDataNascimento(LocalDate.of(1985, 1, 1));
            admin.setCep("01310100");
            admin.setLogradouro("Avenida Paulista");
            admin.setNumero("1000");
            admin.setComplemento("Sala 1");
            admin.setBairro("Bela Vista");
            admin.setCidade("São Paulo");
            admin.setUf("SP");
            admin.setCadastroPendente(false);
            usuarioRepository.save(admin);

            // -----------------------------------------------------------------
            // Colaboradores
            // -----------------------------------------------------------------
            List<Usuario> colaboradores = new ArrayList<>();
            for (int i = 0; i < COLABORADORES.length; i++) {
                String[] d = COLABORADORES[i];
                Usuario u = new Usuario();
                u.setPerfil(perfilColaborador);
                u.setCpf(d[2]);
                u.setNome(d[0]);
                u.setEmail(d[1]);
                u.setSenha(senhaHash);
                u.setTelefone(d[3]);
                u.setDataNascimento(LocalDate.parse(d[4]));
                u.setCep("01310100");
                u.setLogradouro("Avenida Paulista");
                u.setNumero(String.valueOf(100 + i));
                u.setComplemento("");
                u.setBairro("Bela Vista");
                u.setCidade("São Paulo");
                u.setUf("SP");
                u.setCadastroPendente(false);
                colaboradores.add(usuarioRepository.save(u));
            }

            // -----------------------------------------------------------------
            // Comissões dos colaboradores
            // -----------------------------------------------------------------
            for (int i = 0; i < colaboradores.size(); i++) {
                Comissao comissao = new Comissao();
                comissao.setUsuario(colaboradores.get(i));
                comissao.setValor(COMISSOES[i]);
                comissaoRepository.save(comissao);
            }

            // -----------------------------------------------------------------
            // Agenda de disponibilidade dos colaboradores (Seg–Sáb, 08h–18h)
            // -----------------------------------------------------------------
            for (Usuario colaborador : colaboradores) {
                for (DayOfWeek dia : DayOfWeek.values()) {
                    AgendaDisponibilidade agenda = new AgendaDisponibilidade();
                    agenda.setColaborador(colaborador);
                    agenda.setDiaSemana(dia);
                    boolean disponivel = !AgendaDisponibilidadeConstants.DIAS_SEM_DISPONIBILIDADE_PADRAO.contains(dia);
                    agenda.setDisponivel(disponivel);
                    agenda.setHoraInicio(AgendaDisponibilidadeConstants.HORA_INICIO_PADRAO);
                    agenda.setHoraFim(AgendaDisponibilidadeConstants.HORA_FIM_PADRAO);
                    agendaDisponibilidadeRepository.save(agenda);
                }
            }

            // -----------------------------------------------------------------
            // Clientes
            // -----------------------------------------------------------------
            List<Usuario> clientes = new ArrayList<>();
            for (int i = 0; i < CLIENTES.length; i++) {
                String[] d = CLIENTES[i];
                Usuario u = new Usuario();
                u.setPerfil(perfilCliente);
                u.setCpf(d[2]);
                u.setNome(d[0]);
                u.setEmail(d[1]);
                u.setSenha(senhaHash);
                u.setTelefone(d[3]);
                u.setDataNascimento(LocalDate.parse(d[4]));
                u.setCep("01310100");
                u.setLogradouro("Rua das Flores");
                u.setNumero(String.valueOf(200 + i));
                u.setComplemento("");
                u.setBairro("Centro");
                u.setCidade("São Paulo");
                u.setUf("SP");
                u.setCadastroPendente(false);
                clientes.add(usuarioRepository.save(u));
            }

            // -----------------------------------------------------------------
            // Serviços
            // -----------------------------------------------------------------
            List<Servico> servicos = new ArrayList<>();
            for (Object[] d : SERVICOS) {
                Servico s = new Servico();
                s.setNome((String) d[0]);
                s.setValor((BigDecimal) d[1]);
                s.setDuracaoMinutos((Integer) d[2]);
                s.setIcone((String) d[3]);
                s.setAtivo(true);
                servicos.add(servicoRepository.save(s));
            }

            // -----------------------------------------------------------------
            // Agendamentos
            // Rastreamos os slots ocupados para evitar conflitos:
            // clienteSlots: clienteId → lista de [inicio, fim]
            // colaboradorSlots: colaboradorId → lista de [inicio, fim]
            // -----------------------------------------------------------------
            Map<Long, List<LocalDateTime[]>> clienteSlots = new HashMap<>();
            Map<Long, List<LocalDateTime[]>> colaboradorSlots = new HashMap<>();

            // Horários de início possíveis (08h–17h de hora em hora)
            LocalTime[] horariosInicioOpcoes = {
                    LocalTime.of(8, 0), LocalTime.of(9, 0), LocalTime.of(10, 0),
                    LocalTime.of(11, 0), LocalTime.of(13, 0), LocalTime.of(14, 0),
                    LocalTime.of(15, 0), LocalTime.of(16, 0), LocalTime.of(17, 0),
            };

            // Dias disponíveis no intervalo (excluindo domingos)
            List<LocalDate> diasDisponiveis = new ArrayList<>();
            LocalDate d = DATA_INICIO;
            while (!d.isAfter(DATA_FIM)) {
                if (d.getDayOfWeek() != DayOfWeek.SUNDAY) {
                    diasDisponiveis.add(d);
                }
                d = d.plusDays(1);
            }

            int totalAgendamentos = 0;

            for (Usuario cliente : clientes) {
                int qtdAgendamentos = 2 + random.nextInt(4); // 2 a 5

                int tentativasCliente = 0;
                int agendamentosCliente = 0;

                while (agendamentosCliente < qtdAgendamentos && tentativasCliente < 200) {
                    tentativasCliente++;

                    // Sorteia data, colaborador, serviço e horário
                    LocalDate dataSorteada = diasDisponiveis.get(random.nextInt(diasDisponiveis.size()));
                    Usuario colaborador = colaboradores.get(random.nextInt(colaboradores.size()));
                    Servico servico = servicos.get(random.nextInt(servicos.size()));
                    LocalTime horarioInicio = horariosInicioOpcoes[random.nextInt(horariosInicioOpcoes.length)];

                    LocalDateTime inicio = LocalDateTime.of(dataSorteada, horarioInicio);
                    LocalDateTime fim = inicio.plusMinutes(servico.getDuracaoMinutos());

                    // Verifica se o horário de fim não ultrapassa 18h
                    if (fim.toLocalTime().isAfter(LocalTime.of(18, 0))) {
                        continue;
                    }

                    // Verifica conflito de cliente
                    if (temConflito(clienteSlots.getOrDefault(cliente.getId(), List.of()), inicio, fim)) {
                        continue;
                    }

                    // Verifica conflito de colaborador
                    if (temConflito(colaboradorSlots.getOrDefault(colaborador.getId(), List.of()), inicio, fim)) {
                        continue;
                    }

                    // Determina o status com base na data/hora
                    LocalDateTime agora = LocalDateTime.now();
                    AgendamentoStatus status;
                    if (fim.isBefore(agora)) {
                        status = AgendamentoStatus.CONCLUIDO;
                    } else if (inicio.isBefore(agora)) {
                        status = AgendamentoStatus.EM_ANDAMENTO;
                    } else {
                        status = AgendamentoStatus.AGENDADO;
                    }

                    // Desconto ocasional (~15% dos agendamentos têm desconto)
                    BigDecimal desconto = BigDecimal.ZERO;
                    if (random.nextInt(100) < 15) {
                        // Desconto de 5% a 20% do valor do serviço
                        int percentualDesconto = 5 + random.nextInt(16);
                        desconto = servico.getValor()
                                .multiply(BigDecimal.valueOf(percentualDesconto))
                                .divide(BigDecimal.valueOf(100))
                                .setScale(2, java.math.RoundingMode.HALF_UP);
                    }

                    // Busca comissão do colaborador
                    BigDecimal comissaoValor = COMISSOES[colaboradores.indexOf(colaborador)];

                    // Persiste o agendamento
                    Agendamento agendamento = new Agendamento();
                    agendamento.setCliente(cliente);
                    agendamento.setColaborador(colaborador);
                    agendamento.setServico(servico);
                    agendamento.setDataHora(inicio);
                    agendamento.setDuracaoMinutos(servico.getDuracaoMinutos());
                    agendamento.setValor(servico.getValor());
                    agendamento.setDesconto(desconto);
                    agendamento.setComissao(comissaoValor);
                    agendamento.setAgendamentoStatus(status);
                    agendamentoRepository.save(agendamento);

                    // Registra slots ocupados
                    clienteSlots.computeIfAbsent(cliente.getId(), k -> new ArrayList<>())
                            .add(new LocalDateTime[] { inicio, fim });
                    colaboradorSlots.computeIfAbsent(colaborador.getId(), k -> new ArrayList<>())
                            .add(new LocalDateTime[] { inicio, fim });

                    agendamentosCliente++;
                    totalAgendamentos++;
                }
            }

            System.out.println("[SEED] Concluído com sucesso!");
            System.out.println("[SEED]   Admin:          1");
            System.out.println("[SEED]   Colaboradores:  " + colaboradores.size());
            System.out.println("[SEED]   Clientes:       " + clientes.size());
            System.out.println("[SEED]   Serviços:       " + servicos.size());
            System.out.println("[SEED]   Agendamentos:   " + totalAgendamentos);
            System.out.println("[SEED] Senha de todos os usuários: " + SENHA_DEMO);
        };
    }

    // -------------------------------------------------------------------------
    // Utilitário de conflito de horário
    // -------------------------------------------------------------------------

    /**
     * Retorna true se o intervalo [novoInicio, novoFim) conflita com algum
     * dos slots já registrados.
     */
    private boolean temConflito(List<LocalDateTime[]> slots,
            LocalDateTime novoInicio,
            LocalDateTime novoFim) {
        for (LocalDateTime[] slot : slots) {
            LocalDateTime existenteInicio = slot[0];
            LocalDateTime existenteFim = slot[1];
            // Conflito quando os intervalos se sobrepõem
            if (novoInicio.isBefore(existenteFim) && novoFim.isAfter(existenteInicio)) {
                return true;
            }
        }
        return false;
    }
}
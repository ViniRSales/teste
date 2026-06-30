import { useCallback, useEffect, useMemo, useState } from 'react'
import AgendamentoFormModal from '../components/AgendamentoFormModal'
import ConfirmarExclusaoAgendamentoModal from '../components/ConfirmarExclusaoAgendamentoModal'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Container from '@mui/material/Container'
import Dialog from '@mui/material/Dialog'
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import Add from '@mui/icons-material/Add'
import ArrowBackOutlined from '@mui/icons-material/ArrowBackOutlined'
import CalendarMonthOutlined from '@mui/icons-material/CalendarMonthOutlined'
import ChevronLeft from '@mui/icons-material/ChevronLeft'
import ChevronRight from '@mui/icons-material/ChevronRight'
import CloseOutlined from '@mui/icons-material/CloseOutlined'
import DeleteOutlineOutlined from '@mui/icons-material/DeleteOutlineOutlined'
import EditOutlined from '@mui/icons-material/EditOutlined'
import InfoOutlined from '@mui/icons-material/InfoOutlined'
import Search from '@mui/icons-material/Search'
import { useSidebarLayout } from '../context/SidebarLayoutContext'
import {
  toastCadastroSucesso,
  toastError,
  toastSuccess,
} from '../components/showAlert'
import { mensagemDeErroCapturado } from '../services/api'
import {
  atualizarAgendamento,
  criarAgendamento,
  deleteAgendamentoPorId,
  getAgendamentos,
  type Agendamento,
  type AgendamentoFormPayload,
} from '../services/agendamentos'
import { getClientes, type Cliente } from '../services/clientes'
import { getColaboradores, type Colaborador } from '../services/colaboradores'
import { getServicos, type Servico } from '../services/servicos'
import { formatMoedaBrlFromNumber } from '../utils/masks'

const NAVY = '#1e3a5f'
const BORDER = '#e2e8f0'
const PAGE_BG = '#f8fafc'
const EVENT_BG = '#eff6ff'
const EVENT_BORDER = '#bfdbfe'
const SLOT_HEIGHT = 88
const START_HOUR = 8
const END_HOUR = 22
const horarios = Array.from(
  { length: END_HOUR - START_HOUR + 1 },
  (_, index) => START_HOUR + index,
)
const DIAS_LABEL = ['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB', 'DOM']
const PRESTADOR_THEMES = [
  { bg: '#eff6ff', border: '#bfdbfe', accent: '#2563eb', pill: '#dbeafe' },
  { bg: '#f0fdf4', border: '#bbf7d0', accent: '#16a34a', pill: '#dcfce7' },
  { bg: '#fff7ed', border: '#fed7aa', accent: '#ea580c', pill: '#ffedd5' },
  { bg: '#f5f3ff', border: '#ddd6fe', accent: '#7c3aed', pill: '#ede9fe' },
  { bg: '#fdf2f8', border: '#fbcfe8', accent: '#db2777', pill: '#fce7f3' },
  { bg: '#ecfeff', border: '#a5f3fc', accent: '#0891b2', pill: '#cffafe' },
]

function startOfWeek(date: Date): Date {
  const copy = new Date(date)
  const day = copy.getDay()
  const diff = day === 0 ? -6 : 1 - day
  copy.setDate(copy.getDate() + diff)
  copy.setHours(0, 0, 0, 0)
  return copy
}

function addDays(date: Date, days: number): Date {
  const copy = new Date(date)
  copy.setDate(copy.getDate() + days)
  return copy
}

function toIsoDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function formatarDataPeriodo(date: Date): string {
  return date.toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'long',
  })
}

function minutosDesdeInicio(horario: string): number {
  const [hourRaw, minuteRaw] = horario.split(':')
  const hour = Number(hourRaw)
  const minute = Number(minuteRaw)
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return 0
  return (hour - START_HOUR) * 60 + minute
}

function formatarDuracao(minutos: number): string {
  if (!Number.isFinite(minutos) || minutos <= 0) return ''
  const horas = Math.floor(minutos / 60)
  const resto = minutos % 60
  if (horas && resto) return `${horas}h ${resto}min`
  if (horas) return `${horas}h`
  return `${resto}min`
}

function horarioFimAgendamento(horarioInicio: string, duracaoMinutos: number): string {
  const [hourRaw, minuteRaw] = horarioInicio.split(':')
  const hour = Number(hourRaw)
  const minute = Number(minuteRaw)
  if (
    !Number.isFinite(hour) ||
    !Number.isFinite(minute) ||
    !Number.isFinite(duracaoMinutos)
  ) {
    return horarioInicio
  }

  const inicioEmMinutos = hour * 60 + minute
  const fimEmMinutos = inicioEmMinutos + duracaoMinutos
  const fimHora = Math.floor(fimEmMinutos / 60) % 24
  const fimMinuto = fimEmMinutos % 60
  return `${String(fimHora).padStart(2, '0')}:${String(fimMinuto).padStart(2, '0')}`
}

function temaPorPrestador(colaboradorId: string) {
  const key = colaboradorId.trim() || 'sem-prestador'
  const hash = Array.from(key).reduce(
    (acc, char) => acc + char.charCodeAt(0),
    0,
  )
  return PRESTADOR_THEMES[hash % PRESTADOR_THEMES.length]
}

function valorServicoAgendamento(agendamento: Agendamento): number {
  return agendamento.valorFinal > 0 ? agendamento.valorFinal : agendamento.valor
}

function chaveHorarioAgendamento(agendamento: Agendamento): string {
  return `${agendamento.data}|${agendamento.horarioInicio}`
}

function dataHoraPayload(payload: AgendamentoFormPayload): {
  data: string
  horarioInicio: string
} {
  return {
    data: payload.dataHora.slice(0, 10),
    horarioInicio: payload.dataHora.slice(11, 16),
  }
}

/**
 * Tela principal de agendamentos.
 * Mesma instância é montada ao acessar "/" (redirect) ou "/agendamentos".
 */
export default function AgendamentosPage() {
  const { sidebarExpanded, toggleSidebar } = useSidebarLayout()
  const [busca, setBusca] = useState('')
  const [semanaInicio, setSemanaInicio] = useState(() => startOfWeek(new Date()))
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([])
  const [servicos, setServicos] = useState<Servico[]>([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [formMode, setFormMode] = useState<'create' | 'edit' | 'view'>('create')
  const [selected, setSelected] = useState<Agendamento | undefined>()
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [excluindo, setExcluindo] = useState(false)
  const [grupoSelecionado, setGrupoSelecionado] = useState<Agendamento[] | null>(null)

  const diasDaSemana = useMemo(
    () =>
      DIAS_LABEL.map((label, index) => {
        const data = addDays(semanaInicio, index)
        return { label, data, iso: toIsoDate(data), dia: data.getDate() }
      }),
    [semanaInicio],
  )

  const semanaFim = useMemo(() => addDays(semanaInicio, 6), [semanaInicio])

  const carregarDados = useCallback(async () => {
    setLoading(true)
    try {
      const [agendaData, clientesData, colaboradoresData, servicosData] =
        await Promise.all([
          getAgendamentos({
            inicio: `${toIsoDate(semanaInicio)}T00:00:00`,
            fim: `${toIsoDate(semanaFim)}T23:59:59`,
          }),
          getClientes(),
          getColaboradores(),
          getServicos(),
        ])

      setAgendamentos(agendaData.filter(a => a.status !== 'CANCELADO'))
      setClientes(clientesData.filter((cliente) => cliente.ativo))
      setColaboradores(
        colaboradoresData.filter((colaborador) => colaborador.status === 'ativo'),
      )
      setServicos(servicosData.filter((servico) => servico.ativo))
    } catch (e: unknown) {
      toastError(
        mensagemDeErroCapturado(e, 'Não foi possível carregar os agendamentos.'),
      )
    } finally {
      setLoading(false)
    }
  }, [semanaFim, semanaInicio])

  useEffect(() => {
    void carregarDados()
  }, [carregarDados])

  const agendamentosFiltrados = useMemo(() => {
    const q = busca.trim().toLowerCase()
    if (!q) return agendamentos

    return agendamentos.filter((agendamento) =>
      [
        agendamento.servicoNome,
        agendamento.clienteNome,
        agendamento.colaboradorNome,
      ].some((campo) => campo.toLowerCase().includes(q)),
    )
  }, [agendamentos, busca])

  const gruposAgendamentos = useMemo(() => {
    const grupos = new Map<string, Agendamento[]>()
    for (const agendamento of agendamentosFiltrados) {
      const chave = chaveHorarioAgendamento(agendamento)
      const grupo = grupos.get(chave)
      if (grupo) {
        grupo.push(agendamento)
      } else {
        grupos.set(chave, [agendamento])
      }
    }
    return Array.from(grupos.values())
  }, [agendamentosFiltrados])

  function abrirAdicionar() {
    setGrupoSelecionado(null)
    setFormMode('create')
    setSelected(undefined)
    setFormOpen(true)
  }

  function abrirAgendamento(agendamento: Agendamento) {
    setGrupoSelecionado(null)
    setFormMode(agendamento.status === 'AGENDADO' ? 'edit' : 'view')
    setSelected(agendamento)
    setFormOpen(true)
  }

  function fecharForm() {
    setFormOpen(false)
    setSelected(undefined)
  }

  function abrirGrupoAgendamentos(grupo: Agendamento[]) {
    setGrupoSelecionado(grupo)
  }

  function solicitarExclusaoAgendamento(agendamento: Agendamento) {
    setSelected(agendamento)
    setDeleteOpen(true)
  }

  async function handleSalvar(payload: AgendamentoFormPayload) {
    try {
      const { data, horarioInicio } = dataHoraPayload(payload)
      const clienteJaAgendado = agendamentos.some(
        (agendamento) =>
          agendamento.id !== selected?.id &&
          agendamento.clienteId === payload.clienteId &&
          agendamento.data === data &&
          agendamento.horarioInicio === horarioInicio,
      )

      if (clienteJaAgendado) {
        throw new Error('Este cliente já possui agendamento neste horário.')
      }

      if (formMode === 'create') {
        await criarAgendamento(payload)
        toastCadastroSucesso('Agendamento cadastrado com sucesso.')
      } else if (selected) {
        await atualizarAgendamento(selected.id, payload)
        toastCadastroSucesso('Agendamento atualizado com sucesso.')
      }
      await carregarDados()
      fecharForm()
    } catch (e: unknown) {
      throw new Error(
        mensagemDeErroCapturado(e, 'Não foi possível salvar o agendamento.'),
      )
    }
  }

  async function handleConfirmarExclusao() {
    if (!selected) return
    setExcluindo(true)
    try {
      await deleteAgendamentoPorId(selected.id)
      await carregarDados()
      setDeleteOpen(false)
      setGrupoSelecionado(null)
      fecharForm()
      toastSuccess('Agendamento excluído com sucesso.')
    } catch (e: unknown) {
      toastError(
        mensagemDeErroCapturado(e, 'Não foi possível excluir o agendamento.'),
      )
    } finally {
      setExcluindo(false)
    }
  }

  const periodoLabel = `${formatarDataPeriodo(semanaInicio)} - ${formatarDataPeriodo(
    semanaFim,
  )} de ${semanaFim.getFullYear()}`

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: PAGE_BG }}>
      <Box
        sx={{
          bgcolor: '#ffffff',
          borderBottom: `1px solid ${BORDER}`,
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <IconButton
          edge="start"
          aria-label={
            sidebarExpanded ? 'Fechar menu lateral' : 'Abrir menu lateral'
          }
          aria-expanded={sidebarExpanded}
          onClick={toggleSidebar}
          sx={{
            color: NAVY,
            alignSelf: 'center',
            ml: { xs: 0.75, sm: 1 },
            borderRadius: 1,
          }}
        >
          <ArrowBackOutlined sx={{ fontSize: 26 }} />
        </IconButton>
        <Container
          maxWidth="lg"
          sx={{
            flex: 1,
            py: 2.5,
            pr: { xs: 2, sm: 3 },
            pl: { xs: 1, sm: 2 },
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 2,
            minWidth: 0,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
            <CalendarMonthOutlined sx={{ fontSize: 28, color: NAVY }} />
            <Typography
              variant="h6"
              component="h1"
              sx={{
                fontWeight: 700,
                color: NAVY,
                fontSize: { xs: '1.1rem', sm: '1.25rem' },
                letterSpacing: '-0.02em',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              Gerenciar Agendamentos
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={abrirAdicionar}
            sx={{
              borderRadius: '10px',
              px: 2.5,
              py: 1,
              fontWeight: 700,
              textTransform: 'none',
              bgcolor: NAVY,
              flexShrink: 0,
              '&:hover': { bgcolor: '#162d4a' },
            }}
          >
            Adicionar
          </Button>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3 }, py: 3 }}>
        <TextField
          placeholder="Buscar agendamentos..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          disabled={loading}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <Search sx={{ color: '#9ca3af', fontSize: 22 }} />
                </InputAdornment>
              ),
            },
          }}
          sx={{
            width: { xs: '100%', sm: 380 },
            mb: 2,
            '& .MuiOutlinedInput-root': {
              bgcolor: '#ffffff',
              borderRadius: '10px',
              '& fieldset': { borderColor: BORDER },
            },
          }}
        />

        <Box
          sx={{
            bgcolor: '#ffffff',
            border: `1px solid ${BORDER}`,
            borderRadius: '12px',
            boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)',
            overflow: 'hidden',
          }}
        >
          <Box
            sx={{
              minHeight: 64,
              px: { xs: 1.5, sm: 2 },
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: `1px solid ${BORDER}`,
            }}
          >
            <IconButton
              aria-label="Semana anterior"
              onClick={() => setSemanaInicio((current) => addDays(current, -7))}
              sx={{ color: NAVY }}
            >
              <ChevronLeft />
            </IconButton>
            <Typography
              sx={{
                fontWeight: 700,
                color: '#0f172a',
                textAlign: 'center',
                fontSize: { xs: '0.875rem', sm: '0.9375rem' },
              }}
            >
              {periodoLabel}
            </Typography>
            <IconButton
              aria-label="Próxima semana"
              onClick={() => setSemanaInicio((current) => addDays(current, 7))}
              sx={{ color: NAVY }}
            >
              <ChevronRight />
            </IconButton>
          </Box>

          <Box sx={{ overflowX: 'auto' }}>
            <Box sx={{ minWidth: 860 }}>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: '72px repeat(7, 1fr)',
                  borderBottom: `1px solid ${BORDER}`,
                  bgcolor: '#f8fafc',
                }}
              >
                <Box sx={{ borderRight: `1px solid ${BORDER}` }} />
                {diasDaSemana.map((dia) => (
                  <Box
                    key={dia.label}
                    sx={{
                      minHeight: 58,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRight: `1px solid ${BORDER}`,
                      '&:last-child': { borderRight: 0 },
                    }}
                  >
                    <Typography
                      sx={{
                        color: '#94a3b8',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        letterSpacing: '0.04em',
                      }}
                    >
                      {dia.label}
                    </Typography>
                    <Typography
                      sx={{
                        color: '#0f172a',
                        fontWeight: 700,
                        fontSize: '0.875rem',
                      }}
                    >
                      {dia.dia}
                    </Typography>
                  </Box>
                ))}
              </Box>

              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: '72px repeat(7, 1fr)',
                  position: 'relative',
                }}
              >
                <Box>
                  {horarios.map((hora) => (
                    <Box
                      key={hora}
                      sx={{
                        height: SLOT_HEIGHT,
                        borderRight: `1px solid ${BORDER}`,
                        borderBottom: `1px solid ${BORDER}`,
                        px: 1.5,
                        py: 1,
                        color: '#64748b',
                        fontSize: '0.8125rem',
                      }}
                    >
                      {hora}:00
                    </Box>
                  ))}
                </Box>

                {diasDaSemana.map((dia) => (
                  <Box
                    key={dia.label}
                    sx={{
                      position: 'relative',
                      borderRight: `1px solid ${BORDER}`,
                      '&:last-child': { borderRight: 0 },
                    }}
                  >
                    {horarios.map((hora) => (
                      <Box
                        key={`${dia.label}-${hora}`}
                        sx={{
                          height: SLOT_HEIGHT,
                          borderBottom: `1px solid ${BORDER}`,
                        }}
                      />
                    ))}

                    {gruposAgendamentos
                      .filter((grupo) => grupo[0]?.data === dia.iso)
                      .map((grupo) => {
                        const agendamento = grupo[0]
                        if (!agendamento) return null

                        const isGrupo = grupo.length > 1
                        const tema = temaPorPrestador(agendamento.colaboradorId)
                        const valorServico = valorServicoAgendamento(agendamento)
                        const duracaoVisual = Math.max(
                          ...grupo.map((item) => item.duracaoMinutos),
                        )

                        const cardHeight = Math.max(
                          56,
                          (duracaoVisual / 60) * SLOT_HEIGHT - 12,
                        )
                        const isCompact = cardHeight < 80

                        return (
                          <Box
                            key={grupo.map((item) => item.id).join('-')}
                            role="button"
                            tabIndex={0}
                            onClick={() =>
                              isGrupo ? abrirGrupoAgendamentos(grupo) : abrirAgendamento(agendamento)
                            }
                            onKeyDown={(event) => {
                              if (event.key === 'Enter' || event.key === ' ') {
                                if (isGrupo) {
                                  abrirGrupoAgendamentos(grupo)
                                } else {
                                  abrirAgendamento(agendamento)
                                }
                              }
                            }}
                            sx={{
                              position: 'absolute',
                              top:
                                (minutosDesdeInicio(agendamento.horarioInicio) / 60) *
                                SLOT_HEIGHT +
                                8,
                              left: 8,
                              right: 8,
                              height: cardHeight,
                              bgcolor: tema.bg || EVENT_BG,
                              background:
                                `linear-gradient(135deg, ${tema.bg || EVENT_BG} 0%, #ffffff 100%)`,
                              border: `1px solid ${tema.border || EVENT_BORDER}`,
                              borderRadius: '14px',
                              p: 1.15,
                              overflow: 'hidden',
                              cursor: 'pointer',
                              boxShadow: '0 6px 18px rgba(15, 23, 42, 0.08)',
                              transformOrigin: 'center',
                              transition:
                                'transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease',
                              '&:hover': {
                                borderColor: tema.accent,
                                boxShadow: `0 14px 28px ${tema.accent}33`,
                                transform: 'scale(1.035)',
                                zIndex: 2,
                              },
                              '&:focus-visible': {
                                outline: `3px solid ${tema.accent}33`,
                                outlineOffset: 2,
                                transform: 'scale(1.035)',
                                zIndex: 2,
                              },
                            }}
                          >
                            {isGrupo ? (
                              <>
                                <Typography
                                  sx={{
                                    color: NAVY,
                                    fontWeight: 800,
                                    fontSize: '0.75rem',
                                    lineHeight: 1.15,
                                    whiteSpace: 'normal',
                                    wordBreak: 'normal',
                                    overflowWrap: 'normal',
                                  }}
                                >
                                  {grupo.length} agendamentos
                                </Typography>
                                <Typography
                                  sx={{
                                    display: 'inline-flex',
                                    width: 'fit-content',
                                    bgcolor: tema.pill,
                                    color: tema.accent,
                                    borderRadius: '999px',
                                    px: 0.7,
                                    py: 0.2,
                                    fontSize: '0.625rem',
                                    fontWeight: 800,
                                    lineHeight: 1.15,
                                    mt: 0.5,
                                    whiteSpace: 'normal',
                                    wordBreak: 'normal',
                                    overflowWrap: 'normal',
                                  }}
                                >
                                  Ver detalhes
                                </Typography>
                              </>
                            ) : (
                              <>
                                <Typography
                                  sx={{
                                    color: NAVY,
                                    fontWeight: 700,
                                    fontSize: '0.75rem',
                                    lineHeight: 1.2,
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                  }}
                                  title={agendamento.servicoNome}
                                >
                                  {agendamento.servicoNome}
                                </Typography>
                                <Box
                                  component="span"
                                  sx={{
                                    display: 'inline-flex',
                                    mt: 0.4,
                                    bgcolor: tema.pill,
                                    color: tema.accent,
                                    borderRadius: '999px',
                                    px: 0.75,
                                    py: 0.15,
                                    fontSize: '0.625rem',
                                    fontWeight: 800,
                                    lineHeight: 1.45,
                                    whiteSpace: 'nowrap',
                                  }}
                                >
                                  {formatMoedaBrlFromNumber(valorServico)}
                                </Box>
                                <Typography
                                  sx={{
                                    color: '#475569',
                                    fontSize: '0.6875rem',
                                    lineHeight: 1.25,
                                    mt: 0.35,
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                  }}
                                  title={agendamento.clienteNome}
                                >
                                  {agendamento.clienteNome}
                                </Typography>
                                {!isCompact && (
                                  <Typography
                                    sx={{
                                      color: '#475569',
                                      fontSize: '0.6875rem',
                                      lineHeight: 1.25,
                                      whiteSpace: 'nowrap',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                    }}
                                    title={agendamento.colaboradorNome}
                                  >
                                    Prestador: {agendamento.colaboradorNome}
                                  </Typography>
                                )}
                                <Typography
                                  sx={{
                                    color: NAVY,
                                    fontSize: '0.6875rem',
                                    fontWeight: 800,
                                    lineHeight: 1.25,
                                  }}
                                >
                                  {agendamento.horarioInicio} -{' '}
                                  {horarioFimAgendamento(
                                    agendamento.horarioInicio,
                                    agendamento.duracaoMinutos,
                                  )}
                                </Typography>
                                {!isCompact && (
                                  <Typography
                                    sx={{
                                      color: '#475569',
                                      fontSize: '0.6875rem',
                                      fontWeight: 600,
                                      lineHeight: 1.25,
                                    }}
                                  >
                                    Duração: {formatarDuracao(agendamento.duracaoMinutos)}
                                  </Typography>
                                )}
                              </>
                            )}
                          </Box>
                        )
                      })}
                  </Box>
                ))}
              </Box>
            </Box>
          </Box>
        </Box>

        <Typography
          variant="body2"
          sx={{ mt: 2, color: '#94a3b8', fontSize: '0.875rem' }}
        >
          {loading
            ? 'Carregando agendamentos...'
            : `${agendamentosFiltrados.length} agendamento${agendamentosFiltrados.length === 1 ? '' : 's'} encontrado${agendamentosFiltrados.length === 1 ? '' : 's'}`}
        </Typography>
      </Container>

      <Dialog
        open={Boolean(grupoSelecionado)}
        onClose={() => setGrupoSelecionado(null)}
        maxWidth="sm"
        fullWidth
        slotProps={{
          backdrop: {
            sx: {
              backdropFilter: 'blur(8px)',
              bgcolor: 'rgba(15, 23, 42, 0.48)',
            },
          },
          paper: {
            sx: {
              borderRadius: '18px',
              overflow: 'hidden',
            },
          },
        }}
      >
        <Box sx={{ bgcolor: '#ffffff', position: 'relative', px: 3, pt: 3, pb: 3 }}>
          <IconButton
            aria-label="Fechar"
            onClick={() => setGrupoSelecionado(null)}
            sx={{ position: 'absolute', top: 12, right: 12, color: '#64748b' }}
          >
            <CloseOutlined />
          </IconButton>

          <Box sx={{ pr: 4, mb: 2.5 }}>
            <Typography
              variant="h6"
              component="h2"
              sx={{ fontWeight: 800, color: NAVY, fontSize: '1.125rem' }}
            >
              Serviços no mesmo horário
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748b', mt: 0.5 }}>
              {grupoSelecionado?.length ?? 0} serviços encontrados para{' '}
              {grupoSelecionado?.[0]?.horarioInicio ?? '--:--'}
            </Typography>
          </Box>

          <Box sx={{ display: 'grid', gap: 1.25 }}>
            {grupoSelecionado?.map((agendamento) => {
              const tema = temaPorPrestador(agendamento.colaboradorId)
              return (
                <Box
                  key={agendamento.id}
                  sx={{
                    border: `1px solid ${tema.border}`,
                    borderRadius: '14px',
                    bgcolor: tema.bg,
                    background: `linear-gradient(135deg, ${tema.bg} 0%, #ffffff 100%)`,
                    p: 1.5,
                  }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      gap: 1.5,
                      alignItems: 'flex-start',
                    }}
                  >
                    <Box sx={{ minWidth: 0 }}>
                      <Typography
                        sx={{
                          color: NAVY,
                          fontWeight: 800,
                          fontSize: '0.9rem',
                          lineHeight: 1.2,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                        title={agendamento.servicoNome}
                      >
                        {agendamento.servicoNome}
                      </Typography>
                      <Typography
                        sx={{
                          color: tema.accent,
                          fontWeight: 800,
                          fontSize: '0.75rem',
                          mt: 0.35,
                        }}
                      >
                        {formatMoedaBrlFromNumber(valorServicoAgendamento(agendamento))}
                      </Typography>
                    </Box>

                    <Typography
                      sx={{
                        color: NAVY,
                        fontWeight: 800,
                        fontSize: '0.75rem',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {agendamento.horarioInicio} -{' '}
                      {horarioFimAgendamento(
                        agendamento.horarioInicio,
                        agendamento.duracaoMinutos,
                      )}
                    </Typography>
                  </Box>

                  <Typography
                    sx={{
                      color: '#475569',
                      fontSize: '0.75rem',
                      mt: 0.75,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                    title={agendamento.clienteNome}
                  >
                    Cliente: {agendamento.clienteNome}
                  </Typography>
                  <Typography
                    sx={{
                      color: '#475569',
                      fontSize: '0.75rem',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                    title={agendamento.colaboradorNome}
                  >
                    Prestador: {agendamento.colaboradorNome}
                  </Typography>
                  <Typography sx={{ color: '#475569', fontSize: '0.75rem', mt: 0.15 }}>
                    Duração: {formatarDuracao(agendamento.duracaoMinutos)}
                  </Typography>

                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 1.25 }}>
                    <Button
                      type="button"
                      variant="outlined"
                      size="small"
                      startIcon={agendamento.status === 'AGENDADO' ? <EditOutlined /> : <InfoOutlined />}
                      onClick={() => abrirAgendamento(agendamento)}
                      sx={{
                        borderRadius: '10px',
                        textTransform: 'none',
                        fontWeight: 700,
                        color: NAVY,
                        borderColor: tema.border,
                      }}
                    >
                      {agendamento.status === 'AGENDADO' ? 'Editar' : 'Visualizar'}
                    </Button>
                    {agendamento.status === 'AGENDADO' && (
                      <Button
                        type="button"
                        variant="outlined"
                        size="small"
                        startIcon={<DeleteOutlineOutlined />}
                        onClick={() => solicitarExclusaoAgendamento(agendamento)}
                        sx={{
                          borderRadius: '10px',
                          textTransform: 'none',
                          fontWeight: 700,
                          color: '#dc2626',
                          borderColor: '#fecaca',
                        }}
                      >
                        Excluir
                      </Button>
                    )}
                  </Box>
                </Box>
              )
            })}
          </Box>
        </Box>
      </Dialog>

      <AgendamentoFormModal
        open={formOpen}
        mode={formMode}
        initial={selected}
        clientes={clientes}
        colaboradores={colaboradores}
        servicos={servicos}
        onClose={fecharForm}
        onSubmit={handleSalvar}
        onRequestDelete={
          formMode === 'edit' ? () => setDeleteOpen(true) : undefined
        }
      />

      <ConfirmarExclusaoAgendamentoModal
        open={deleteOpen}
        nomeServico={selected?.servicoNome ?? ''}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleConfirmarExclusao}
        excluindo={excluindo}
      />
    </Box>
  )
}

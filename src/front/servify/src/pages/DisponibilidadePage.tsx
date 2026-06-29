import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Container from '@mui/material/Container'
import IconButton from '@mui/material/IconButton'
import Switch from '@mui/material/Switch'
import Typography from '@mui/material/Typography'
import ArrowBackOutlined from '@mui/icons-material/ArrowBackOutlined'
import CalendarMonthOutlined from '@mui/icons-material/CalendarMonthOutlined'
import SaveOutlined from '@mui/icons-material/SaveOutlined'
import ViewSidebarOutlined from '@mui/icons-material/ViewSidebarOutlined'
import { useSidebarLayout } from '../context/SidebarLayoutContext'
import { toastError, toastSuccess } from '../components/showAlert'
import { mensagemDeErroCapturado } from '../services/api'
import {
  atualizarDisponibilidade,
  getDisponibilidadePorColaborador,
  DIAS_SEMANA_LABEL,
  DIAS_SEMANA_ORDEM,
  type AgendaDisponibilidade,
  type DiaSemana,
} from '../services/disponibilidade'
import { getColaboradores } from '../services/colaboradores'
import { getSession, isAdminUser } from '../auth/session'

const NAVY = '#1e3a5f'
const BORDER = '#e2e8f0'
const PAGE_BG = '#f8fafc'
const GREEN = '#16a34a'
const GREEN_LIGHT = '#dcfce7'
const GRAY_LIGHT = '#f1f5f9'

type DiaState = {
  id: number
  diaSemana: DiaSemana
  disponivel: boolean
  horaInicio: string
  horaFim: string
  alterado: boolean
  salvando: boolean
  erro: string | null
}

function toState(item: AgendaDisponibilidade): DiaState {
  return {
    id: item.id,
    diaSemana: item.diaSemana,
    disponivel: item.disponivel,
    horaInicio: item.horaInicio,
    horaFim: item.horaFim,
    alterado: false,
    salvando: false,
    erro: null,
  }
}

/** Garante que horaInicio < horaFim quando disponível */
function validarDia(dia: DiaState): string | null {
  if (!dia.disponivel) return null
  if (!dia.horaInicio || !dia.horaFim) return 'Informe os horários.'
  if (dia.horaInicio >= dia.horaFim)
    return 'Horário de início deve ser anterior ao horário de fim.'
  return null
}

export default function DisponibilidadePage() {
  const { colaboradorId } = useParams<{ colaboradorId: string }>()
  const navigate = useNavigate()
  const { sidebarExpanded, toggleSidebar } = useSidebarLayout()

  const session = getSession()
  const isAdmin = isAdminUser(session?.user)

  const [nomeColaborador, setNomeColaborador] = useState<string>('')
  const [dias, setDias] = useState<DiaState[]>([])
  const [loading, setLoading] = useState(true)
  const [salvandoTodos, setSalvandoTodos] = useState(false)

  const podeSalvar = !isAdmin
    ? String(session?.user?.id) === colaboradorId
    : true

  const carregarDados = useCallback(async () => {
    if (!colaboradorId) return
    setLoading(true)
    try {
      const [itens, colaboradores] = await Promise.all([
        getDisponibilidadePorColaborador(Number(colaboradorId)),
        getColaboradores(),
      ])

      const colaborador = colaboradores.find((c) => String(c.id) === colaboradorId)
      if (colaborador) {
        setNomeColaborador(colaborador.nome ?? colaborador.email)
      }

      // Ordena segunda → domingo
      const mapa = Object.fromEntries(itens.map((i) => [i.diaSemana, i]))
      const ordenados = DIAS_SEMANA_ORDEM.map((dia) => mapa[dia]).filter(Boolean)
      setDias(ordenados.map(toState))
    } catch (e) {
      toastError(
        mensagemDeErroCapturado(e, 'Não foi possível carregar a disponibilidade.'),
      )
    } finally {
      setLoading(false)
    }
  }, [colaboradorId])

  useEffect(() => {
    void carregarDados()
  }, [carregarDados])

  function atualizarDia<K extends keyof DiaState>(
    diaSemana: DiaSemana,
    campo: K,
    valor: DiaState[K],
  ) {
    setDias((prev) =>
      prev.map((d) =>
        d.diaSemana === diaSemana
          ? { ...d, [campo]: valor, alterado: true, erro: null }
          : d,
      ),
    )
  }

  function toggleDisponivel(diaSemana: DiaSemana) {
    setDias((prev) =>
      prev.map((d) =>
        d.diaSemana === diaSemana
          ? { ...d, disponivel: !d.disponivel, alterado: true, erro: null }
          : d,
      ),
    )
  }

  const diasAlterados = useMemo(() => dias.filter((d) => d.alterado), [dias])
  const temAlteracoes = diasAlterados.length > 0

  async function salvarTodos() {
    // Valida todos antes de salvar
    const erros: Partial<Record<DiaSemana, string>> = {}
    for (const dia of diasAlterados) {
      const erro = validarDia(dia)
      if (erro) erros[dia.diaSemana] = erro
    }

    if (Object.keys(erros).length > 0) {
      setDias((prev) =>
        prev.map((d) =>
          erros[d.diaSemana] ? { ...d, erro: erros[d.diaSemana] ?? null } : d,
        ),
      )
      return
    }

    setSalvandoTodos(true)
    setDias((prev) => prev.map((d) => (d.alterado ? { ...d, salvando: true } : d)))

    const resultados = await Promise.allSettled(
      diasAlterados.map((dia) =>
        atualizarDisponibilidade(dia.id, {
          disponivel: dia.disponivel,
          horaInicio: dia.horaInicio,
          horaFim: dia.horaFim,
        }),
      ),
    )

    let totalSucesso = 0
    let totalErro = 0

    setDias((prev) => {
      const novos = [...prev]
      diasAlterados.forEach((dia, index) => {
        const resultado = resultados[index]
        const idx = novos.findIndex((d) => d.diaSemana === dia.diaSemana)
        if (idx === -1) return
        if (resultado.status === 'fulfilled') {
          novos[idx] = toState(resultado.value)
          totalSucesso++
        } else {
          const msg =
            resultado.reason instanceof Error
              ? resultado.reason.message
              : 'Erro ao salvar.'
          novos[idx] = { ...novos[idx], salvando: false, erro: msg }
          totalErro++
        }
      })
      return novos
    })

    setSalvandoTodos(false)

    if (totalErro === 0) {
      toastSuccess('Disponibilidade atualizada com sucesso.')
    } else if (totalSucesso > 0) {
      toastError(`${totalSucesso} dia(s) salvos, ${totalErro} com erro.`)
    } else {
      toastError('Não foi possível salvar as alterações.')
    }
  }

  const sidebarW = sidebarExpanded ? 280 : 76

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: PAGE_BG,
      }}
    >
      {/* Header */}
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: `${sidebarW}px`,
          right: 0,
          zIndex: 10,
          bgcolor: '#ffffff',
          borderBottom: `1px solid ${BORDER}`,
          display: 'flex',
          alignItems: 'center',
          px: { xs: 1.5, sm: 2 },
          transition: 'left 0.22s ease',
        }}
      >
        <IconButton
          onClick={toggleSidebar}
          size="small"
          aria-label="Alternar menu lateral"
          sx={{ color: NAVY, mr: 1, flexShrink: 0 }}
        >
          <ViewSidebarOutlined sx={{ fontSize: 26 }} />
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
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
            <IconButton
              size="small"
              onClick={() => navigate(-1)}
              aria-label="Voltar"
              sx={{ color: NAVY, flexShrink: 0 }}
            >
              <ArrowBackOutlined />
            </IconButton>
            <CalendarMonthOutlined sx={{ fontSize: 26, color: NAVY, flexShrink: 0 }} />
            <Box sx={{ minWidth: 0 }}>
              <Typography
                variant="h6"
                component="h1"
                sx={{
                  fontWeight: 700,
                  color: NAVY,
                  fontSize: { xs: '1rem', sm: '1.2rem' },
                  letterSpacing: '-0.02em',
                  lineHeight: 1.2,
                }}
              >
                Disponibilidade
              </Typography>
              {nomeColaborador && (
                <Typography
                  sx={{ fontSize: '0.8125rem', color: '#64748b', lineHeight: 1.3 }}
                >
                  {nomeColaborador}
                </Typography>
              )}
            </Box>
          </Box>

          {podeSalvar && (
            <Button
              variant="contained"
              startIcon={<SaveOutlined />}
              onClick={() => void salvarTodos()}
              disabled={!temAlteracoes || salvandoTodos}
              sx={{
                borderRadius: '10px',
                px: 2.5,
                py: 1,
                fontWeight: 700,
                textTransform: 'none',
                bgcolor: NAVY,
                flexShrink: 0,
                '&:hover': { bgcolor: '#162d4a' },
                '&.Mui-disabled': { bgcolor: '#cbd5e1', color: '#fff' },
              }}
            >
              {salvandoTodos ? 'Salvando...' : 'Salvar alterações'}
            </Button>
          )}
        </Container>
      </Box>

      {/* Conteúdo */}
      <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3 }, py: 3, pt: '88px' }}>
        {loading ? (
          <Typography sx={{ color: '#64748b', mt: 2 }}>
            Carregando disponibilidade...
          </Typography>
        ) : dias.length === 0 ? (
          <Typography sx={{ color: '#64748b', mt: 2 }}>
            Nenhuma disponibilidade encontrada para este colaborador.
          </Typography>
        ) : (
          <>
            {podeSalvar && (
              <Typography
                sx={{ color: '#64748b', fontSize: '0.875rem', mb: 3 }}
              >
                Ative ou desative cada dia e ajuste os horários. Clique em{' '}
                <strong>Salvar alterações</strong> para confirmar.
              </Typography>
            )}
            {!podeSalvar && (
              <Typography
                sx={{ color: '#64748b', fontSize: '0.875rem', mb: 3 }}
              >
                Visualização da agenda de disponibilidade. Apenas o próprio
                colaborador ou um administrador pode editar.
              </Typography>
            )}

            {/* Grade de dias */}
            <Box
              sx={{
                border: `1px solid ${BORDER}`,
                borderRadius: '14px',
                bgcolor: '#ffffff',
                overflow: 'hidden',
              }}
            >
              {dias.map((dia, index) => {
                const isUltimo = index === dias.length - 1
                const erro = dia.erro

                return (
                  <Box
                    key={dia.diaSemana}
                    sx={{
                      borderBottom: isUltimo ? 'none' : `1px solid ${BORDER}`,
                      px: { xs: 2, sm: 3 },
                      py: 2,
                      bgcolor: dia.alterado ? '#f8faff' : '#ffffff',
                      transition: 'background-color 0.15s ease',
                    }}
                  >
                    <Box
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: {
                          xs: '1fr',
                          sm: '200px 1fr',
                          md: '220px 120px 1fr',
                        },
                        alignItems: 'center',
                        gap: { xs: 1.5, sm: 2 },
                      }}
                    >
                      {/* Nome do dia + toggle */}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Switch
                          checked={dia.disponivel}
                          onChange={() => podeSalvar && toggleDisponivel(dia.diaSemana)}
                          disabled={!podeSalvar || dia.salvando}
                          size="small"
                          sx={{
                            '& .MuiSwitch-switchBase.Mui-checked': {
                              color: GREEN,
                            },
                            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track':
                              {
                                bgcolor: GREEN,
                              },
                          }}
                        />
                        <Box>
                          <Typography
                            sx={{
                              fontWeight: 700,
                              color: dia.disponivel ? NAVY : '#94a3b8',
                              fontSize: '0.9375rem',
                              lineHeight: 1.2,
                            }}
                          >
                            {DIAS_SEMANA_LABEL[dia.diaSemana]}
                          </Typography>
                          <Typography
                            sx={{
                              fontSize: '0.75rem',
                              color: dia.disponivel ? GREEN : '#94a3b8',
                              fontWeight: 600,
                            }}
                          >
                            {dia.disponivel ? 'Disponível' : 'Indisponível'}
                          </Typography>
                        </Box>
                      </Box>

                      {/* Horário de início */}
                      <Box>
                        <Typography
                          component="label"
                          sx={{
                            display: 'block',
                            fontSize: '0.6875rem',
                            fontWeight: 600,
                            color: '#64748b',
                            textTransform: 'uppercase',
                            letterSpacing: '0.06em',
                            mb: 0.5,
                          }}
                        >
                          Início
                        </Typography>
                        <input
                          type="time"
                          value={dia.horaInicio}
                          disabled={!dia.disponivel || !podeSalvar || dia.salvando}
                          onChange={(e) =>
                            atualizarDia(dia.diaSemana, 'horaInicio', e.target.value)
                          }
                          style={{
                            width: '100%',
                            padding: '8px 10px',
                            borderRadius: '8px',
                            border: `1px solid ${erro ? '#fca5a5' : BORDER}`,
                            fontSize: '0.9375rem',
                            fontFamily: 'inherit',
                            color: dia.disponivel && podeSalvar ? NAVY : '#94a3b8',
                            backgroundColor:
                              !dia.disponivel || !podeSalvar ? GRAY_LIGHT : '#ffffff',
                            outline: 'none',
                            cursor:
                              !dia.disponivel || !podeSalvar ? 'not-allowed' : 'text',
                            boxSizing: 'border-box',
                          }}
                        />
                      </Box>

                      {/* Horário de fim */}
                      <Box>
                        <Typography
                          component="label"
                          sx={{
                            display: 'block',
                            fontSize: '0.6875rem',
                            fontWeight: 600,
                            color: '#64748b',
                            textTransform: 'uppercase',
                            letterSpacing: '0.06em',
                            mb: 0.5,
                          }}
                        >
                          Fim
                        </Typography>
                        <input
                          type="time"
                          value={dia.horaFim}
                          disabled={!dia.disponivel || !podeSalvar || dia.salvando}
                          onChange={(e) =>
                            atualizarDia(dia.diaSemana, 'horaFim', e.target.value)
                          }
                          style={{
                            width: '100%',
                            padding: '8px 10px',
                            borderRadius: '8px',
                            border: `1px solid ${erro ? '#fca5a5' : BORDER}`,
                            fontSize: '0.9375rem',
                            fontFamily: 'inherit',
                            color: dia.disponivel && podeSalvar ? NAVY : '#94a3b8',
                            backgroundColor:
                              !dia.disponivel || !podeSalvar ? GRAY_LIGHT : '#ffffff',
                            outline: 'none',
                            cursor:
                              !dia.disponivel || !podeSalvar ? 'not-allowed' : 'text',
                            boxSizing: 'border-box',
                          }}
                        />
                      </Box>
                    </Box>

                    {/* Pill de alterado */}
                    {dia.alterado && !dia.salvando && !erro && (
                      <Box sx={{ mt: 1 }}>
                        <Box
                          component="span"
                          sx={{
                            display: 'inline-block',
                            bgcolor: '#eff6ff',
                            color: '#2563eb',
                            fontSize: '0.6875rem',
                            fontWeight: 700,
                            px: 1,
                            py: 0.25,
                            borderRadius: '6px',
                          }}
                        >
                          Alterado — não salvo
                        </Box>
                      </Box>
                    )}

                    {/* Salvando */}
                    {dia.salvando && (
                      <Box sx={{ mt: 1 }}>
                        <Typography sx={{ fontSize: '0.75rem', color: '#64748b' }}>
                          Salvando...
                        </Typography>
                      </Box>
                    )}

                    {/* Erro */}
                    {erro && (
                      <Box
                        sx={{
                          mt: 1,
                          px: 1.5,
                          py: 0.75,
                          bgcolor: '#fee2e2',
                          borderRadius: '8px',
                          display: 'inline-block',
                        }}
                      >
                        <Typography
                          sx={{ fontSize: '0.8125rem', color: '#dc2626', fontWeight: 600 }}
                        >
                          {erro}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                )
              })}
            </Box>

            {/* Resumo visual */}
            <Box
              sx={{
                mt: 2.5,
                display: 'flex',
                gap: 2,
                flexWrap: 'wrap',
              }}
            >
              {dias.map((dia) => (
                <Box
                  key={dia.diaSemana}
                  sx={{
                    px: 1.5,
                    py: 0.75,
                    borderRadius: '10px',
                    bgcolor: dia.disponivel ? GREEN_LIGHT : GRAY_LIGHT,
                    border: `1px solid ${dia.disponivel ? '#bbf7d0' : BORDER}`,
                    minWidth: 0,
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      color: dia.disponivel ? GREEN : '#94a3b8',
                    }}
                  >
                    {DIAS_SEMANA_LABEL[dia.diaSemana].slice(0, 3).toUpperCase()}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: '0.6875rem',
                      color: dia.disponivel ? '#166534' : '#94a3b8',
                    }}
                  >
                    {dia.disponivel ? `${dia.horaInicio} – ${dia.horaFim}` : 'Fechado'}
                  </Typography>
                </Box>
              ))}
            </Box>
          </>
        )}
      </Container>
    </Box>
  )
}
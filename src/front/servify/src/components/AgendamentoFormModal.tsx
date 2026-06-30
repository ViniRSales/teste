import { useEffect, useMemo, useState, type FormEvent } from 'react'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import MenuItem from '@mui/material/MenuItem'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import AccessTimeOutlined from '@mui/icons-material/AccessTimeOutlined'
import AttachMoneyOutlined from '@mui/icons-material/AttachMoneyOutlined'
import CalendarMonthOutlined from '@mui/icons-material/CalendarMonthOutlined'
import CloseOutlined from '@mui/icons-material/CloseOutlined'
import LocalOfferOutlined from '@mui/icons-material/LocalOfferOutlined'
import PersonOutlineOutlined from '@mui/icons-material/PersonOutlineOutlined'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { DesktopTimePicker } from '@mui/x-date-pickers/DesktopTimePicker'
import { renderMultiSectionDigitalClockTimeView } from '@mui/x-date-pickers/timeViewRenderers'
import dayjs, { type Dayjs } from 'dayjs'
import type {
  Agendamento,
  AgendamentoFormPayload,
} from '../services/agendamentos'
import type { Cliente } from '../services/clientes'
import type { Colaborador } from '../services/colaboradores'
import type { Servico } from '../services/servicos'
import { formatMoedaBrlFromNumber } from '../utils/masks'

const NAVY = '#1e3a5f'
const BORDER = '#e2e8f0'

export type AgendamentoFormValues = {
  servicoId: string
  clienteId: string
  colaboradorId: string
  data: string
  horarioInicio: string
  desconto: string
}

const EMPTY_VALUES: AgendamentoFormValues = {
  servicoId: '',
  clienteId: '',
  colaboradorId: '',
  data: '',
  horarioInicio: '',
  desconto: '0,00',
}

type AgendamentoFormModalProps = {
  open: boolean
  mode: 'create' | 'edit' | 'view'
  initial?: Agendamento
  clientes: Cliente[]
  colaboradores: Colaborador[]
  servicos: Servico[]
  onClose: () => void
  onSubmit: (payload: AgendamentoFormPayload) => void | Promise<void>
  onRequestDelete?: () => void
}

function minutosParaDuracaoLabel(minutos: number): string {
  if (!Number.isFinite(minutos) || minutos <= 0) return ''
  const horas = Math.floor(minutos / 60)
  const resto = minutos % 60
  if (horas && resto) return `${horas}h ${resto}min`
  if (horas) return `${horas} hora${horas === 1 ? '' : 's'}`
  return `${resto} min`
}

function parseMoedaInput(value: string): number {
  const normalized = value.replace(/\./g, '').replace(',', '.')
  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : 0
}

function dateStringToDayjs(value: string): Dayjs | null {
  if (!value) return null
  const parsed = dayjs(value)
  return parsed.isValid() ? parsed : null
}

function timeStringToDayjs(value: string): Dayjs | null {
  if (!value) return null
  const [hourRaw, minuteRaw] = value.split(':')
  const hour = Number(hourRaw)
  const minute = Number(minuteRaw)
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return null
  return dayjs().hour(hour).minute(minute).second(0).millisecond(0)
}

function dayjsToTimeString(value: Dayjs | null): string {
  if (!value?.isValid()) return ''
  return value.format('HH:mm')
}

function agendamentoToValues(agendamento?: Agendamento): AgendamentoFormValues {
  if (!agendamento) return EMPTY_VALUES
  return {
    servicoId: agendamento.servicoId,
    clienteId: agendamento.clienteId,
    colaboradorId: agendamento.colaboradorId,
    data: agendamento.data,
    horarioInicio: agendamento.horarioInicio,
    desconto: formatMoedaBrlFromNumber(agendamento.desconto),
  }
}

function validar(values: AgendamentoFormValues): string | null {
  if (!values.servicoId) return 'Selecione um serviço.'
  if (!values.clienteId) return 'Selecione um cliente.'
  if (!values.colaboradorId) return 'Selecione um prestador.'
  if (!values.data) return 'Informe a data.'
  if (!values.horarioInicio) return 'Informe o horário de início.'
  return null
}

function toPayload(values: AgendamentoFormValues): AgendamentoFormPayload {
  return {
    servicoId: values.servicoId,
    clienteId: values.clienteId,
    colaboradorId: values.colaboradorId,
    dataHora: `${values.data}T${values.horarioInicio}:00`,
    desconto: parseMoedaInput(values.desconto),
  }
}

export default function AgendamentoFormModal({
  open,
  mode,
  initial,
  clientes,
  colaboradores,
  servicos,
  onClose,
  onSubmit,
  onRequestDelete,
}: AgendamentoFormModalProps) {
  const [values, setValues] = useState<AgendamentoFormValues>(EMPTY_VALUES)
  const [erroLocal, setErroLocal] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  const isEdit = mode === 'edit'
  const isView = mode === 'view'

  const somenteLeitura = isView

  const titulo = isView
    ? 'Detalhes do agendamento'
    : isEdit
      ? 'Editar agendamento'
      : 'Novo agendamento'

  const subtitulo = isView
    ? 'Informações do atendimento realizado'
    : isEdit
      ? 'Modifique as informações do agendamento'
      : 'Cadastre um novo agendamento'

  const labelSubmit = isEdit ? 'Salvar' : 'Adicionar'

  const servicoSelecionado = useMemo(
    () => servicos.find((servico) => servico.id === values.servicoId),
    [servicos, values.servicoId],
  )

  useEffect(() => {
    if (!open) {
      queueMicrotask(() => {
        setValues(EMPTY_VALUES)
        setErroLocal(null)
        setEnviando(false)
      })
      return
    }

    queueMicrotask(() => {
      setValues(agendamentoToValues(initial))
      setErroLocal(null)
    })
  }, [open, initial])

  async function handleFormSubmit(e: FormEvent) {
    e.preventDefault()
    const erro = validar(values)
    if (erro) {
      setErroLocal(erro)
      return
    }

    setErroLocal(null)
    setEnviando(true)
    try {
      await Promise.resolve(onSubmit(toPayload(values)))
    } catch (err) {
      setErroLocal(
        err instanceof Error ? err.message : 'Não foi possível salvar o agendamento.',
      )
    } finally {
      setEnviando(false)
    }
  }

  function updateValue<K extends keyof AgendamentoFormValues>(
    key: K,
    value: AgendamentoFormValues[K],
  ) {
    setValues((current) => ({ ...current, [key]: value }))
  }

  return (
    <Dialog
      open={open}
      onClose={enviando ? undefined : onClose}
      maxWidth="sm"
      fullWidth
      scroll="body"
      slotProps={{
        backdrop: {
          sx: {
            backdropFilter: 'blur(8px)',
            bgcolor: 'rgba(15, 23, 42, 0.48)',
          },
        },
        paper: {
          sx: {
            borderRadius: '16px',
            overflow: 'hidden',
            boxShadow:
              '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0,0,0,0.03)',
          },
        },
      }}
    >
      <Box component="form" onSubmit={handleFormSubmit} sx={{ bgcolor: '#ffffff' }}>
        <Box sx={{ position: 'relative', px: { xs: 2.5, sm: 3 }, pt: 3, pb: 2 }}>
          <IconButton
            aria-label="Fechar"
            onClick={onClose}
            disabled={enviando}
            sx={{ position: 'absolute', top: 12, right: 12, color: '#64748b' }}
          >
            <CloseOutlined />
          </IconButton>

          <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', pr: 4 }}>
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                bgcolor: '#e0e7ff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <CalendarMonthOutlined sx={{ color: NAVY, fontSize: 24 }} />
            </Box>
            <Box sx={{ minWidth: 0, pt: 0.25 }}>
              <Typography
                variant="h6"
                component="h2"
                sx={{
                  fontWeight: 700,
                  color: NAVY,
                  fontSize: '1.125rem',
                  letterSpacing: '-0.02em',
                  lineHeight: 1.3,
                }}
              >
                {titulo}
              </Typography>
              <Typography
                variant="body2"
                sx={{ color: '#64748b', mt: 0.5, fontSize: '0.875rem' }}
              >
                {subtitulo}
              </Typography>
            </Box>
          </Box>
        </Box>

        <Box
          sx={{
            borderTop: `1px solid ${BORDER}`,
            borderBottom: `1px solid ${BORDER}`,
            px: { xs: 2.5, sm: 3 },
            py: 2.5,
          }}
        >
          {erroLocal ? (
            <Alert severity="error" sx={{ mb: 2 }}>
              {erroLocal}
            </Alert>
          ) : null}

          <TextField
            select
            fullWidth
            label="Nome do serviço"
            value={values.servicoId}
            onChange={(e) => updateValue('servicoId', e.target.value)}
            disabled={enviando || somenteLeitura}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <LocalOfferOutlined sx={{ color: '#94a3b8' }} />
                  </InputAdornment>
                ),
              },
            }}
            sx={{ mb: 2 }}
          >
            <MenuItem value="">Selecione um serviço</MenuItem>
            {servicos.map((servico) => (
              <MenuItem key={servico.id} value={servico.id}>
                {servico.nome}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            fullWidth
            label="Cliente"
            value={values.clienteId}
            onChange={(e) => updateValue('clienteId', e.target.value)}
            disabled={enviando || somenteLeitura}
            slotProps={{
              input: {
                readOnly: somenteLeitura,
                startAdornment: (
                  <InputAdornment position="start">
                    <PersonOutlineOutlined sx={{ color: '#94a3b8' }} />
                  </InputAdornment>
                ),
              },
            }}
            sx={{ mb: 2 }}
          >
            <MenuItem value="">Selecione um cliente</MenuItem>
            {clientes.map((cliente) => (
              <MenuItem key={cliente.id} value={cliente.id}>
                {cliente.nome}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            fullWidth
            label="Prestador"
            value={values.colaboradorId}
            onChange={(e) => updateValue('colaboradorId', e.target.value)}
            disabled={enviando || somenteLeitura}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <PersonOutlineOutlined sx={{ color: '#94a3b8' }} />
                  </InputAdornment>
                ),
              },
            }}
            sx={{ mb: 2 }}
          >
            <MenuItem value="">Selecione um prestador</MenuItem>
            {colaboradores.map((colaborador) => (
              <MenuItem key={colaborador.id} value={colaborador.id}>
                {colaborador.nome || colaborador.email}
              </MenuItem>
            ))}
          </TextField>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
              gap: 2,
              mb: 2,
            }}
          >
            <DatePicker
              label="Data"
              format="DD/MM/YYYY"
              openTo="day"
              views={['year', 'month', 'day']}
              value={dateStringToDayjs(values.data)}
              onChange={(newValue) => {
                updateValue(
                  'data',
                  newValue?.isValid() ? newValue.format('YYYY-MM-DD') : '',
                )
              }}
              disabled={enviando || somenteLeitura}
              slotProps={{
                popper: {
                  placement: 'bottom-start',
                  sx: { zIndex: (theme) => theme.zIndex.modal + 1 },
                },
                textField: {
                  fullWidth: true,
                  variant: 'outlined',
                  slotProps: {
                    htmlInput: { placeholder: 'dd/mm/aaaa' },
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <CalendarMonthOutlined sx={{ color: '#94a3b8' }} />
                        </InputAdornment>
                      ),
                    },
                  },
                },
              }}
            />
            <DesktopTimePicker
              label="Horário de início"
              format="HH:mm"
              ampm={false}
              views={['hours', 'minutes']}
              openTo="hours"
              timeSteps={{ hours: 1, minutes: 5 }}
              viewRenderers={{
                hours: renderMultiSectionDigitalClockTimeView,
                minutes: renderMultiSectionDigitalClockTimeView,
              }}
              value={timeStringToDayjs(values.horarioInicio)}
              onChange={(newValue) => {
                updateValue('horarioInicio', dayjsToTimeString(newValue))
              }}
              disabled={enviando || somenteLeitura}
              slotProps={{
                toolbar: { hidden: true },
                layout: {
                  sx: {
                    '& .MuiMultiSectionDigitalClock-root': {
                      maxHeight: 280,
                    },
                    '& .MuiMenuItem-root.Mui-selected': {
                      bgcolor: '#e0e7ff',
                      color: NAVY,
                      fontWeight: 700,
                      '&:hover': { bgcolor: '#c7d2fe' },
                    },
                  },
                },
                popper: {
                  placement: 'bottom-start',
                  sx: { zIndex: (theme) => theme.zIndex.modal + 1 },
                },
                textField: {
                  fullWidth: true,
                  variant: 'outlined',
                  slotProps: {
                    htmlInput: { placeholder: '--:--' },
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <AccessTimeOutlined sx={{ color: '#94a3b8' }} />
                        </InputAdornment>
                      ),
                    },
                  },
                },
              }}
            />
          </Box>

          <TextField
            fullWidth
            label="Duração"
            value={minutosParaDuracaoLabel(servicoSelecionado?.duracaoMinutos ?? 0)}
            disabled
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <AccessTimeOutlined sx={{ color: '#94a3b8' }} />
                  </InputAdornment>
                ),
              },
            }}
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            label="Valor"
            value={
              servicoSelecionado
                ? `R$ ${formatMoedaBrlFromNumber(servicoSelecionado.valor)}`
                : ''
            }
            disabled
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <AttachMoneyOutlined sx={{ color: '#94a3b8' }} />
                  </InputAdornment>
                ),
              },
            }}
          />
        </Box>

        <Box sx={{ px: { xs: 2.5, sm: 3 }, py: 2.25 }}>
          {isEdit && onRequestDelete ? (
            <Button
              type="button"
              fullWidth
              variant="contained"
              onClick={onRequestDelete}
              disabled={enviando || somenteLeitura}
              sx={{
                mb: 1.5,
                borderRadius: '10px',
                py: 1,
                fontWeight: 700,
                textTransform: 'none',
                bgcolor: '#dc2626',
                '&:hover': { bgcolor: '#b91c1c' },
              }}
            >
              Excluir
            </Button>
          ) : null}

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5 }}>
            <Button
              type="button"
              variant="outlined"
              onClick={onClose}
              disabled={enviando}
              sx={{
                borderRadius: '10px',
                px: 3,
                fontWeight: 600,
                textTransform: 'none',
                color: '#475569',
                borderColor: BORDER,
              }}
            >
              Cancelar
            </Button>
            {!isView && (
              <Button
                type="submit"
                variant="contained"
                disabled={enviando}
                sx={{
                  borderRadius: '10px',
                  px: 3.5,
                  fontWeight: 700,
                  textTransform: 'none',
                  bgcolor: NAVY,
                  '&:hover': { bgcolor: '#162d4a' },
                }}
              >
                {enviando ? 'Salvando...' : labelSubmit}
              </Button>
            )}
          </Box>
        </Box>
      </Box>
    </Dialog>
  )
}

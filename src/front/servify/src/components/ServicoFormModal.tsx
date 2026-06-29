import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import AccessTimeOutlined from '@mui/icons-material/AccessTimeOutlined'
import AttachMoneyOutlined from '@mui/icons-material/AttachMoneyOutlined'
import CloseOutlined from '@mui/icons-material/CloseOutlined'
import LocalOfferOutlined from '@mui/icons-material/LocalOfferOutlined'
import { DesktopTimePicker } from '@mui/x-date-pickers/DesktopTimePicker'
import { renderMultiSectionDigitalClockTimeView } from '@mui/x-date-pickers/timeViewRenderers'
import dayjs, { type Dayjs } from 'dayjs'
import type { ServicoFormPayload } from '../services/servicos'
import ConfirmarAcaoModal from './ConfirmarAcaoModal'
import { maskMoedaBrl, parseMoedaBrl } from '../utils/masks'
import {
  ICONE_PADRAO_SERVICO,
  SERVICO_ICONES,
  ServicoIcone,
  type ServicoIconeKey,
} from '../utils/servicoIcones'
import {
  mensagemInativarServico,
  mensagemReativarServico,
} from '../constants/ServicoMensagens'

const NAVY = '#1e3a5f'
const BORDER = '#e2e8f0'

export type ServicoFormValues = {
  nome: string
  valor: string
  duracaoMinutos: string
  icone: ServicoIconeKey
  ativo: boolean
}

const EMPTY_VALUES: ServicoFormValues = {
  nome: '',
  valor: '',
  duracaoMinutos: '30',
  icone: ICONE_PADRAO_SERVICO,
  ativo: true,
}

type ServicoFormModalProps = {
  open: boolean
  mode: 'create' | 'edit'
  initial?: ServicoFormValues
  onClose: () => void
  onSubmit: (payload: ServicoFormPayload) => void | Promise<void>
}

function minutosParaDayjs(minutos: number): Dayjs {
  const h = Math.floor(minutos / 60)
  const m = minutos % 60
  return dayjs().hour(h).minute(m).second(0).millisecond(0)
}

function dayjsParaMinutos(value: Dayjs | null): number {
  if (!value?.isValid()) return 0
  return value.hour() * 60 + value.minute()
}

function validar(values: ServicoFormValues): string | null {
  const nome = values.nome.trim()
  if (!nome) return 'Informe o nome do serviço.'

  const valor = parseMoedaBrl(values.valor)
  if (!Number.isFinite(valor) || valor <= 0) {
    return 'Informe um valor maior que zero.'
  }

  const duracao = Number(values.duracaoMinutos.trim())
  if (!Number.isFinite(duracao) || duracao <= 0 || !Number.isInteger(duracao)) {
    return 'Informe uma duração válida (hora e minuto).'
  }

  if (!values.icone) return 'Selecione um ícone.'

  return null
}

function toPayload(values: ServicoFormValues): ServicoFormPayload {
  return {
    nome: values.nome.trim(),
    valor: parseMoedaBrl(values.valor),
    duracaoMinutos: Number(values.duracaoMinutos.trim()),
    icone: values.icone,
    ativo: values.ativo,
  }
}

export default function ServicoFormModal({
  open,
  mode,
  initial,
  onClose,
  onSubmit,
}: ServicoFormModalProps) {
  const [values, setValues] = useState<ServicoFormValues>(EMPTY_VALUES)
  const [erroLocal, setErroLocal] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)
  const [confirmarInativarOpen, setConfirmarInativarOpen] = useState(false)
  const [confirmarReativarOpen, setConfirmarReativarOpen] = useState(false)

  const isEdit = mode === 'edit'
  const titulo = isEdit ? 'Editar Serviço' : 'Adicionar Serviço'
  const subtitulo = isEdit
    ? 'Modifique as informações do serviço'
    : 'Cadastre um novo serviço'
  const labelSubmit = isEdit ? 'Salvar' : 'Adicionar'

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
      setValues(initial ?? EMPTY_VALUES)
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
        err instanceof Error ? err.message : 'Não foi possível salvar o serviço.',
      )
    } finally {
      setEnviando(false)
    }
  }

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
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
              sx={{ position: 'absolute', top: 12, right: 12, color: '#64748b' }}
            >
              <CloseOutlined />
            </IconButton>

            <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', pr: 4 }}>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  bgcolor: '#e0e7ff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <LocalOfferOutlined sx={{ color: NAVY, fontSize: 26 }} />
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
              px: { xs: 2.5, sm: 3 },
              pb: 2.5,
              display: 'flex',
              flexDirection: 'column',
              gap: 2.25,
            }}
          >
            <Campo
              label="Nome do serviço"
              id="servico-nome"
              value={values.nome}
              onChange={(v) => setValues((s) => ({ ...s, nome: v }))}
              placeholder="Ex: Corte Masculino"
              startIcon={<LocalOfferOutlined sx={{ color: '#9ca3af', fontSize: 22 }} />}
            />

            <Campo
              label="Valor (R$)"
              id="servico-valor"
              value={values.valor}
              onChange={(v) => setValues((s) => ({ ...s, valor: maskMoedaBrl(v) }))}
              placeholder="0,00"
              inputMode="numeric"
              startIcon={<AttachMoneyOutlined sx={{ color: '#9ca3af', fontSize: 22 }} />}
            />

            <Box>
              <Typography
                component="label"
                htmlFor="servico-duracao"
                sx={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: '#475569',
                  mb: 0.75,
                }}
              >
                Duração
              </Typography>
              <DesktopTimePicker
                format="HH:mm"
                ampm={false}
                views={['hours', 'minutes']}
                openTo="hours"
                timeSteps={{ hours: 1, minutes: 5 }}
                viewRenderers={{
                  hours: renderMultiSectionDigitalClockTimeView,
                  minutes: renderMultiSectionDigitalClockTimeView,
                }}
                value={
                  values.duracaoMinutos
                    ? minutosParaDayjs(Number(values.duracaoMinutos))
                    : null
                }
                onChange={(newValue) => {
                  const minutos = dayjsParaMinutos(newValue)
                  setValues((s) => ({
                    ...s,
                    duracaoMinutos: minutos > 0 ? String(minutos) : '',
                  }))
                }}
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
                    id: 'servico-duracao',
                    name: 'duracaoMinutos',
                    fullWidth: true,
                    variant: 'outlined',
                    slotProps: {
                      htmlInput: { placeholder: '00:30' },
                      input: {
                        startAdornment: (
                          <InputAdornment position="start">
                            <AccessTimeOutlined sx={{ color: '#9ca3af', fontSize: 22 }} />
                          </InputAdornment>
                        ),
                      },
                    },
                    sx: {
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '10px',
                        '& fieldset': { borderColor: BORDER },
                      },
                    },
                  },
                }}
              />
            </Box>

            <Box>
              <Typography
                component="label"
                sx={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: '#475569',
                  mb: 0.75,
                }}
              >
                Ícone do serviço
              </Typography>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(7, 1fr)',
                  gap: 1,
                }}
              >
                {SERVICO_ICONES.map(({ key }) => {
                  const selected = values.icone === key
                  return (
                    <IconButton
                      key={key}
                      type="button"
                      aria-label={`Ícone ${key}`}
                      aria-pressed={selected}
                      onClick={() => setValues((s) => ({ ...s, icone: key }))}
                      sx={{
                        border: `2px solid ${selected ? '#2563eb' : BORDER}`,
                        borderRadius: '10px',
                        bgcolor: selected ? '#eff6ff' : '#ffffff',
                        width: '100%',
                        aspectRatio: '1',
                      }}
                    >
                      <ServicoIcone icone={key} />
                    </IconButton>
                  )
                })}
              </Box>
            </Box>

            <Box>
              <Typography
                component="label"
                sx={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: '#475569',
                  mb: 0.75,
                }}
              >
                Status
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
                <Button
                  type="button"
                  variant="outlined"
                  onClick={() => {
                    if (!values.ativo) {
                      setConfirmarReativarOpen(true)
                    }
                  }}
                  sx={{
                    py: 1.5,
                    borderRadius: '10px',
                    fontWeight: 700,
                    textTransform: 'none',
                    borderWidth: 2,
                    borderColor: values.ativo ? '#22c55e' : BORDER,
                    bgcolor: values.ativo ? '#f0fdf4' : '#ffffff',
                    color: values.ativo ? '#166534' : '#64748b',
                    '&:hover': {
                      borderColor: values.ativo ? '#22c55e' : '#cbd5e1',
                      bgcolor: values.ativo ? '#f0fdf4' : '#f8fafc',
                    },
                  }}
                >
                  Ativo
                </Button>
                <Button
                  type="button"
                  variant="outlined"
                  onClick={() => {
                    if (values.ativo) {
                      setConfirmarInativarOpen(true)
                    } else {
                      setValues((s) => ({ ...s, ativo: false }))
                    }
                  }}
                  sx={{
                    py: 1.5,
                    borderRadius: '10px',
                    fontWeight: 700,
                    textTransform: 'none',
                    borderWidth: 2,
                    borderColor: !values.ativo ? '#94a3b8' : BORDER,
                    bgcolor: !values.ativo ? '#f1f5f9' : '#ffffff',
                    color: !values.ativo ? '#475569' : '#64748b',
                    '&:hover': {
                      borderColor: !values.ativo ? '#94a3b8' : '#cbd5e1',
                      bgcolor: !values.ativo ? '#f1f5f9' : '#f8fafc',
                    },
                  }}
                >
                  Inativo
                </Button>
              </Box>
            </Box>
          </Box>

          <Box
            sx={{
              px: { xs: 2.5, sm: 3 },
              pb: 3,
              pt: 1,
              display: 'flex',
              flexDirection: 'column',
              gap: 1.5,
            }}
          >
            {erroLocal ? (
              <Alert severity="error" onClose={() => setErroLocal(null)}>
                {erroLocal}
              </Alert>
            ) : null}
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 2,
                flexWrap: 'wrap',
              }}
            >
              <Button
                type="button"
                variant="outlined"
                onClick={onClose}
                disabled={enviando}
                sx={{
                  borderRadius: '10px',
                  px: 2.5,
                  py: 1,
                  fontWeight: 600,
                  textTransform: 'none',
                  color: '#475569',
                  borderColor: BORDER,
                  '&:hover': { borderColor: '#cbd5e1' },
                }}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={enviando}
                sx={{
                  borderRadius: '10px',
                  px: 2.5,
                  py: 1,
                  fontWeight: 700,
                  textTransform: 'none',
                  bgcolor: NAVY,
                  '&:hover': { bgcolor: '#162d4a' },
                }}
              >
                {enviando ? 'Salvando…' : labelSubmit}
              </Button>
            </Box>
          </Box>
        </Box>
      </Dialog>

      <ConfirmarAcaoModal
        open={confirmarInativarOpen}
        titulo="Inativar serviço"
        mensagem={mensagemInativarServico(values.nome)}
        labelConfirmar="Inativar"
        corConfirmar="#f59e0b"
        corConfirmarHover="#d97706"
        onConfirm={() => {
          setValues((s) => ({ ...s, ativo: false }))
          setConfirmarInativarOpen(false)
        }}
        onClose={() => setConfirmarInativarOpen(false)}
      />

      <ConfirmarAcaoModal
        open={confirmarReativarOpen}
        titulo="Reativar serviço"
        mensagem={mensagemReativarServico(values.nome)}
        labelConfirmar="Reativar"
        corConfirmar="#22c55e"
        corConfirmarHover="#16a34a"
        onConfirm={() => {
          setValues((s) => ({ ...s, ativo: true }))
          setConfirmarReativarOpen(false)
        }}
        onClose={() => setConfirmarReativarOpen(false)}
      />
    </>
  )
}

function Campo({
  label,
  id,
  value,
  onChange,
  placeholder,
  inputMode,
  startIcon,
}: {
  label: string
  id: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  inputMode?: 'decimal' | 'numeric' | 'text'
  startIcon: ReactNode
}) {
  return (
    <Box>
      <Typography
        component="label"
        htmlFor={id}
        sx={{
          display: 'block',
          fontSize: '0.875rem',
          fontWeight: 600,
          color: '#475569',
          mb: 0.75,
        }}
      >
        {label}
      </Typography>
      <TextField
        id={id}
        name={id}
        fullWidth
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        inputMode={inputMode}
        variant="outlined"
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">{startIcon}</InputAdornment>
            ),
          },
        }}
        sx={{
          '& .MuiOutlinedInput-root': {
            borderRadius: '10px',
            '& fieldset': { borderColor: BORDER },
          },
        }}
      />
    </Box>
  )
}

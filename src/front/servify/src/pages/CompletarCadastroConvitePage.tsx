import { useCallback, useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { Link as RouterLink, useBlocker, useNavigate, useParams } from 'react-router-dom'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Grid from '@mui/material/Grid'
import InputAdornment from '@mui/material/InputAdornment'
import MenuItem from '@mui/material/MenuItem'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import PersonOutlined from '@mui/icons-material/PersonOutlined'
import EmailOutlined from '@mui/icons-material/EmailOutlined'
import PhoneOutlined from '@mui/icons-material/PhoneOutlined'
import CalendarMonthOutlined from '@mui/icons-material/CalendarMonthOutlined'
import BadgeOutlined from '@mui/icons-material/BadgeOutlined'
import LocationOnOutlined from '@mui/icons-material/LocationOnOutlined'
import HomeOutlined from '@mui/icons-material/HomeOutlined'
import TagOutlined from '@mui/icons-material/TagOutlined'
import ApartmentOutlined from '@mui/icons-material/ApartmentOutlined'
import MapOutlined from '@mui/icons-material/MapOutlined'
import LocationCityOutlined from '@mui/icons-material/LocationCityOutlined'
import PublicOutlined from '@mui/icons-material/PublicOutlined'
import LockOutlined from '@mui/icons-material/LockOutlined'
import VpnKeyOutlined from '@mui/icons-material/VpnKeyOutlined'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import dayjs from 'dayjs'
import { setSession } from '../auth/session'
import { toastCadastroErro, toastCadastroSucesso } from '../components/showAlert'
import { mensagemDeErroCapturado } from '../services/api'
import { loginApi } from '../services/auth'
import {
  completarCadastroConvite,
  getConvitePorToken,
  type ConviteValidado,
} from '../services/convites'
import { cepDigits, fetchAddressByCep, formatCepDisplay } from '../services/viacep'
import { maskCpf, maskPhoneBr } from '../utils/masks'
import './styles/RegisterPage.css'

const UFS = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR',
  'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
] as const

type FormState = {
  nome: string
  email: string
  senhaProvisoria: string
  telefone: string
  dataNascimento: string
  cpf: string
  cep: string
  logradouro: string
  numero: string
  complemento: string
  bairro: string
  cidade: string
  uf: string
  senha: string
  confirmarSenha: string
}

const emptyForm = (): FormState => ({
  nome: '',
  email: '',
  senhaProvisoria: '',
  telefone: '',
  dataNascimento: '',
  cpf: '',
  cep: '',
  logradouro: '',
  numero: '',
  complemento: '',
  bairro: '',
  cidade: '',
  uf: '',
  senha: '',
  confirmarSenha: '',
})

export default function CompletarCadastroConvitePage() {
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()
  const [phase, setPhase] = useState<'loading' | 'invalid' | 'ready' | 'submitting'>('loading')
  const [convite, setConvite] = useState<ConviteValidado | null>(null)
  const [loadMessage, setLoadMessage] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm())
  const [cepLoading, setCepLoading] = useState(false)
  const [cepHelperText, setCepHelperText] = useState<string | null>(null)
  const cepAbortRef = useRef<AbortController | null>(null)
  const completoRef = useRef(false)
  const blockNavRef = useRef(false)

  const updateBlockNav = useCallback(() => {
    blockNavRef.current =
      (phase === 'ready' || phase === 'submitting') && !completoRef.current
  }, [phase])

  useEffect(() => {
    updateBlockNav()
  }, [updateBlockNav])

  const blocker = useBlocker(({ currentLocation, nextLocation }) => {
    if (!blockNavRef.current) return false
    return currentLocation.pathname !== nextLocation.pathname
  })

  useEffect(() => {
    if (completoRef.current) return
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (blockNavRef.current) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [])

  useEffect(() => {
    if (!token?.trim()) {
      setPhase('invalid')
      setLoadMessage('Link de convite inválido.')
      return
    }

    let cancelled = false
    void (async () => {
      try {
        const c = await getConvitePorToken(token)
        if (cancelled) return
        setConvite(c)
        setForm(() => ({
          ...emptyForm(),
          email: (c.email ?? '').trim(),
        }))
        setPhase('ready')
      } catch (e: unknown) {
        if (cancelled) return
        const msg = e instanceof Error ? e.message : 'Convite inválido ou expirado.'
        setLoadMessage(msg)
        setPhase('invalid')
      }
    })()

    return () => {
      cancelled = true
    }
  }, [token])

  function setField<K extends keyof FormState>(key: K) {
    return (ev: React.ChangeEvent<HTMLInputElement>) => {
      setForm((s) => ({ ...s, [key]: ev.target.value }))
    }
  }

  function handleTelefoneChange(ev: React.ChangeEvent<HTMLInputElement>) {
    setForm((s) => ({ ...s, telefone: maskPhoneBr(ev.target.value) }))
  }

  function handleCpfChange(ev: React.ChangeEvent<HTMLInputElement>) {
    setForm((s) => ({ ...s, cpf: maskCpf(ev.target.value) }))
  }

  function handleCepChange(ev: React.ChangeEvent<HTMLInputElement>) {
    const digits = cepDigits(ev.target.value)
    const display = formatCepDisplay(digits)
    setForm((s) => ({ ...s, cep: display }))
    setCepHelperText(null)
    cepAbortRef.current?.abort()
    if (digits.length !== 8) {
      setCepLoading(false)
      cepAbortRef.current = null
      return
    }
    const controller = new AbortController()
    cepAbortRef.current = controller
    setCepLoading(true)
    void (async () => {
      try {
        const addr = await fetchAddressByCep(digits, controller.signal)
        if (cepAbortRef.current !== controller) return
        if (!addr) {
          setCepHelperText('CEP não encontrado.')
          return
        }
        setForm((s) => ({
          ...s,
          cep: display,
          logradouro: addr.logradouro,
          bairro: addr.bairro,
          cidade: addr.cidade,
          uf: addr.uf,
        }))
      } catch (e: unknown) {
        if (cepAbortRef.current !== controller) return
        if (e instanceof DOMException && e.name === 'AbortError') return
        setCepHelperText('Não foi possível buscar o CEP. Tente novamente.')
      } finally {
        if (cepAbortRef.current === controller) setCepLoading(false)
      }
    })()
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!token?.trim() || !convite?.email) return

    const nome = form.nome.trim()
    const email = form.email.trim()
    const cpfDigits = form.cpf.replace(/\D/g, '')

    if (!nome) {
      toastCadastroErro('Informe o nome completo.')
      return
    }
    if (!email || email.toLowerCase() !== convite.email!.trim().toLowerCase()) {
      toastCadastroErro('O e-mail deve ser o mesmo do convite.')
      return
    }
    if (cpfDigits.length !== 11) {
      toastCadastroErro('CPF deve ter 11 dígitos.')
      return
    }
    if (convite.exigeSenhaProvisoria && !form.senhaProvisoria.trim()) {
      toastCadastroErro('Informe a senha provisória enviada por e-mail.')
      return
    }
    if (!form.senha || form.senha.length < 6) {
      toastCadastroErro('A senha deve ter pelo menos 6 caracteres.')
      return
    }
    if (form.senha !== form.confirmarSenha) {
      toastCadastroErro('Senha e confirmação não conferem.')
      return
    }

    const payload: Parameters<typeof completarCadastroConvite>[1] = {
      email,
      cpf: cpfDigits,
      nome,
      senha: form.senha,
      telefone: form.telefone.replace(/\D/g, ''),
      dataNascimento: form.dataNascimento,
      cep: form.cep.replace(/\D/g, ''),
      logradouro: form.logradouro,
      numero: form.numero,
      complemento: form.complemento,
      bairro: form.bairro,
      cidade: form.cidade,
      uf: form.uf,
    }
    if (convite.exigeSenhaProvisoria) {
      payload.senhaProvisoria = form.senhaProvisoria.trim()
    }

    try {
      setPhase('submitting')
      await completarCadastroConvite(token, payload)
      toastCadastroSucesso('Cadastro concluído com sucesso!')
      const sessionUser = await loginApi(email, form.senha)
      completoRef.current = true
      blockNavRef.current = false
      setSession({ user: sessionUser })
      navigate('/agendamentos', { replace: true })
    } catch (err: unknown) {
      setPhase('ready')
      toastCadastroErro(
        mensagemDeErroCapturado(
          err,
          'Não foi possível concluir o cadastro. Tente novamente.',
        ),
      )
    }
  }

  if (phase === 'loading') {
    return (
      <Box className="register-page">
        <Card className="register-card" elevation={0} variant="outlined" sx={{ textAlign: 'center', py: 6 }}>
          <CircularProgress />
          <Typography sx={{ mt: 2 }} color="text.secondary">
            Validando convite…
          </Typography>
        </Card>
      </Box>
    )
  }

  if (phase === 'invalid') {
    return (
      <Box className="register-page">
        <Card className="register-card" elevation={0} variant="outlined" sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Convite indisponível
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 2 }}>
            {loadMessage ?? 'Não foi possível usar este link.'}
          </Typography>
          <Button component={RouterLink} to="/login" variant="contained">
            Ir para o login
          </Button>
        </Card>
      </Box>
    )
  }

  return (
    <Box className="register-page">
      <Dialog open={blocker.state === 'blocked'} onClose={() => blocker.reset?.()}>
        <DialogTitle>Conclua o cadastro</DialogTitle>
        <DialogContent>
          Para sair desta tela é preciso finalizar o cadastro do convite. O convite será liberado após o envio
          bem-sucedido.
        </DialogContent>
        <DialogActions>
          <Button onClick={() => blocker.reset?.()} variant="contained">
            Continuar preenchendo
          </Button>
        </DialogActions>
      </Dialog>

      <Card className="register-card" elevation={0} variant="outlined">
        <Typography className="register-title" variant="h5" component="h1" align="center" color="text.primary">
          Completar cadastro
        </Typography>
        <Typography className="register-subtitle" variant="body2" component="p" align="center" color="text.secondary">
          Preencha seus dados para ativar sua conta no Servify
        </Typography>

        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: 1,
            mt: 2,
            mb: 1,
          }}
        >
          <Chip size="small" label={`Perfil: ${convite?.perfilNome ?? '—'}`} color="primary" variant="outlined" />
        </Box>

        <Typography variant="caption" align="center" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
          Este convite é válido apenas para o e-mail abaixo. Não é possível sair desta etapa até concluir o cadastro.
        </Typography>

        <Box component="form" onSubmit={handleSubmit} noValidate>
          <Grid container spacing={2}>
            <Grid size={12}>
              <Box className="register-field">
                <Typography className="register-label" variant="body2" component="label" htmlFor="conv-nome">
                  Nome completo
                </Typography>
                <TextField
                  id="conv-nome"
                  name="nome"
                  className="register-input"
                  fullWidth
                  hiddenLabel
                  variant="outlined"
                  autoComplete="name"
                  placeholder="Seu nome completo"
                  value={form.nome}
                  onChange={setField('nome')}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <PersonOutlined fontSize="small" />
                        </InputAdornment>
                      ),
                    },
                  }}
                />
              </Box>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Box className="register-field">
                <Typography className="register-label" variant="body2" component="label" htmlFor="conv-email">
                  E-mail (do convite)
                </Typography>
                <TextField
                  id="conv-email"
                  name="email"
                  className="register-input"
                  fullWidth
                  hiddenLabel
                  variant="outlined"
                  type="email"
                  autoComplete="email"
                  value={form.email}
                  disabled
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <EmailOutlined fontSize="small" />
                        </InputAdornment>
                      ),
                    },
                  }}
                />
              </Box>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Box className="register-field">
                <Typography className="register-label" variant="body2" component="label" htmlFor="conv-tel">
                  Telefone
                </Typography>
                <TextField
                  id="conv-tel"
                  name="telefone"
                  className="register-input"
                  fullWidth
                  hiddenLabel
                  variant="outlined"
                  autoComplete="tel"
                  placeholder="(00) 00000-0000"
                  value={form.telefone}
                  onChange={handleTelefoneChange}
                  slotProps={{
                    htmlInput: { maxLength: 15, inputMode: 'tel' },
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <PhoneOutlined fontSize="small" />
                        </InputAdornment>
                      ),
                    },
                  }}
                />
              </Box>
            </Grid>

            {convite?.exigeSenhaProvisoria ? (
              <Grid size={12}>
                <Box className="register-field">
                  <Typography className="register-label" variant="body2" component="label" htmlFor="conv-prov">
                    Senha provisória (e-mail)
                  </Typography>
                  <TextField
                    id="conv-prov"
                    name="senhaProvisoria"
                    className="register-input"
                    fullWidth
                    hiddenLabel
                    variant="outlined"
                    type="password"
                    autoComplete="off"
                    placeholder="Digite a senha provisória do convite"
                    value={form.senhaProvisoria}
                    onChange={setField('senhaProvisoria')}
                    slotProps={{
                      input: {
                        startAdornment: (
                          <InputAdornment position="start">
                            <VpnKeyOutlined fontSize="small" />
                          </InputAdornment>
                        ),
                      },
                    }}
                  />
                </Box>
              </Grid>
            ) : null}

            <Grid size={{ xs: 12, sm: 6 }}>
              <Box className="register-field">
                <Typography className="register-label" variant="body2" component="label" htmlFor="conv-nasc">
                  Data de nascimento
                </Typography>
                <DatePicker
                  format="DD/MM/YYYY"
                  openTo="day"
                  views={['year', 'month', 'day']}
                  value={form.dataNascimento ? dayjs(form.dataNascimento) : null}
                  onChange={(newValue) => {
                    setForm((s) => ({
                      ...s,
                      dataNascimento:
                        newValue && dayjs(newValue).isValid() ? dayjs(newValue).format('YYYY-MM-DD') : '',
                    }))
                  }}
                  maxDate={dayjs()}
                  minDate={dayjs().subtract(120, 'year')}
                  slotProps={{
                    textField: {
                      id: 'conv-nasc',
                      name: 'dataNascimento',
                      fullWidth: true,
                      size: 'small',
                      variant: 'outlined',
                      hiddenLabel: true,
                      className: 'register-input',
                      slotProps: {
                        htmlInput: { placeholder: 'DD/MM/AAAA' },
                        input: {
                          startAdornment: (
                            <InputAdornment position="start">
                              <CalendarMonthOutlined fontSize="small" />
                            </InputAdornment>
                          ),
                        },
                      },
                    },
                  }}
                />
              </Box>
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <Box className="register-field">
                <Typography className="register-label" variant="body2" component="label" htmlFor="conv-cpf">
                  CPF
                </Typography>
                <TextField
                  id="conv-cpf"
                  name="cpf"
                  className="register-input"
                  fullWidth
                  hiddenLabel
                  variant="outlined"
                  placeholder="000.000.000-00"
                  value={form.cpf}
                  onChange={handleCpfChange}
                  slotProps={{
                    htmlInput: { maxLength: 14, inputMode: 'numeric' },
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <BadgeOutlined fontSize="small" />
                        </InputAdornment>
                      ),
                    },
                  }}
                />
              </Box>
            </Grid>
          </Grid>

          <br />
          <Typography className="register-section-title" component="h2" variant="subtitle2">
            Endereço
          </Typography>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 4, md: 3 }}>
              <Box className="register-field">
                <Typography className="register-label" variant="body2" component="label" htmlFor="conv-cep">
                  CEP
                </Typography>
                <TextField
                  id="conv-cep"
                  name="cep"
                  className="register-input"
                  fullWidth
                  hiddenLabel
                  variant="outlined"
                  placeholder="00000-000"
                  value={form.cep}
                  onChange={handleCepChange}
                  disabled={cepLoading}
                  error={Boolean(cepHelperText)}
                  helperText={cepHelperText || undefined}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <LocationOnOutlined fontSize="small" />
                        </InputAdornment>
                      ),
                      endAdornment: cepLoading ? (
                        <InputAdornment position="end">
                          <CircularProgress color="inherit" size={18} />
                        </InputAdornment>
                      ) : undefined,
                    },
                  }}
                />
              </Box>
            </Grid>
            <Grid size={{ xs: 12, sm: 8, md: 9 }}>
              <Box className="register-field">
                <Typography className="register-label" variant="body2" component="label" htmlFor="conv-log">
                  Logradouro
                </Typography>
                <TextField
                  id="conv-log"
                  name="logradouro"
                  className="register-input"
                  fullWidth
                  hiddenLabel
                  variant="outlined"
                  placeholder="Rua, Avenida..."
                  value={form.logradouro}
                  onChange={setField('logradouro')}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <HomeOutlined fontSize="small" />
                        </InputAdornment>
                      ),
                    },
                  }}
                />
              </Box>
            </Grid>
            <Grid size={{ xs: 12, sm: 4, md: 3 }}>
              <Box className="register-field">
                <Typography className="register-label" variant="body2" component="label" htmlFor="conv-num">
                  Número
                </Typography>
                <TextField
                  id="conv-num"
                  name="numero"
                  className="register-input"
                  fullWidth
                  hiddenLabel
                  variant="outlined"
                  placeholder="Nº"
                  value={form.numero}
                  onChange={setField('numero')}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <TagOutlined fontSize="small" />
                        </InputAdornment>
                      ),
                    },
                  }}
                />
              </Box>
            </Grid>
            <Grid size={{ xs: 12, sm: 4, md: 5 }}>
              <Box className="register-field">
                <Typography className="register-label" variant="body2" component="label" htmlFor="conv-comp">
                  Complemento
                </Typography>
                <TextField
                  id="conv-comp"
                  name="complemento"
                  className="register-input"
                  fullWidth
                  hiddenLabel
                  variant="outlined"
                  placeholder="Apto, Bloco..."
                  value={form.complemento}
                  onChange={setField('complemento')}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <ApartmentOutlined fontSize="small" />
                        </InputAdornment>
                      ),
                    },
                  }}
                />
              </Box>
            </Grid>
            <Grid size={{ xs: 12, sm: 4, md: 4 }}>
              <Box className="register-field">
                <Typography className="register-label" variant="body2" component="label" htmlFor="conv-bairro">
                  Bairro
                </Typography>
                <TextField
                  id="conv-bairro"
                  name="bairro"
                  className="register-input"
                  fullWidth
                  hiddenLabel
                  variant="outlined"
                  value={form.bairro}
                  onChange={setField('bairro')}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <MapOutlined fontSize="small" />
                        </InputAdornment>
                      ),
                    },
                  }}
                />
              </Box>
            </Grid>
            <Grid size={{ xs: 12, sm: 8, md: 7 }}>
              <Box className="register-field">
                <Typography className="register-label" variant="body2" component="label" htmlFor="conv-cidade">
                  Cidade
                </Typography>
                <TextField
                  id="conv-cidade"
                  name="cidade"
                  className="register-input"
                  fullWidth
                  hiddenLabel
                  variant="outlined"
                  value={form.cidade}
                  onChange={setField('cidade')}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <LocationCityOutlined fontSize="small" />
                        </InputAdornment>
                      ),
                    },
                  }}
                />
              </Box>
            </Grid>
            <Grid size={{ xs: 12, sm: 4, md: 5 }}>
              <Box className="register-field">
                <Typography className="register-label" variant="body2" component="label" htmlFor="conv-uf">
                  UF
                </Typography>
                <TextField
                  id="conv-uf"
                  name="uf"
                  className="register-input"
                  select
                  fullWidth
                  hiddenLabel
                  variant="outlined"
                  value={form.uf}
                  onChange={(e) => setForm((s) => ({ ...s, uf: e.target.value }))}
                  slotProps={{
                    select: { displayEmpty: true },
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <PublicOutlined fontSize="small" />
                        </InputAdornment>
                      ),
                    },
                  }}
                >
                  <MenuItem value="">
                    <em>Selecione</em>
                  </MenuItem>
                  {UFS.map((uf) => (
                    <MenuItem key={uf} value={uf}>
                      {uf}
                    </MenuItem>
                  ))}
                </TextField>
              </Box>
            </Grid>
          </Grid>

          <br />
          <Typography className="register-section-title" component="h2" variant="subtitle2">
            Senha de acesso
          </Typography>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Box className="register-field">
                <Typography className="register-label" variant="body2" component="label" htmlFor="conv-senha">
                  Nova senha
                </Typography>
                <TextField
                  id="conv-senha"
                  name="senha"
                  className="register-input"
                  fullWidth
                  hiddenLabel
                  variant="outlined"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Mínimo 6 caracteres"
                  value={form.senha}
                  onChange={setField('senha')}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <LockOutlined fontSize="small" />
                        </InputAdornment>
                      ),
                    },
                  }}
                />
              </Box>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Box className="register-field">
                <Typography className="register-label" variant="body2" component="label" htmlFor="conv-conf">
                  Confirmar senha
                </Typography>
                <TextField
                  id="conv-conf"
                  name="confirmarSenha"
                  className="register-input"
                  fullWidth
                  hiddenLabel
                  variant="outlined"
                  type="password"
                  autoComplete="new-password"
                  value={form.confirmarSenha}
                  onChange={setField('confirmarSenha')}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <LockOutlined fontSize="small" />
                        </InputAdornment>
                      ),
                    },
                  }}
                />
              </Box>
            </Grid>
          </Grid>

          <Button
            type="submit"
            color="primary"
            variant="contained"
            fullWidth
            className="register-submit"
            disabled={phase === 'submitting'}
          >
            {phase === 'submitting' ? 'Enviando…' : 'Concluir cadastro'}
          </Button>
        </Box>

        <Typography className="register-footer" variant="body2" component="p" align="center" color="text.secondary">
          <Box component="span" className="register-footer__muted">
            Dúvidas? Entre em contato com quem enviou o convite. O login ficará disponível após concluir o cadastro.
          </Box>
        </Typography>
      </Card>
    </Box>
  )
}

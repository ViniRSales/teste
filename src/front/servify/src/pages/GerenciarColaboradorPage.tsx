import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ColaboradorFormModal from '../components/ColaboradorFormModal'
import EditarPessoaModal from '../components/EditarPessoaModal'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Container from '@mui/material/Container'
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import Add from '@mui/icons-material/Add'
import ViewSidebarOutlined from '@mui/icons-material/ViewSidebarOutlined'
import DeleteOutlineOutlined from '@mui/icons-material/DeleteOutlineOutlined'
import EditOutlined from '@mui/icons-material/EditOutlined'
import EventAvailableOutlined from '@mui/icons-material/EventAvailableOutlined'
import GroupsOutlined from '@mui/icons-material/GroupsOutlined'
import Search from '@mui/icons-material/Search'
import { useSidebarLayout } from '../context/SidebarLayoutContext'
import {
  confirmDeleteRecord,
  toastCadastroSucesso,
  toastSuccess,
  toastError,
} from '../components/showAlert'
import type { EditarPessoaValues } from '../types/editarPessoa'
import { labelPerfilColaborador, perfilIdParaConvite } from '../utils/perfilColaborador'
import {
  deleteUsuarioPorId,
  getColaboradores,
  type Colaborador,
} from '../services/colaboradores'
import { criarConvite } from '../services/convites'
import {
  fetchGmailOAuthStatus,
  getGmailAuthorizeUrl,
  type GmailOAuthStatus,
} from '../services/gmailOAuth'

const NAVY = '#1e3a5f'
const BORDER = '#e2e8f0'
const PAGE_BG = '#f8fafc'

function rowToEditValues(row: Colaborador): EditarPessoaValues {
  return {
    nome: row.nome ?? '',
    email: row.email,
    telefone: row.telefone,
    cpf: row.cpf,
    dataNascimento: row.dataNascimento,
    cidade: row.cidade,
    cargo: row.cargo,
    ativo: row.status === 'ativo',
    cep: row.cep,
    logradouro: row.logradouro,
    numero: row.numero,
    complemento: row.complemento,
    bairro: row.bairro,
    uf: row.uf,
  }
}

export default function GerenciarColaboradorPage() {
  const { sidebarExpanded, toggleSidebar } = useSidebarLayout()
  const navigate = useNavigate()
  const [busca, setBusca] = useState('')
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([])
  const [loading, setLoading] = useState(true)

  const [conviteOpen, setConviteOpen] = useState(false)
  const [formEmail, setFormEmail] = useState('')
  const [formCargo, setFormCargo] = useState('')

  const [editOpen, setEditOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [gmailOAuthStatus, setGmailOAuthStatus] = useState<
    GmailOAuthStatus | null | undefined
  >(undefined)
  const [editInitial, setEditInitial] = useState<EditarPessoaValues>({
    nome: '',
    email: '',
    telefone: '',
    cpf: '',
    dataNascimento: '',
    cidade: '',
    cargo: '',
    ativo: true,
    cep: '',
    logradouro: '',
    numero: '',
    complemento: '',
    bairro: '',
    uf: '',
  })

  useEffect(() => {
    let alive = true
    void (async () => {
      try {
        const data = await getColaboradores()
        if (!alive) return
        setColaboradores(data)
      } catch (e: unknown) {
        if (!alive) return
        toastError(
          e instanceof Error
            ? e.message
            : 'Não foi possível carregar os colaboradores.',
        )
      } finally {
        queueMicrotask(() => {
          if (alive) setLoading(false)
        })
      }
    })()
    return () => {
      alive = false
    }
  }, [])

  useEffect(() => {
    let alive = true
    void (async () => {
      try {
        const s = await fetchGmailOAuthStatus()
        if (!alive) return
        setGmailOAuthStatus(s)
      } catch {
        if (!alive) return
        setGmailOAuthStatus(null)
      }
    })()
    return () => {
      alive = false
    }
  }, [])

  async function iniciarOAuthGmail() {
    try {
      const url = await getGmailAuthorizeUrl()
      window.location.href = url
    } catch (e: unknown) {
      toastError(
        e instanceof Error
          ? e.message
          : 'Não foi possível iniciar o login com Google.',
      )
    }
  }

  function abrirConvidar() {
    setFormEmail('')
    setFormCargo('')
    setConviteOpen(true)
  }

  function abrirEditar(row: Colaborador) {
    setEditingId(row.id)
    setEditInitial(rowToEditValues(row))
    setEditOpen(true)
  }

  function fecharConvite() {
    setConviteOpen(false)
  }

  function fecharEditar() {
    setEditOpen(false)
    setEditingId(null)
  }

  async function handleSubmitConvite() {
    const email = formEmail.trim()
    const cargo = formCargo.trim()
    const perfilId = perfilIdParaConvite(cargo)
    if (perfilId == null) {
      throw new Error('Selecione um perfil válido.')
    }

    await criarConvite({ email, perfilId })
    const data = await getColaboradores()
    setColaboradores(data)
    fecharConvite()
    toastCadastroSucesso(
      'Convite salvo com token. E-mail com token e senha provisória é enviado quando o servidor Gmail estiver configurado. Caso não receba o e-mail, verifique se o servidor Gmail está configurado e se o e-mail está na lista de permitidos.',
    )
  }

  function handleSalvarEdicao(data: EditarPessoaValues) {
    if (!editingId) return
    setColaboradores((prev) =>
      prev.map((c) =>
        c.id === editingId
          ? {
              ...c,
              nome: data.nome || null,
              email: data.email,
              telefone: data.telefone,
              cpf: data.cpf,
              dataNascimento: data.dataNascimento,
              cidade: data.cidade,
              cargo: data.cargo,
              status: data.ativo ? 'ativo' : 'pendente',
              cep: data.cep,
              logradouro: data.logradouro,
              numero: data.numero,
              complemento: data.complemento,
              bairro: data.bairro,
              uf: data.uf,
            }
          : c,
      ),
    )
    fecharEditar()
    toastCadastroSucesso('Dados do colaborador atualizados.')
  }

  async function solicitarRemocao(row: Colaborador) {
    const subtitulo = row.nome
      ? `${row.nome} (${row.email}) será removido da lista.`
      : `O convite para ${row.email} será removido.`
    const ok = await confirmDeleteRecord('Remover colaborador?', subtitulo)
    if (!ok) return
    try {
      await deleteUsuarioPorId(row.id)
      if (editingId === row.id) fecharEditar()
      const data = await getColaboradores()
      setColaboradores(data)
      toastSuccess('Colaborador removido.')
    } catch (e: unknown) {
      toastError(
        e instanceof Error
          ? e.message
          : 'Não foi possível remover o colaborador.',
      )
    }
  }

  const filtrados = useMemo(() => {
    const q = busca.trim().toLowerCase()
    if (!q) return colaboradores
    return colaboradores.filter((c) => {
      const nome = (c.nome ?? '').toLowerCase()
      return (
        nome.includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.cargo.toLowerCase().includes(q) ||
        c.cidade.toLowerCase().includes(q)
      )
    })
  }, [busca, colaboradores])

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
            minWidth: 0,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
            <GroupsOutlined sx={{ fontSize: 28, color: NAVY }} />
            <Typography
              variant="h6"
              component="h1"
              sx={{
                fontWeight: 700,
                color: NAVY,
                fontSize: { xs: '1.1rem', sm: '1.25rem' },
                letterSpacing: '-0.02em',
              }}
            >
              Gerenciar Colaboradores
            </Typography>
          </Box>
          <Button
            variant="contained"
            color="primary"
            startIcon={<Add />}
            onClick={abrirConvidar}
            sx={{
              borderRadius: '10px',
              px: 2.5,
              py: 1,
              fontWeight: 700,
              textTransform: 'none',
            }}
          >
            Convidar
          </Button>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3 }, py: 3 }}>
        {gmailOAuthStatus != null ? (
          <Box sx={{ mb: 2.5 }}>
            {gmailOAuthStatus.connected ? (
              <Alert severity="success" sx={{ borderRadius: '12px' }}>
                Gmail autorizado: convites podem ser enviados por e-mail a partir deste servidor.
              </Alert>
            ) : gmailOAuthStatus.browserFlowConfigured ? (
              <Alert
                severity="warning"
                sx={{ borderRadius: '12px', alignItems: 'center' }}
                action={
                  <Button
                    color="inherit"
                    size="small"
                    variant="outlined"
                    onClick={() => void iniciarOAuthGmail()}
                    sx={{ fontWeight: 700, textTransform: 'none', borderColor: 'rgba(0,0,0,0.25)' }}
                  >
                    Conectar Gmail
                  </Button>
                }
              >
                Conceda permissão de envio no Google para que os convites cheguem por e-mail.
              </Alert>
            ) : (
              <Alert severity="info" sx={{ borderRadius: '12px' }}>
                Para login OAuth no navegador, defina no backend{' '}
                <strong>servify.gmail.oauth-redirect-uri</strong> igual à rota deste app (ex.:{' '}
                <strong>http://localhost:5173/oauth/google/callback</strong>) e cadastre a mesma
                URI nas credenciais OAuth do tipo <strong>aplicativo Web</strong> no Google Cloud.
              </Alert>
            )}
          </Box>
        ) : null}

        <TextField
          fullWidth
          placeholder="Buscar colaboradores..."
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
            maxWidth: 480,
            mb: 2.5,
            '& .MuiOutlinedInput-root': {
              bgcolor: '#ffffff',
              borderRadius: '10px',
              '& fieldset': { borderColor: BORDER },
            },
          }}
        />

        <TableContainer
          sx={{
            border: `1px solid ${BORDER}`,
            borderRadius: '12px',
            bgcolor: '#ffffff',
            overflow: 'hidden',
          }}
        >
          <Table size="medium" sx={{ tableLayout: 'fixed' }}>
            <TableHead>
              <TableRow
                sx={{
                  bgcolor: '#f1f5f9',
                  '& th': {
                    borderBottom: `1px solid ${BORDER}`,
                    color: '#334155',
                    fontWeight: 700,
                    fontSize: '0.875rem',
                    py: 2,
                    px: 2.5,
                  },
                }}
              >
                <TableCell width="26%">Nome</TableCell>
                <TableCell width="34%">Email</TableCell>
                <TableCell width="22%">Perfil</TableCell>
                <TableCell width="18%" align="right">
                  Ações
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtrados.map((row, index) => (
                <TableRow
                  key={row.id}
                  sx={{
                    '&:last-child td': { borderBottom: 0 },
                    '& td': {
                      borderBottom:
                        index < filtrados.length - 1
                          ? `1px solid ${BORDER}`
                          : 'none',
                      py: 2,
                      px: 2.5,
                      verticalAlign: 'middle',
                    },
                  }}
                >
                  <TableCell>
                    <Typography
                      sx={{
                        fontWeight: 700,
                        color: row.nome ? NAVY : '#94a3b8',
                      }}
                    >
                      {row.nome ?? '—'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography sx={{ color: '#64748b', fontSize: '0.9375rem' }}>
                      {row.email}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography sx={{ color: '#64748b', fontSize: '0.9375rem' }}>
                      {labelPerfilColaborador(row.cargo)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'flex-end',
                        gap: 0.5,
                      }}
                    >
                      
                      {row.cargo === 'colaborador' && (
                        <IconButton
                          aria-label="Ver disponibilidade"
                          size="small"
                          sx={{ color: '#16a34a' }}
                          onClick={() => navigate(`/disponibilidade/${row.id}`)}
                        >
                          <EventAvailableOutlined fontSize="small" />
                        </IconButton>
                      )}
                      
                      <IconButton
                        aria-label="Editar colaborador"
                        size="small"
                        sx={{ color: '#0ea5e9' }}
                        onClick={() => abrirEditar(row)}
                      >
                        <EditOutlined fontSize="small" />
                      </IconButton>
                      <IconButton
                        aria-label="Remover colaborador"
                        size="small"
                        sx={{ color: '#ef4444' }}
                        onClick={() => void solicitarRemocao(row)}
                      >
                        <DeleteOutlineOutlined fontSize="small" />
                      </IconButton>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
              {!loading && filtrados.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} sx={{ py: 4 }}>
                    <Typography sx={{ color: '#64748b', textAlign: 'center' }}>
                      Nenhum colaborador encontrado.
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <Typography
          variant="body2"
          sx={{ mt: 2, color: '#94a3b8', fontSize: '0.875rem' }}
        >
          {loading
            ? 'Carregando colaboradores...'
            : `${filtrados.length} colaborador${
                filtrados.length === 1 ? '' : 'es'
              } encontrado${filtrados.length === 1 ? '' : 's'}`}
        </Typography>
      </Container>

      <ColaboradorFormModal
        open={conviteOpen}
        email={formEmail}
        cargo={formCargo}
        onEmailChange={setFormEmail}
        onCargoChange={setFormCargo}
        onClose={fecharConvite}
        onSubmit={handleSubmitConvite}
      />

      <EditarPessoaModal
        open={editOpen}
        tipo="colaborador"
        initial={editInitial}
        onClose={fecharEditar}
        onSave={handleSalvarEdicao}
      />
    </Box>
  )
}
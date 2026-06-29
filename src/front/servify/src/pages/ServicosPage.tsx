import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ServicoFormModal, {
  type ServicoFormValues,
} from '../components/ServicoFormModal'
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
import ArrowBackOutlined from '@mui/icons-material/ArrowBackOutlined'
import EditOutlined from '@mui/icons-material/EditOutlined'
import LocalOfferOutlined from '@mui/icons-material/LocalOfferOutlined'
import Search from '@mui/icons-material/Search'
import ViewSidebarOutlined from '@mui/icons-material/ViewSidebarOutlined'
import ConfirmarAcaoModal from '../components/ConfirmarAcaoModal'
import VisibilityOffOutlined from '@mui/icons-material/VisibilityOffOutlined'
import VisibilityOutlined from '@mui/icons-material/VisibilityOutlined'
import { useSidebarLayout } from '../context/SidebarLayoutContext'
import {
  toastCadastroSucesso,
  toastError,
  toastSuccess,
} from '../components/showAlert'
import { mensagemDeErroCapturado } from '../services/api'
import {
  mensagemInativarServico,
  mensagemReativarServico,
} from '../constants/ServicoMensagens'
import {
  atualizarServico,
  criarServico,
  formatarValorBrl,
  getServicos,
  type Servico,
  type ServicoFormPayload,
} from '../services/servicos'
import { formatMoedaBrlFromNumber } from '../utils/masks'
import { ServicoIcone } from '../utils/servicoIcones'

const NAVY = '#1e3a5f'
const BORDER = '#e2e8f0'
const PAGE_BG = '#f8fafc'

function servicoToFormValues(s: Servico): ServicoFormValues {
  return {
    nome: s.nome,
    valor: formatMoedaBrlFromNumber(s.valor),
    duracaoMinutos: String(s.duracaoMinutos),
    icone: s.icone,
    ativo: s.ativo,
  }
}

export default function ServicosPage() {
  const navigate = useNavigate()
  const { sidebarExpanded, toggleSidebar } = useSidebarLayout()
  const [busca, setBusca] = useState('')
  const [servicos, setServicos] = useState<Servico[]>([])
  const [loading, setLoading] = useState(true)

  const [formOpen, setFormOpen] = useState(false)
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create')
  const [formInitial, setFormInitial] = useState<ServicoFormValues | undefined>()
  const [editingId, setEditingId] = useState<string | null>(null)

  const [inativarOpen, setInativarOpen] = useState(false)
  const [inativarTarget, setInativarTarget] = useState<Servico | null>(null)
  const [alterandoAtivo, setAlterandoAtivo] = useState(false)

  const carregarServicos = useCallback(async () => {
    const data = await getServicos()
    setServicos(data)
  }, [])

  useEffect(() => {
    let alive = true
    void (async () => {
      try {
        const data = await getServicos()
        if (!alive) return
        setServicos(data)
      } catch (e: unknown) {
        if (!alive) return
        toastError(
          mensagemDeErroCapturado(e, 'Não foi possível carregar os serviços.'),
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

  function abrirAdicionar() {
    setFormMode('create')
    setFormInitial(undefined)
    setEditingId(null)
    setFormOpen(true)
  }

  function abrirEditar(row: Servico) {
    setFormMode('edit')
    setEditingId(row.id)
    setFormInitial(servicoToFormValues(row))
    setFormOpen(true)
  }

  function fecharForm() {
    setFormOpen(false)
    setEditingId(null)
  }

  function solicitarAlterarAtivo(row: Servico) {
    setInativarTarget(row)
    setInativarOpen(true)
  }

  function fecharAlterarAtivo() {
    setInativarOpen(false)
    setInativarTarget(null)
  }

  async function handleSalvarForm(payload: ServicoFormPayload) {
    try {
      if (formMode === 'create') {
        await criarServico(payload)
        await carregarServicos()
        fecharForm()
        toastCadastroSucesso('Serviço cadastrado com sucesso.')
      } else if (editingId) {
        await atualizarServico(editingId, payload)
        await carregarServicos()
        fecharForm()
        toastCadastroSucesso('Serviço atualizado com sucesso.')
      }
    } catch (e: unknown) {
      throw new Error(
        mensagemDeErroCapturado(e, 'Não foi possível salvar o serviço.'),
      )
    }
  }

  async function handleConfirmarAlterarAtivo() {
    if (!inativarTarget) return
    setAlterandoAtivo(true)
    try {
      await atualizarServico(inativarTarget.id, {
        nome: inativarTarget.nome,
        valor: inativarTarget.valor,
        duracaoMinutos: inativarTarget.duracaoMinutos,
        icone: inativarTarget.icone,
        ativo: !inativarTarget.ativo,
      })
      await carregarServicos()
      fecharAlterarAtivo()
      toastSuccess(
        inativarTarget.ativo
          ? 'Serviço inativado com sucesso.'
          : 'Serviço reativado com sucesso.',
      )
    } catch (e: unknown) {
      toastError(
        mensagemDeErroCapturado(e, 'Não foi possível alterar o status do serviço.'),
      )
    } finally {
      setAlterandoAtivo(false)
    }
  }

  const filtrados = useMemo(() => {
    const q = busca.trim().toLowerCase()
    if (!q) return servicos
    return servicos.filter((s) => s.nome.toLowerCase().includes(q))
  }, [busca, servicos])

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
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
            <IconButton
              aria-label="Voltar"
              onClick={() => navigate('/agendamentos')}
              sx={{ color: NAVY, mr: 0.5 }}
            >
              <ArrowBackOutlined />
            </IconButton>
            <LocalOfferOutlined sx={{ fontSize: 28, color: NAVY }} />
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
              Gerenciar Serviços
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
          fullWidth
          placeholder="Buscar serviços..."
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
          <Table size="medium">
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
                <TableCell>Nome do Serviço</TableCell>
                <TableCell width="14%">Valor</TableCell>
                <TableCell width="14%">Duração</TableCell>
                <TableCell width="12%">Status</TableCell>
                <TableCell width="12%" align="right">
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
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Box
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: '10px',
                          bgcolor: '#e0f2fe',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <ServicoIcone icone={row.icone} />
                      </Box>
                      <Typography sx={{ fontWeight: 700, color: NAVY }}>
                        {row.nome}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography sx={{ color: '#64748b', fontSize: '0.9375rem' }}>
                      {formatarValorBrl(row.valor)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography sx={{ color: '#64748b', fontSize: '0.9375rem' }}>
                      {row.duracaoMinutos} min
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography
                      component="span"
                      sx={{
                        display: 'inline-block',
                        px: 1.5,
                        py: 0.5,
                        borderRadius: '999px',
                        fontSize: '0.8125rem',
                        fontWeight: 600,
                        bgcolor: row.ativo ? '#dcfce7' : '#f1f5f9',
                        color: row.ativo ? '#166534' : '#64748b',
                      }}
                    >
                      {row.ativo ? 'Ativo' : 'Inativo'}
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
                      <IconButton
                        aria-label="Editar serviço"
                        size="small"
                        sx={{ color: '#0ea5e9' }}
                        onClick={() => abrirEditar(row)}
                      >
                        <EditOutlined fontSize="small" />
                      </IconButton>
                      <IconButton
                        aria-label={row.ativo ? 'Inativar serviço' : 'Reativar serviço'}
                        size="small"
                        sx={{ color: row.ativo ? '#166534' : '#64748b' }}
                        onClick={() => solicitarAlterarAtivo(row)}
                      >
                        {row.ativo
                          ? <VisibilityOutlined fontSize="small" />
                          : <VisibilityOffOutlined fontSize="small" />
                        }
                      </IconButton>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
              {!loading && filtrados.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} sx={{ py: 4 }}>
                    <Typography sx={{ color: '#64748b', textAlign: 'center' }}>
                      Nenhum serviço encontrado.
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
            ? 'Carregando serviços...'
            : `${filtrados.length} serviço${filtrados.length === 1 ? '' : 's'} encontrado${filtrados.length === 1 ? '' : 's'}`}
        </Typography>
      </Container>

      <ServicoFormModal
        open={formOpen}
        mode={formMode}
        initial={formInitial}
        onClose={fecharForm}
        onSubmit={handleSalvarForm}
      />

      <ConfirmarAcaoModal
        open={inativarOpen}
        titulo={inativarTarget?.ativo ? 'Inativar serviço' : 'Reativar serviço'}
        mensagem={
          inativarTarget?.ativo
            ? mensagemInativarServico(inativarTarget?.nome ?? '')
            : mensagemReativarServico(inativarTarget?.nome ?? '')
        }
        labelConfirmar={inativarTarget?.ativo ? 'Inativar' : 'Reativar'}
        corConfirmar={inativarTarget?.ativo ? '#f59e0b' : '#22c55e'}
        corConfirmarHover={inativarTarget?.ativo ? '#d97706' : '#16a34a'}
        carregando={alterandoAtivo}
        onConfirm={handleConfirmarAlterarAtivo}
        onClose={fecharAlterarAtivo}
      />
    </Box>
  )
}

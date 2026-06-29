import { useEffect, useMemo, useState } from 'react'
import EditarPessoaModal from '../components/EditarPessoaModal'
import Box from '@mui/material/Box'
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
import ViewSidebarOutlined from '@mui/icons-material/ViewSidebarOutlined'
import DeleteOutlineOutlined from '@mui/icons-material/DeleteOutlineOutlined'
import EditOutlined from '@mui/icons-material/EditOutlined'
import PersonOutlined from '@mui/icons-material/PersonOutlined'
import Search from '@mui/icons-material/Search'
import { useSidebarLayout } from '../context/SidebarLayoutContext'
import {
  confirmDeleteRecord,
  toastCadastroSucesso,
  toastSuccess,
  toastError,
} from '../components/showAlert'
import type { EditarPessoaValues } from '../types/editarPessoa'
import { getClientes, deleteClientePorId, type Cliente } from '../services/clientes'
import { mensagemDeErroCapturado } from '../services/api'

const NAVY = '#1e3a5f'
const BORDER = '#e2e8f0'
const PAGE_BG = '#f8fafc'

function rowToEditValues(row: Cliente): EditarPessoaValues {
  return {
    nome: row.nome,
    email: row.email,
    telefone: row.telefone,
    cpf: row.cpf,
    dataNascimento: row.dataNascimento,
    cidade: row.cidade,
    cargo: '',
    ativo: row.ativo,
    cep: row.cep,
    logradouro: row.logradouro,
    numero: row.numero,
    complemento: row.complemento,
    bairro: row.bairro,
    uf: row.uf,
  }
}

export default function ClientesPage() {
  const { sidebarExpanded, toggleSidebar } = useSidebarLayout()
  const [busca, setBusca] = useState('')
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)

  const [editOpen, setEditOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
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
        const data = await getClientes()
        if (!alive) return
        setClientes(data)
      } catch (e: unknown) {
        if (!alive) return
        toastError(
          e instanceof Error
            ? e.message
            : 'Não foi possível carregar os clientes.',
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

  function abrirEditar(row: Cliente) {
    setEditingId(row.id)
    setEditInitial(rowToEditValues(row))
    setEditOpen(true)
  }

  function fecharEditar() {
    setEditOpen(false)
    setEditingId(null)
  }

  async function handleSalvarEdicao(data: EditarPessoaValues) {
    if (!editingId) return

    const nome = data.nome.trim()
    const email = data.email.trim()
    const cpfDigits = data.cpf.replace(/\D/g, '')

    if (!nome) {
      toastError('Informe o nome completo.')
      return
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toastError('Informe um e-mail válido.')
      return
    }

    if (cpfDigits.length !== 11) {
      toastError('CPF deve ter 11 dígitos.')
      return
    }

    const dataNasc = data.dataNascimento.trim()
    if (!dataNasc || !/^\d{4}-\d{2}-\d{2}$/.test(dataNasc)) {
      toastError('Informe uma data de nascimento válida.')
      return
    }

    const cidadeApi = (() => {
      const t = data.cidade.trim()
      const idx = t.lastIndexOf(' - ')
      if (idx > 0) return t.slice(0, idx).trim()
      return t
    })()

    try {
      const response = await fetch(
        `http://localhost:8080/usuarios/${editingId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            perfilId: 3,
            nome,
            email,
            telefone: data.telefone.replace(/\D/g, ''),
            dataNascimento: dataNasc,
            cep: data.cep.replace(/\D/g, ''),
            logradouro: data.logradouro,
            numero: data.numero,
            complemento: data.complemento,
            bairro: data.bairro,
            cidade: cidadeApi,
            uf: data.uf,
          }),
        },
      )

      if (!response.ok) {
        //throw new Error('Erro ao atualizar cliente')
        const errorText = await response.text()

        console.error('Erro backend:', errorText)

        throw new Error(errorText)
      }

      setClientes((prev) =>
        prev.map((c) =>
          c.id === editingId
            ? {
              ...c,
              nome: data.nome,
              email: data.email,
              telefone: data.telefone,
              cpf: data.cpf,
              dataNascimento: data.dataNascimento,
              cidade: data.cidade,
              ativo: data.ativo,
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
      toastCadastroSucesso('Cliente atualizado com sucesso.')
    } catch {
      toastError('Não foi possível atualizar o cliente.')
    }
  }

  async function solicitarRemocao(row: Cliente) {
    const subtitulo = `${row.nome} (${row.email}) será removido da lista.`
    const ok = await confirmDeleteRecord('Remover cliente?', subtitulo)
    if (!ok) return
    try {
      await deleteClientePorId(row.id)
      if (editingId === row.id) fecharEditar()
      const data = await getClientes()
      setClientes(data)
      toastSuccess('Cliente removido.')
    } catch (e: unknown) {
      toastError(
        mensagemDeErroCapturado(e, 'Não foi possível remover o cliente.'),
      )
    }
  }

  const filtrados = useMemo(() => {
    const q = busca.trim().toLowerCase()
    if (!q) return clientes
    return clientes.filter(
      (c) =>
        c.nome.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.cidade.toLowerCase().includes(q),
    )
  }, [busca, clientes])

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
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <PersonOutlined sx={{ fontSize: 28, color: NAVY }} />
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
              Clientes
            </Typography>
          </Box>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3 }, py: 3 }}>
        <TextField
          fullWidth
          placeholder="Buscar clientes..."
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
                <TableCell width="24%">Nome</TableCell>
                <TableCell width="28%">Email</TableCell>
                <TableCell width="21%">Cidade</TableCell>
                <TableCell width="12%">Status</TableCell>
                <TableCell width="15%" align="right">
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
                    <Typography sx={{ fontWeight: 700, color: NAVY }}>
                      {row.nome}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography sx={{ color: '#64748b', fontSize: '0.9375rem' }}>
                      {row.email}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography sx={{ color: '#64748b', fontSize: '0.9375rem' }}>
                      {row.cidade}
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
                        aria-label="Editar cliente"
                        size="small"
                        sx={{ color: '#0ea5e9' }}
                        onClick={() => abrirEditar(row)}
                      >
                        <EditOutlined fontSize="small" />
                      </IconButton>
                      <IconButton
                        aria-label="Remover cliente"
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
                  <TableCell colSpan={5} sx={{ py: 4 }}>
                    <Typography sx={{ color: '#64748b', textAlign: 'center' }}>
                      Nenhum cliente encontrado.
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
            ? 'Carregando clientes...'
            : `${filtrados.length} cliente${filtrados.length === 1 ? '' : 's'} encontrado${filtrados.length === 1 ? '' : 's'
            }`}
        </Typography>
      </Container>

      <EditarPessoaModal
        open={editOpen}
        tipo="cliente"
        initial={editInitial}
        onClose={fecharEditar}
        onSave={handleSalvarEdicao}
      />
    </Box>
  )
}

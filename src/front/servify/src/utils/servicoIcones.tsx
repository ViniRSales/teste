import type { SvgIconComponent } from '@mui/icons-material'
import AutoAwesomeOutlined from '@mui/icons-material/AutoAwesomeOutlined'
import BoltOutlined from '@mui/icons-material/BoltOutlined'
import BrushOutlined from '@mui/icons-material/BrushOutlined'
import ContentCutOutlined from '@mui/icons-material/ContentCutOutlined'
import DiamondOutlined from '@mui/icons-material/DiamondOutlined'
import FavoriteBorderOutlined from '@mui/icons-material/FavoriteBorderOutlined'
import LocalFloristOutlined from '@mui/icons-material/LocalFloristOutlined'
import OpacityOutlined from '@mui/icons-material/OpacityOutlined'
import PaletteOutlined from '@mui/icons-material/PaletteOutlined'
import SentimentSatisfiedAltOutlined from '@mui/icons-material/SentimentSatisfiedAltOutlined'
import StarBorderOutlined from '@mui/icons-material/StarBorderOutlined'
import WavesOutlined from '@mui/icons-material/WavesOutlined'
import WbSunnyOutlined from '@mui/icons-material/WbSunnyOutlined'
import WorkspacePremiumOutlined from '@mui/icons-material/WorkspacePremiumOutlined'
import FaceRetouchingNaturalOutlined from '@mui/icons-material/FaceRetouchingNaturalOutlined'

export type ServicoIconeKey =
  | 'scissors'
  | 'sparkles'
  | 'palette'
  | 'razor'
  | 'brush'
  | 'water_drop'
  | 'star'
  | 'heart'
  | 'flower'
  | 'bolt'
  | 'crown'
  | 'waves'
  | 'smiley'
  | 'sun'
  | 'diamond'

export const ICONE_PADRAO_SERVICO: ServicoIconeKey = 'scissors'

export const SERVICO_ICONES: { key: ServicoIconeKey; label: string }[] = [
  { key: 'scissors', label: 'Tesoura' },
  { key: 'sparkles', label: 'Brilho' },
  { key: 'palette', label: 'Paleta' },
  { key: 'razor', label: 'Barba' },
  { key: 'brush', label: 'Pincel' },
  { key: 'water_drop', label: 'Gota' },
  { key: 'star', label: 'Estrela' },
  { key: 'heart', label: 'Coração' },
  { key: 'flower', label: 'Flor' },
  { key: 'bolt', label: 'Raio' },
  { key: 'crown', label: 'Coroa' },
  { key: 'waves', label: 'Ondas' },
  { key: 'smiley', label: 'Sorriso' },
  { key: 'sun', label: 'Sol' },
  { key: 'diamond', label: 'Diamante' },
]

const ICON_MAP: Record<ServicoIconeKey, SvgIconComponent> = {
  scissors: ContentCutOutlined,
  sparkles: AutoAwesomeOutlined,
  palette: PaletteOutlined,
  razor: FaceRetouchingNaturalOutlined,
  brush: BrushOutlined,
  water_drop: OpacityOutlined,
  star: StarBorderOutlined,
  heart: FavoriteBorderOutlined,
  flower: LocalFloristOutlined,
  bolt: BoltOutlined,
  crown: WorkspacePremiumOutlined,
  waves: WavesOutlined,
  smiley: SentimentSatisfiedAltOutlined,
  sun: WbSunnyOutlined,
  diamond: DiamondOutlined,
}

export function isServicoIconeKey(v: string): v is ServicoIconeKey {
  return SERVICO_ICONES.some((i) => i.key === v)
}

export function ServicoIcone({
  icone,
  sx,
}: {
  icone: string
  sx?: object
}) {
  const key = isServicoIconeKey(icone) ? icone : ICONE_PADRAO_SERVICO
  const Icon = ICON_MAP[key]
  return <Icon sx={{ fontSize: 22, color: '#1e3a5f', ...sx }} />
}

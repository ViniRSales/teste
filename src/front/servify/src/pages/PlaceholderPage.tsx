import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'

type PlaceholderPageProps = {
  title: string
}

export default function PlaceholderPage({ title }: PlaceholderPageProps) {
  return (
    <Box
      sx={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: '#f8fafc',
        p: 3,
      }}
    >
      <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 600 }}>
        {title}
      </Typography>
    </Box>
  )
}

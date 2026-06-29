import { createTheme } from '@mui/material/styles'

const navy = '#1e3a5f'

export const appTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: navy,
      contrastText: '#ffffff',
    },
    text: {
      primary: '#1a1d24',
      secondary: '#6b7280',
    },
    background: {
      default: '#ffffff',
      paper: '#ffffff',
    },
  },
  shape: {
    borderRadius: 8,
  },
  typography: {
    fontFamily: [
      'Inter',
      'system-ui',
      '-apple-system',
      '"Segoe UI"',
      'Roboto',
      'sans-serif',
    ].join(','),
    h5: {
      fontWeight: 700,
      letterSpacing: '-0.02em',
      lineHeight: 1.2,
    },
    body2: {
      fontSize: '0.9375rem',
      lineHeight: 1.45,
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          colorScheme: 'light dark',
        },
      },
    },
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 700,
          fontSize: '1rem',
          borderRadius: 10,
          '&.MuiButton-containedPrimary:hover': {
            backgroundColor: '#162d4a',
          },
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        margin: 'none',
        size: 'medium',
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          backgroundColor: '#ffffff',
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: '#d1d5db',
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: '#d1d5db',
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: navy,
            borderWidth: 1,
          },
          '&.Mui-focused': {
            boxShadow: '0 0 0 3px rgba(30, 58, 95, 0.12)',
          },
        },
        input: {
          paddingTop: 12,
          paddingBottom: 12,
          fontSize: '0.9375rem',
          '&::placeholder': {
            color: '#9ca3af',
            opacity: 1,
          },
        },
      },
    },
    MuiInputAdornment: {
      styleOverrides: {
        root: {
          marginRight: 0,
          '& .MuiSvgIcon-root': {
            color: '#9ca3af',
            fontSize: 20,
          },
        },
      },
    },
    MuiLink: {
      styleOverrides: {
        root: {
          fontWeight: 600,
        },
      },
    },
  },
})

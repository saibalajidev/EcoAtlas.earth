/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        forest: { 50:'#f2f7f4',100:'#dce9e2',200:'#bcd4c6',300:'#8fb7a3',400:'#5f967f',500:'#3c7a63',600:'#2b614f',700:'#234e41',800:'#14342b',900:'#0e2a23',950:'#081c17' },
        cream: '#f7f8f5',
        charcoal: '#101815',
        accent: { DEFAULT:'#e8b44a', soft:'#f6dd9f' }
      },
      fontFamily: { sans: ['Inter','system-ui','sans-serif'], display: ['Manrope','Inter','sans-serif'] },
      boxShadow: { soft: '0 8px 30px rgba(14,42,35,.08)', card: '0 1px 2px rgba(16,24,20,.06), 0 8px 24px rgba(16,24,20,.06)' }
    }
  },
  plugins: []
}

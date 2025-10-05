# UI2 - Modern React Application

A modern React application built with Vite, Tailwind CSS, and Mantine components.

## Tech Stack

- **React** - Frontend library
- **Vite** - Build tool and development server
- **Tailwind CSS** - Utility-first CSS framework
- **Mantine** - React components library
- **Tabler Icons** - Icon library

## Getting Started

### Prerequisites

- Node.js (v20.18.1 or higher)
- npm

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open your browser and navigate to the URL shown in the terminal (usually `http://localhost:5173`)

## Project Structure

```
ui2/
├── src/
│   ├── App.jsx          # Main application component
│   ├── main.jsx         # Application entry point
│   └── index.css        # Global styles with Tailwind directives
├── public/              # Static assets
├── tailwind.config.js   # Tailwind CSS configuration
├── postcss.config.js    # PostCSS configuration
└── package.json         # Dependencies and scripts
```

## Features

- ⚡ Fast development with Vite
- 🎨 Beautiful UI with Mantine components
- 🎯 Utility-first styling with Tailwind CSS
- 📱 Responsive design
- 🔔 Notifications system
- 🎭 Modern gradient effects
- 📦 Component-based architecture

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Customization

### Tailwind CSS
Edit `tailwind.config.js` to customize your design system.

### Mantine Theme
The Mantine provider is configured in `src/main.jsx`. You can customize the theme by passing a `theme` prop to `MantineProvider`.

### Components
All components are in `src/App.jsx`. You can create additional components in the `src/components/` directory.

## Learn More

- [React Documentation](https://react.dev/)
- [Vite Documentation](https://vitejs.dev/)
- [Tailwind CSS Documentation](https://tailwindcss.com/)
- [Mantine Documentation](https://mantine.dev/)

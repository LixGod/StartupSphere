# Trendlyzer - AI-Powered Reel Idea Generator

A modern, elegant web application that generates trending reel ideas, captions, and hashtags for TikTok and Instagram content. Built with Next.js 16, TypeScript, and Tailwind CSS.

![Trendlyzer](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.0-38bdf8?style=for-the-badge&logo=tailwind-css)

## Features

- ✨ **AI-Powered Content Generation**: Generate creative reel ideas, shooting directions, captions, and hashtags
- 🎨 **Professional Dark Theme**: Elegant and modern dark UI design
- 📱 **Mobile Responsive**: Works seamlessly on all devices
- 📋 **Copy-to-Clipboard**: Easy copying of captions and hashtags
- 🚀 **Fast & Efficient**: Built with Next.js for optimal performance
- 🎯 **Trending Focus**: Optimized for viral content creation

## Tech Stack

- **Framework**: Next.js 16
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4.0
- **UI Components**: Radix UI, shadcn/ui
- **AI Integration**: Vercel AI SDK with advanced models
- **Icons**: Lucide React
- **Theme**: Dark mode by default with elegant gradients

## Getting Started

### Prerequisites

- Node.js 24 or higher
- npm, pnpm, or yarn
- API key for AI service

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/yourusername/trendlyzer-app.git
   cd trendlyzer-app
   ```

2. **Install dependencies**:
   ```bash
   npm install
   # or
   pnpm install
   ```

3. **Set up environment variables**:
   Create a `.env` file in the root directory:
   ```env
   GROQ_API_KEY=your_api_key_here
   ```
   Get your API key from the AI service provider.

4. **Run the development server**:
   ```bash
   npm run dev
   # or
   pnpm dev
   ```

5. **Open your browser**:
   Navigate to [http://localhost:3000](http://localhost:3000)

## Usage

1. Enter your **Product Name** in the input field
2. Provide an **Event Description** or occasion
3. Click **Generate Reel Idea**
4. Get:
   - Creative reel concept
   - Step-by-step shooting directions
   - Multiple caption variations (emotional, humorous, straightforward)
   - Trending hashtags

## Project Structure

```
trendlyzer-app/
├── app/
│   ├── api/
│   │   └── generate-reel/    # API route for reel generation
│   ├── globals.css           # Global styles
│   ├── layout.tsx            # Root layout
│   └── page.tsx              # Main page
├── components/
│   ├── ui/                   # UI components
│   └── theme-provider.tsx    # Theme provider
├── hooks/                    # Custom React hooks
├── lib/                      # Utility functions
├── public/                   # Static assets
└── styles/                   # Additional styles
```

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Docker Support

The project includes Docker configuration for easy deployment:

### Development
```bash
docker-compose -f docker-compose.dev.yml up --build
```

### Production
```bash
docker-compose up --build
```

See [DOCKER.md](./DOCKER.md) for detailed Docker instructions.

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `GROQ_API_KEY` | API key for AI service | Yes |

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Icons from [Lucide](https://lucide.dev/)

## Support

For support, email your-email@example.com or open an issue on GitHub.

---

**Built for creators and marketers** 🚀

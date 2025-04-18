# Chat Application

A modern, real-time chat application with WebRTC support for real-time communication.

## 🚀 Features

- Real-time messaging
- WebRTC support for peer-to-peer communication
- TypeScript for type safety
- Prisma for database management
- Docker support for containerization

## 📦 Project Structure

```
chat-app/
├── libs/
│   └── shared-schemas/    # Shared type definitions and schemas
├── services/             # Additional services (including coturn)
├── package.json         # Root package configuration
├── pnpm-workspace.yaml  # Workspace configuration
├── tsconfig.json       # TypeScript configuration
└── Docker-compose.yaml # Docker configuration
```

## 🛠️ Prerequisites

- Node.js (LTS version)
- pnpm (Package manager)
- Docker and Docker Compose
- PostgreSQL (for database)

## 🔧 Installation

1. Clone the repository:

```bash
git clone [your-repository-url]
cd chat-app
```

2. Install dependencies:

```bash
pnpm install
```

3. Set up environment variables:

   - Create `.env` files in respective service directories
   - Configure database connection strings and other necessary variables

4. Start the development environment:

```bash
pnpm dev
```

## 🏗️ Building for Production

Build the server:

```bash
pnpm build:server
```

Build the web client:

```bash
pnpm build:web
```

## 🚀 Running in Production

Start the server:

```bash
pnpm start:server
```

Start the web client:

```bash
pnpm start:web
```

## 🐳 Docker Support

The application can be run using Docker Compose:

```bash
docker-compose up
```

## 📚 Tech Stack

- **Frontend**: React with TypeScript
- **Backend**: Node.js with TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Real-time Communication**: WebRTC with Coturn
- **Package Manager**: pnpm
- **Containerization**: Docker

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Thanks to all contributors who have helped shape this project
- Special thanks to the open-source community for the amazing tools and libraries

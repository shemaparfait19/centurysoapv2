# Century Cleaning Agency - Inventory & Sales System

A modern, mobile-friendly application for managing inventory, sales, and workers for Century Cleaning Agency.

## Features

- **Dashboard**: Real-time overview of daily sales, top products, and low stock alerts.
- **Sales Management**: Record sales with automatic stock updates. View detailed sales history with filtering and export to Excel options.
- **Stock Tracking**: Monitor product stock levels with color-coded alerts. Easly update stock quantities.
- **Worker Management**: Manage your sales team and track their performance.
- **Daily Reports**: Generate PDF summaries of daily business activities.

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later recommended)
- A [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) account (free tier works great). See `MONGODB_SETUP.md` for detailed instructions.

### Installation

1.  **Clone the repository** (if you haven't already):
    ```bash
    git clone <repository-url>
    cd century-soap-system
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Set up Environment Variables**:
    - Copy `.env.example` to `.env.local`:
      ```bash
      cp .env.example .env.local
      ```
    - Update `.env.local` with your MongoDB connection string (see `MONGODB_SETUP.md`).

4.  **Run the application**:
    ```bash
    npm run dev
    ```
    Open [http://localhost:3000](http://localhost:3000) in your browser.

### Initial Setup

To populate the database with your initial products (Liquid Soap, Hand Wash, Machine Dish Wash, etc.), run the following command while the server is running:

```bash
curl -X POST http://localhost:3000/api/products/seed
```
This will create the default products with their sizes and 0 stock.

## Deployment

This application is optimized for deployment on [Vercel](https://vercel.com). Strategies include:

1.  Push your code to a Git repository (GitHub, GitLab, Bitbucket).
2.  Import the project into Vercel.
3.  Add the `MONGODB_URI` environment variable in the Vercel project settings.
4.  Deploy!

## Technologies Used

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS & shadcn/ui
- **Database**: MongoDB & Mongoose
- **Icons**: Lucide React

## Support

For any issues or questions, please refer to the documentation or contact support.

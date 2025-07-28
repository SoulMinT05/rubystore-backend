# RubyStore (Server)

RubyStore is a modern e-commerce web application that delivers a seamless and engaging shopping experience.  
It supports a full range of core features including:

-   **OAuth2 Login** – sign-in quickly with Google
-   **OTP Email Verification** – secure account registration
-   **Product Browsing** – explore a wide range of products
-   **Product Reviewing** - review real-time
-   **Product Details** – images, prices, and descriptions
-   **Shopping Cart** – manage items before checkout
-   **Vouchers** – apply discount codes
-   **Checkout** – complete orders smoothly
-   **Notifications** – real-time order updates
-   **Messaging** – built-in chat system

This repository contains the backend codebase for the system.

Check out: [RubyStore (Client)](https://github.com/SoulMinT05/rubystore-frontend)

## Tech Stack

-   **Runtime**: Node.js
-   **Framework**: Express.js
-   **Database**: MongoDB (via Mongoose)
-   **Authentication**: Passport.js with JSON Web Tokens (JWT)
-   **Security**: Helmet, Cookie-parser, CORS
-   **File Upload**: Multer, Cloudinary (with multer-storage-cloudinary)
-   **Email Service**: Nodemailer
-   **Real-time Communication**: Socket.IO
-   **Environment Configuration**: dotenv

## Getting Started

### Prerequisites

-   Node.js (v22.16 or later recommended)
-   MongoDB instance (local or cloud-based, e.g., MongoDB Atlas)
-   npm or yarn package manager

### Installation

#### 1. Clone the repository:

```bash
git clone https://github.com/SoulMinT05/rubystore-backend
```

#### 2. Install dependencies:

```bash
npm install
# or
yarn install
```

#### 3. Set Up the Database

-   Install MongoDB locally or create a cluster using MongoDB Atlas.
-   Obtain your MongoDB connection URI (e.g., `mongodb+srv://<username>:<password>@cluster.mongodb.net/<dbname>?retryWrites=true&w=majority`).
-   Ensure the `MONGODB_URI` in your .env file matches the connection URI you obtained.

#### 4. Configure Environment Variables

Copy the .env.example file to create your .env file:

```bash
cp .env.example .env
```

Update the .env file with the necessary values:

```env
# MongoDB connection URI
MONGODB_URI=mongodb://127.0.0.1:27017/project-backend

# PORT, URL
PORT=8080
FRONTEND_URL=http://localhost:3000
FRONTEND_ADMIN_URL=http://localhost:4000

# Cloudinary
CLOUDINARY_NAME=your_cloud_name
CLOUDINARY_KEY=your_api_key
CLOUDINARY_SECRET=your_api_secret

# Nodemailer
EMAIL=your_email@gmail.com
EMAIL_PASSWORD=your_password

# JWT configuration
JSON_WEB_TOKEN_SECRET_KEY=your_secret_key
SECRET_KEY_ACCESS_TOKEN=secret_access_token
SECRET_KEY_REFRESH_TOKEN=secret_refresh_token
```

#### 5. Start the development server

Start the development server with:

```bash
npm start
# or
yarn start
```

The app will be available at `http://localhost:3001` by default.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

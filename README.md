# Next.js Modern IT Solutions Template

Dự án này là một bộ khung (template) phát triển web hiện đại dựa trên Next.js phiên bản mới nhất, với cấu trúc được module hóa toàn diện, hệ thống UI nhất quán và được tích hợp các công cụ hỗ trợ trải nghiệm người dùng tân tiến nhất.

## 🚀 Công Nghệ Sử Dụng (Tech Stack)

### Core
- **Framework**: [Next.js 16.x](https://nextjs.org/) (Sử dụng App Router)
- **Thư viện UI**: [React 19](https://react.dev/)
- **Ngôn ngữ chính**: TypeScript

### Giao Diện & Styling
- **CSS Framework**: Tailwind CSS v4 + PostCSS
- **Components Base**: Radix UI Primitives (thông qua kiến trúc `shadcn/ui`)
- **Quản lý Theme**: `next-themes` (Hỗ trợ Dark/Light mode)
- **Icons**: `lucide-react`

### Animation & Trải Nghiệm Người Dùng (UX)
- **Hiệu ứng & Chuyển động**: `framer-motion` & `gsap`
- **Mượt mà thanh cuộn**: `lenis` (Lenis Smooth scroll)
- **Slider/Carousel**: `embla-carousel-react`
- **Progressive Web App**: `@ducanh2912/next-pwa` (Hỗ trợ PWA cho trải nghiệm như Native App)

### Quản Lý Trạng Thái & Dữ Liệu
- **State Management**: `@preact/signals-react` (Quản lý state tối ưu hiệu suất)
- **HTTP/API Client**: `ky` (Thay thế Axios, nhỏ gọn và dựa trên fetch API)
- **Quản lý Form Validation**: `react-hook-form` kết hợp cùng `zod`
- **Xử lý Ngày/Tháng**: `dayjs` & `date-fns`

### Môi Trường & Code Quality
- **Linter & Formatter**: Biome (`@biomejs/biome`) - Thay thế ESLint/Prettier cho tốc độ xử lý nhanh hơn.
- **Git Hooks**: `husky` & `lint-staged` (Đảm bảo chuẩn code trước khi commit)

---

## 📂 Cấu Trúc Thư Mục

Dự án áp dụng kiến trúc tách bạch rõ ràng giữa thư mục cấu hình và thư mục logic mã nguồn chính:

```text
.
├── app/                  # Nơi khai báo các routes (trang) dựa trên cấu trúc App Router của Next.js
├── public/               # Tài nguyên tĩnh có thể truy cập công khai (Font, Ảnh, Favicon,...)
├── src/                  # Chứa toàn bộ logic mã nguồn chính của web
│   ├── api/              # Định nghĩa các interceptors và API Endpoint client fetching
│   ├── components/       # Các UI Component sử dụng chung toàn hệ thống (Button, Input, Layout...)
│   ├── constants/        # Lưu trữ các biến hệ thống, configurations, static data
│   ├── enums/            # Liệt kê các bộ Typescript Enums chuẩn hóa
│   ├── hooks/            # Các Custom Hook (tái sử dụng logic React)
│   ├── layout/           # Các cấu trúc hiển thị Layout cho Page (Header, Footer, MainLayout...)
│   ├── lib/              # Những hàm utils dùng chung của thư viện bên ngoài (tạo cn cho Tailwind...)
│   ├── modules/          # Chứa các trang giao diện (Ví dụ cụm HomePage chứa toàn bộ logic Landing)
│   ├── styles/           # CSS Settings, Variables css tổng, cấu hình cho font hoặc body
│   ├── types/            # Khai báo các đối tượng Type/Interface cho TypeScript
│   └── utils/            # Các helper function xử lý dữ liệu (parse string, date, array, math...)
├── .husky/               # Cấu hình chạy Git hooks bắt buộc khi commit code
├── biome.json            # Cấu hình rules và formatting cho Biome Linter
├── next.config.ts        # File tinh chỉnh hệ thống build và server của Next.js
├── tailwind.config.ts    # File quản lý theme (colors, fonts, animation) của Tailwind CSS
└── package.json          # Quản lý libraries, version và các câu lệnh scripts
```

---

## 🛠 Cách Cài Đặt Và Khởi Động

### Yêu cầu hệ thống
- **Node.js**: Phiên bản >= `20.x`
- **Package Manager**: Dự án sử dụng chính `yarn` (vì file `yarn.lock` có sẵn).

### Bước 1: Cài đặt các gói phụ thuộc (Dependencies)
Mở terminal tại thư mục dự án và chạy:

```bash
yarn install
```

### Bước 2: Thiết lập môi trường
Nếu dự án có file `.env.example`, hãy sao chép ra một file `.env` mới và điền các giá trị thích hợp cho việc chạy local.

### Bước 3: Chạy local Development Server
Sử dụng câu lệnh sau để mở trình giả lập development:

```bash
yarn dev
```
Trình duyệt sẽ khởi chạy server ở địa chỉ mặc định là [http://localhost:3000](http://localhost:3000). (Hỗ trợ theo dõi kết nối qua Local & Network config).

---

## 🖥 Các Lệnh Kịch Bản Hỗ Trợ (Scripts)

Tham khảo các đoạn script trong `package.json` cho từng mục đích:

- **`yarn dev`**: Chạy server cho môi trường phát triển (có hot-reload).
- **`yarn build`**: Build tối ưu mã nguồn (production build).
- **`yarn start`**: Chạy project bằng bản build production (cần chạy `build` trước).
- **`yarn format`**: Sửa tự động toàn bộ chuẩn cấu trúc code với Biome.
- **`yarn lint`**: Kiểm tra toàn bộ mã nguồn bắt các lỗi sai (không tự sửa, chỉ báo lỗi).
- **`yarn lint:fix`**: Tự động sửa cấu trúc code chuẩn với tính năng linting.
- **`yarn prepare`**: Câu lệnh auto-apply husky tự động móc nối git hooks với local machine.

---

## 🌐 Môi Trường Triển Khai (Deploy)

Website sẵn sàng để deploy lên thông qua các nhà cung cấp như [Vercel](https://vercel.com) hoặc có thể sử dụng giải pháp ảo hoá truyền thống.
Dự án đã có bản Dockerize (chứa sẵn `Dockerfile` và `.dockerignore`), giúp bạn triển khai linh hoạt lên AWS, Digital Ocean, Container Registry, v.v một cách dễ dàng và mượt mà.

> **Lưu ý trong lúc Dev**: Thay vì xài các extension như ESlint hay Prettier truyền thống, dự án sử dụng môi trường linter ưu việt thông qua `Biome`. Hãy tải plugin "Biome" trong mục Extensions của VS Code để đồng bộ hóa hoàn toàn trải nghiệm viết code.

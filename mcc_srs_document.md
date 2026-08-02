# HỒ SƠ ĐẶC TẢ YÊU CẦU HỆ THỐNG (SYSTEM REQUIREMENTS SPECIFICATION)

## 1. Bài toán và Vấn đề cần giải quyết (Problem Statement)

Tại Việt Nam, người dùng thẻ tín dụng ngày càng quan tâm đến việc tối ưu hóa tỷ lệ hoàn tiền (cashback) hoặc tích điểm thưởng dựa trên các hạng mục chi tiêu (siêu thị, ẩm thực, du lịch...). Tuy nhiên, thị trường đang tồn tại 3 "nỗi đau" (Pain points) lớn:

*   **Sự mù mờ về mã MCC:** Người dùng không biết chính xác cửa hàng mình chuẩn bị quẹt thẻ mang mã MCC (Merchant Category Code) nào, dẫn đến việc dùng sai thẻ và mất quyền lợi hoàn tiền.
*   **Hạn chế của các công cụ hiện tại:** Các trang web tra cứu MCC hiện có chỉ trả về "chuỗi sao kê thô" (Bank Transaction Descriptor - ví dụ: `PAYOO*WINMART QUANG TRUNG`) thay vì định danh chính xác tên cửa hàng, địa chỉ thực tế và vị trí trên bản đồ (Merchant Entity Resolution).
*   **Dữ liệu phân mảnh:** Thể lệ hoàn tiền của các ngân hàng thường nằm rải phá trong các file PDF phức tạp, khó tra cứu nhanh gọn. Dữ liệu thực tế từ cộng đồng (quẹt thẻ ở đâu nhảy mã gì) lại trôi nổi trên các hội nhóm mạng xã hội và không được chuẩn hóa.

**Sứ mệnh của hệ thống:** Trở thành nền tảng bản đồ MCC chính xác và trực quan nhất tại Việt Nam, kết nối trực tiếp dữ liệu điểm bán (POS) với thể lệ hoàn tiền của từng dòng thẻ tín dụng.

---

## 2. Yêu cầu Chức năng (Functional Requirements)

Hệ thống được chia thành 2 nhóm chức năng chính: Dành cho Người dùng (End-User) và Dành cho Hệ thống Nội bộ (Internal/Admin).

### 2.1. Phân hệ Người dùng cuối (Frontend - Next.js)
*   **Tra cứu theo Mã MCC / Danh mục:**
    *   Người dùng chọn một mã MCC (VD: `5812 - Ẩm thực`).
    *   Hệ thống yêu cầu cấp quyền vị trí (GPS) và hiển thị danh sách/bản đồ các cửa hàng hỗ trợ mã MCC này trong bán kính X km.
*   **Tra cứu theo Tên Cửa hàng:**
    *   Người dùng nhập tên cửa hàng (hỗ trợ gõ sai chính tả / Fuzzy search).
    *   Hệ thống trả về thông tin chi tiết: Tên chuẩn, Địa chỉ, Mã MCC tại kênh thanh toán Offline (Quẹt thẻ POS) và Online (Qua GrabFood/ShopeeFood), kèm theo Độ tin cậy (Confidence Score).
*   **Gợi ý Thẻ tín dụng tối ưu:**
    *   Người dùng chọn dòng thẻ đang sở hữu (VD: `VPBank StepUp`).
    *   Hệ thống liệt kê các danh mục được hoàn tiền của thẻ đó và bản đồ các cửa hàng lân cận đáp ứng điều kiện.
*   **Báo cáo / Đóng góp dữ liệu (Crowdsourcing):**
    *   Cho phép người dùng đăng nhập để gửi báo cáo mã MCC mới tại một địa điểm. (Tính năng tải ảnh hóa đơn/sao kê sẽ được bổ sung sau MVP).

### 2.2. Phân hệ Xử lý Dữ liệu Nội bộ (Data Ingestion - Python)
*   **Tự động hóa thu thập Thể lệ:**
    *   Tự động tải và đọc file PDF/HTML từ website ngân hàng.
    *   Trích xuất các cặp `[Cửa hàng - Mã MCC]` bằng AI.
*   **Lắng nghe Mạng xã hội (Social Listening):**
    *   Quét và lọc các bài viết/bình luận chứa từ khóa về MCC.
    *   Đẩy các dữ liệu tiềm năng vào hàng đợi duyệt (Staging).
*   **Chuẩn hóa Danh bạ Cửa hàng:**
    *   Cào dữ liệu từ API các cổng thanh toán (Payoo, VNPay) để xây dựng bộ từ điển tên cửa hàng chuẩn (Base Directory).

---

## 3. Kiến trúc Tổng thể (System Architecture)

Hệ thống áp dụng mô hình **Microservices-oriented**, phân tách rạch ròi giữa hệ thống phục vụ người dùng và hệ thống cào dữ liệu.

### 3.1. Core System (Hệ thống Chính)
Chịu trách nhiệm tương tác trực tiếp với người dùng, yêu cầu tốc độ phản hồi tính bằng mili-giây và khả năng chịu tải tốt.
*   **Frontend (Next.js):** Xử lý Server-Side Rendering (SSR) để đảm bảo dữ liệu cửa hàng có thể được Google Index (SEO-friendly). Hiển thị giao diện bản đồ và danh sách.
*   **Backend API (NestJS):** Đóng vai trò API Gateway. Tiếp nhận query tìm kiếm, thực hiện logic tính toán khoảng cách và phân quyền dữ liệu. 
*   **Database (PostgreSQL):** 
    *   Tích hợp `PostGIS` để lưu trữ tọa độ (`latitude`, `longitude`) và truy vấn bán kính địa lý.
    *   Tích hợp `pg_trgm` để tìm kiếm văn bản gần đúng (Fuzzy Search).
    *   Giao tiếp với NestJS thông qua ORM (Prisma/TypeORM).

### 3.2. Data Ingestion & AI System (Hệ thống Vệ tinh)
Hoạt động ngầm (Background job) để liên tục làm giàu và làm sạch cơ sở dữ liệu mà không ảnh hưởng đến hiệu năng của Core System.
*   **Tech Stack:** Python (FastAPI/Scripts độc lập).
*   **LLM Fallback Proxy:** Cụm xử lý ngôn ngữ tự nhiên được thiết kế theo cơ chế "Thác nước" (Waterfall) để tối ưu chi phí 0 Đồng. Yêu cầu phân tích văn bản sẽ lần lượt đi qua: `Google Gemini (Free Tier)` -> `Groq` -> `OpenRouter`. Trả về kết quả dưới dạng JSON Schema nghiêm ngặt.
*   **Giao thức Nạp dữ liệu (Ingestion Protocol):** Sau khi Python chuẩn hóa dữ liệu xong, nó sẽ gọi một Internal API của NestJS (được bảo vệ bằng `X-API-KEY`) để đẩy dữ liệu (Upsert) vào PostgreSQL một cách an toàn.

---

## 4. Yêu cầu Phi chức năng (Non-Functional Requirements)

*   **Tối ưu SEO (Search Engine Optimization):** Mọi trang chi tiết cửa hàng (ví dụ: `/store/highlands-coffee-ham-nghi`) và thẻ tín dụng phải được render nội dung từ server tĩnh để bot Google dễ dàng thu thập.
*   **Độ trễ truy vấn (Latency):** API tra cứu theo bán kính địa lý phải trả về kết quả dưới 300ms đối với tập dữ liệu khoảng 100.000 bản ghi.
*   **Chi phí vận hành (Cost-Efficiency):** Ở giai đoạn MVP, hệ thống thu thập dữ liệu AI phải tận dụng 100% các tài nguyên miễn phí (Free Tier) bằng cơ chế Fallback Proxy, không phát sinh chi phí gọi API từ OpenAI hay Anthropic.
*   **Tính toàn vẹn dữ liệu (Data Integrity):** Không cho phép dữ liệu rác hoặc sai cấu trúc đi vào cơ sở dữ liệu chính. Mọi luồng Ingestion phải đi qua DTO Validation của NestJS.
*   **Khả năng mở rộng (Scalability):** Hệ thống Data Ingestion có thể chạy trên một server/container hoàn toàn riêng biệt so với Core System. Khi cần cào dữ liệu mạnh hơn, chỉ cần scale phần Python mà không chạm tới code NestJS.

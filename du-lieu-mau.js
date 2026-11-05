(function (g) {
    'use strict';

    const V = g.VideoShare = g.VideoShare || {};

    V.anhBiaYouTube = function (source) {
        try {
            const url = new URL(source);
            if (url.protocol !== 'https:' || !['www.youtube.com', 'www.youtube-nocookie.com'].includes(url.hostname)) return '';
            const id = url.pathname.match(/^\/embed\/([\w-]{11})$/)?.[1];
            return id ? 'https://i.ytimg.com/vi/' + id + '/hqdefault.jpg' : '';
        } catch (_) { return ''; }
    };

    // Các danh mục của website.
    V.DANH_MUC = [
        "Học tập",
        "Công nghệ",
        "Âm nhạc",
        "Game",
        "Du lịch",
        "Ẩm thực",
        "Giải trí",
        "Khoa học",
        "Thể thao",
        "Đời sống"
    ];

    V.duLieuMau = function () {

        // Tạo tài khoản mẫu.
        const account = (
            id,
            username,
            name,
            email,
            role = 'user',
            status = 'HOAT_DONG'
        ) => ({
            maNguoiDung: id,
            tenDangNhap: username,
            hoTen: name,
            email: email,
            matKhau: role === 'admin' ? 'Admin123' : 'Video123',
            anhDaiDien: '',
            vaiTro: role,
            trangThai: status
        });

        // Tạo kênh mẫu.
        const channel = (
            id,
            owner,
            name,
            description
        ) => ({
            maKenh: id,
            maNguoiDung: owner,
            tenKenh: name,
            anhDaiDien: '',
            moTa: description
        });

        // Tạo video YouTube.
        // youtubeId chỉ là mã video, không phải toàn bộ đường link.
        // Để title là '' để tự lấy tiêu đề từ YouTube.
        const movie = (
            id,
            title,
            youtubeId,
            cover = 'default',
            views = 0,
            category = 'Giải trí',
            channelId = 'K_PHIM',
            sourceChannel = '',
            sourceChannelUrl = ''
        ) => ({
            maVideo: id,
            maKenh: channelId,
            tieuDe: String(title || '').trim() || 'Video YouTube',
            tuDongTieuDe: !String(title || '').trim(),
            moTa: sourceChannel
                ? 'Nguồn YouTube: ' + sourceChannel + '\nKênh gốc: ' + sourceChannelUrl + '\nVideo được nhúng từ kênh gốc, không đăng tải lại.'
                : 'Video được phát trực tuyến từ YouTube ngay trên trình phát VideoShare.',
            kenhYouTube: sourceChannel,
            urlKenhYouTube: sourceChannelUrl,
            duongDanVideo:
                'https://www.youtube-nocookie.com/embed/' + youtubeId,
            anhThuNho: cover && cover !== 'default'
                ? 'assets/img/' + cover + '.svg'
                : V.anhBiaYouTube('https://www.youtube-nocookie.com/embed/' + youtubeId),
            danhMuc: category,
            loaiNguon: 'TRUC_TUYEN',
            kieuPhat: 'NHUNG',
            tenTepGoc: '',
            luotXem: views,
            ngayDang: '2026-10-25T08:00:00+07:00',
            trangThai: 'HIEN_THI'
        });

        const data = {
            version: 1,
            revision: 0,

            // 1. Người dùng.
            NguoiDung: [
                account(
                    'ND_ADMIN',
                    'admin',
                    'Quản trị viên',
                    'admin@example.com',
                    'admin'
                ),

                account(
                    'ND_VU',
                    'vudemo',
                    'Nguyễn Vũ',
                    'vu@example.com'
                ),

                account(
                    'ND_PHIM',
                    'phimmo',
                    'Thư viện video',
                    'phim@example.com'
                ),

                account(
                    'ND_MAU',
                    'videomau',
                    'Người dùng mẫu',
                    'mau@example.com'
                ),

                account(
                    'ND_KHOA',
                    'taikhoankhoa',
                    'Tài khoản thử',
                    'khoa@example.com',
                    'user',
                    'NGUNG_HOAT_DONG'
                )
            ],

            // 2. Kênh: mỗi tài khoản sở hữu một kênh.
            Kenh: [
                channel(
                    'K_ADMIN',
                    'ND_ADMIN',
                    'Kênh quản trị',
                    'Kênh của tài khoản quản trị.'
                ),

                channel(
                    'K_VU',
                    'ND_VU',
                    'Kênh của Nguyễn Vũ',
                    'Chia sẻ quá trình học HTML, CSS và JavaScript.'
                ),

                channel(
                    'K_PHIM',
                    'ND_PHIM',
                    'Thư viện video',
                    'Tổng hợp video được phát từ nguồn YouTube trực tuyến.'
                ),

                channel(
                    'K_MAU',
                    'ND_MAU',
                    'Kênh video mẫu',
                    'Kênh dùng để trải nghiệm các chức năng của website.'
                ),

                channel(
                    'K_KHOA',
                    'ND_KHOA',
                    'Kênh tài khoản thử',
                    ''
                )
            ],

            // 3. Video có sẵn: phát bằng link YouTube.
            Video: [
                movie("VD_VIET_01", "'I LOVE YOU' - Bùi Công Nam (Official Music Video)", "SEFIsuiDTm8", "default", 0, "Âm nhạc", "K_YT_BUICONGNAMOFFICIAL", "Bùi Công Nam", "https://www.youtube.com/@buicongnamofficial"),
                movie("VD_VIET_02", "BÙI CÔNG NAM | TẾT NÀY CON SẼ VỀ | OFFICIAL MUSIC VIDEO", "YGhE2HZ8g8M", "default", 0, "Âm nhạc", "K_YT_BUICONGNAMOFFICIAL", "Bùi Công Nam", "https://www.youtube.com/@buicongnamofficial"),
                movie("VD_VIET_03", "VỀ NHÀ LÀ CÓ TẾT | BÙI CÔNG NAM | OFFICIAL MV | NHẠC TẾT 2024", "lkJhFRFBPV8", "default", 0, "Âm nhạc", "K_YT_BUICONGNAMOFFICIAL", "Bùi Công Nam", "https://www.youtube.com/@buicongnamofficial"),
                movie("VD_VIET_04", "BÙI CÔNG NAM | TỰ GIÁC ĐI | OFFICIAL MUSIC VIDEO", "vSitw9vohEQ", "default", 0, "Âm nhạc", "K_YT_BUICONGNAMOFFICIAL", "Bùi Công Nam", "https://www.youtube.com/@buicongnamofficial"),
                movie("VD_VIET_05", "KẾT NỐI | BÙI CÔNG NAM x KIENLONGBANK | OFFICIAL MV", "aqf-xotYUos", "default", 0, "Âm nhạc", "K_YT_BUICONGNAMOFFICIAL", "Bùi Công Nam", "https://www.youtube.com/@buicongnamofficial"),
                movie("VD_VIET_06", "(Japanese Ramen Simulator #1) Tổ đội RF rủ nhau kinh doanh mì Ramen và loạt poster khó đỡ từ Độ Mixi", "pLoe9lDffHE", "default", 0, "Game", "K_YT_MIXIGAMING3CON", "MixiGaming", "https://www.youtube.com/@MixiGaming3con"),
                movie("VD_VIET_07", "(Goose Goose Duck #86) Chim ác là Mixi trổ tài phán đâu trúng đó và sự ra đời của tổ điều tra ma quỷ", "D5ye6FaNscY", "default", 0, "Game", "K_YT_MIXIGAMING3CON", "MixiGaming", "https://www.youtube.com/@MixiGaming3con"),
                movie("VD_VIET_08", "(Used Cars Simulator #1) Khởi đầu đầy gian nan tại tiệm gara cũ, Độ Mixi từng bước phục hồi kinh tế.", "RR0jS3rlpIE", "default", 0, "Game", "K_YT_MIXIGAMING3CON", "MixiGaming", "https://www.youtube.com/@MixiGaming3con"),
                movie("VD_VIET_09", "(PEAK #5) Độ Mixi cùng em ruột Nhạc Nguyễn gồng gánh bộ đôi 97 Nhism Ngoo và Khó Chánh lên đỉnh.", "-7OxLkZSAzs", "default", 0, "Game", "K_YT_MIXIGAMING3CON", "MixiGaming", "https://www.youtube.com/@MixiGaming3con"),
                movie("VD_VIET_10", "(How to Fish) Đội câu Refund rủ nhau ra đảo hoang và chiến thuật trick lỏ không bao giờ lỗi thời.", "WaSVEQsGpYk", "default", 0, "Game", "K_YT_MIXIGAMING3CON", "MixiGaming", "https://www.youtube.com/@MixiGaming3con"),
                movie("VD_VIET_11", "Thách Gì Làm Nấy 5: Mai Hoa hôn trai lạ!? Hải Triều mất thưởng Tết!!!", "HAp0huqPABM", "default", 0, "Giải trí", "K_YT_SCHANNELVN", "Schannel", "https://www.youtube.com/@schannelvn"),
                movie("VD_VIET_12", "TRUTH or DARE: Tân - Triều khoá môi | Vi thổ lộ tình cảm với Tân | Dư làm Hoa khóc!", "UL7odPT7fNw", "default", 0, "Giải trí", "K_YT_SCHANNELVN", "Schannel", "https://www.youtube.com/@schannelvn"),
                movie("VD_VIET_13", "Game Thử thách 5s: 5 giây là quá đủ để thấy được lòng người!!", "go_qqb9SJ-Q", "default", 0, "Giải trí", "K_YT_SCHANNELVN", "Schannel", "https://www.youtube.com/@schannelvn"),
                movie("VD_VIET_14", "THÁCH THỨC DANH HÀI: Chúng tôi “nhạt nhẽo” số 2 thì không ai dám nhận là số 1!! 🤣", "r5IQsTphIEI", "default", 0, "Giải trí", "K_YT_SCHANNELVN", "Schannel", "https://www.youtube.com/@schannelvn"),
                movie("VD_VIET_15", "THỬ THÁCH KHÓ ĐỠ : ĂN LIÊN TỤC 24H KHÔNG NGHỈ !", "gv25EaSyQf8", "default", 0, "Giải trí", "K_YT_SCHANNELVN", "Schannel", "https://www.youtube.com/@schannelvn"),
                movie("VD_VIET_16", "Chợ đêm Trung Quốc toàn đặc sản, khám phá phố biển Thanh Đảo Sơn Đông", "eWWkksk7kKU", "default", 0, "Du lịch", "K_YT_KHOAILANGTHANG", "Khoai Lang Thang", "https://www.youtube.com/@KhoaiLangThang"),
                movie("VD_VIET_17", "Ngày 3 ở Thuỵ Sĩ, Khoai lạc trôi khắp hồ \"lục bảo\" |Du lịch ẩm thực Châu Âu", "5yBPT0FfLOU", "default", 0, "Du lịch", "K_YT_KHOAILANGTHANG", "Khoai Lang Thang", "https://www.youtube.com/@KhoaiLangThang"),
                movie("VD_VIET_18", "Ký sự du lịch ẩm thực Thái Lan: Hải sản, đi câu đêm, đi biển ở Hua Hin", "Ils74EIIPf4", "default", 0, "Du lịch", "K_YT_KHOAILANGTHANG", "Khoai Lang Thang", "https://www.youtube.com/@KhoaiLangThang"),
                movie("VD_VIET_19", "Du lịch ẩm thực Trung Quốc: Khám phá Tế Nam - Sơn Đông", "ORC7rRqxugw", "default", 0, "Du lịch", "K_YT_KHOAILANGTHANG", "Khoai Lang Thang", "https://www.youtube.com/@KhoaiLangThang"),
                movie("VD_VIET_20", "\"Miền Tây\" Thái Lan: bí ẩn nơi biên giới Myanmar |Du lịch Kanchanaburi P2", "L4nwxxQ9K-4", "default", 0, "Du lịch", "K_YT_KHOAILANGTHANG", "Khoai Lang Thang", "https://www.youtube.com/@KhoaiLangThang"),
                movie("VD_VIET_21", "Nấu 3 Món Này Vừa Ngon - Đẹp Mâm Cơm - Nhanh Gọn Lại Bổ Dưỡng, Cơm Gia Đình Đãi Khách, Vanh Khuyen", "2op8L6MrNig", "default", 0, "Ẩm thực", "K_YT_V_C3_A0NHKHUY_C3_AANL_C3_AA", "Vành Khuyên Lê", "https://www.youtube.com/@V%C3%A0nhKhuy%C3%AAnL%C3%AA"),
                movie("VD_VIET_22", "Có Thịt Xay Làm Ngay Mâm Cơm 2 Món Rất Ngon, Thịt Viên Rim Nước Mắm Sả Ớt & Canh Vân Mây Vanh Khuyen", "bnEBxVg6uFI", "default", 0, "Ẩm thực", "K_YT_V_C3_A0NHKHUY_C3_AANL_C3_AA", "Vành Khuyên Lê", "https://www.youtube.com/@V%C3%A0nhKhuy%C3%AAnL%C3%AA"),
                movie("VD_VIET_23", "Đang Sốt Rần Rần Món Pizza Bánh Mì – Bí Quyết Nướng Bánh Không Bị Khô Cứng, Vỏ Giòn Rụm, Vanh Khuyen", "ggbgtA9uDZc", "default", 0, "Ẩm thực", "K_YT_V_C3_A0NHKHUY_C3_AANL_C3_AA", "Vành Khuyên Lê", "https://www.youtube.com/@V%C3%A0nhKhuy%C3%AAnL%C3%AA"),
                movie("VD_VIET_24", "Không Ngờ Chỉ 1 Hộp Cá Mòi Làm Ra Món Thịt Chưng Ngon Đến Vậy, Không Cần Mắm Vẫn Có Mắm Chưng", "UoDCZynqHvg", "default", 0, "Ẩm thực", "K_YT_V_C3_A0NHKHUY_C3_AANL_C3_AA", "Vành Khuyên Lê", "https://www.youtube.com/@V%C3%A0nhKhuy%C3%AAnL%C3%AA"),
                movie("VD_VIET_25", "Nấu 3 Món Ăn Ngon, Bí quyết giúp Thịt Nạc không bị cứng, Canh Súp, Trứng chiên Cần by Vanh Khuyen", "9IxeBx67Wvg", "default", 0, "Ẩm thực", "K_YT_V_C3_A0NHKHUY_C3_AANL_C3_AA", "Vành Khuyên Lê", "https://www.youtube.com/@V%C3%A0nhKhuy%C3%AAnL%C3%AA"),
                movie("VD_VIET_26", "Đánh giá AirPods 5: Bổ, Rẻ và Ngonnnnnnnn 👍🏻", "d1X7LgYpRds", "default", 0, "Công nghệ", "K_YT_REALVATVOSTUDIO", "Vật Vờ Studio", "https://www.youtube.com/@realvatvostudio"),
                movie("VD_VIET_27", "Lý do gì để team Vật Vờ Studio mua iPhone 18 Pro Max? Bản nào tối ưu nhất?", "N4lHy5dmP14", "default", 0, "Công nghệ", "K_YT_REALVATVOSTUDIO", "Vật Vờ Studio", "https://www.youtube.com/@realvatvostudio"),
                movie("VD_VIET_28", "Đánh giá iPhone Duo sau 48 giờ: Nhiều khác biệt cần làm quen lại!", "QFyfxwM8pNw", "default", 0, "Công nghệ", "K_YT_REALVATVOSTUDIO", "Vật Vờ Studio", "https://www.youtube.com/@realvatvostudio"),
                movie("VD_VIET_29", "Đánh giá tổng quan tất cả sản phẩm Apple: iPhone Duo, iPhone 18 Pro Max, AirPods 5 đều ngon?", "oi8I8EQ1ShQ", "default", 0, "Công nghệ", "K_YT_REALVATVOSTUDIO", "Vật Vờ Studio", "https://www.youtube.com/@realvatvostudio"),
                movie("VD_VIET_30", "Review iPhone 18 Pro và iPhone 18 Pro Max từ 6 người dùng của team Vật Vờ Studio", "9GaNsN8R2Yw", "default", 0, "Công nghệ", "K_YT_REALVATVOSTUDIO", "Vật Vờ Studio", "https://www.youtube.com/@realvatvostudio"),
                movie("VD_VIET_31", "Code Music Player Xịn Xò Từ A-Z | Thực hành JavaScript | Code trình phát nhạc", "vAecGPWxzFE", "default", 0, "Học tập", "K_YT_F8VNOFFICIAL", "F8 Official", "https://www.youtube.com/@F8VNOfficial"),
                movie("VD_VIET_32", "\"Bí Kíp\" Học Lập Trình Hiệu Quả", "hzg7gKJ-pZs", "default", 0, "Học tập", "K_YT_F8VNOFFICIAL", "F8 Official", "https://www.youtube.com/@F8VNOfficial"),
                movie("VD_VIET_33", "Chia sẻ kinh nghiệm ngành lập trình của F8 | Talk With Me | Lofi Chill", "VQWbE9cIbYM", "default", 0, "Học tập", "K_YT_F8VNOFFICIAL", "F8 Official", "https://www.youtube.com/@F8VNOfficial"),
                movie("VD_VIET_34", "F8 có gì mới trong lần trở lại này?", "WRfFhZqc5gk", "default", 0, "Học tập", "K_YT_F8VNOFFICIAL", "F8 Official", "https://www.youtube.com/@F8VNOfficial"),
                movie("VD_VIET_35", "1. Giới Thiệu khóa học C++ | Khóa học C++ miễn phí tại F8", "Da1tpV9TMU0", "default", 0, "Học tập", "K_YT_F8VNOFFICIAL", "F8 Official", "https://www.youtube.com/@F8VNOfficial"),
                movie("VD_VIET_36", "Hóa ra làm BOM nguyên tử không khó như tôi nghĩ", "Q8Mam2oMIyw", "default", 0, "Khoa học", "K_YT_KI_E1_BA_BENTH_E1_BB_A8CTH_C3_9AV_E1_BB_8AOFFICIAL_I8E", "KIẾN THỨC THÚ VỊ Official", "https://www.youtube.com/@KI%E1%BA%BENTH%E1%BB%A8CTH%C3%9AV%E1%BB%8AOfficial-i8e"),
                movie("VD_VIET_37", "Những Sự thật thú vị về Máu mà bạn chưa biết", "YzWbQQDyeS0", "default", 0, "Khoa học", "K_YT_KI_E1_BA_BENTH_E1_BB_A8CTH_C3_9AV_E1_BB_8AOFFICIAL_I8E", "KIẾN THỨC THÚ VỊ Official", "https://www.youtube.com/@KI%E1%BA%BENTH%E1%BB%A8CTH%C3%9AV%E1%BB%8AOfficial-i8e"),
                movie("VD_VIET_38", "Lần đầu tiên, khoa học tìm ra cách tạo ra vàng mà có lãi", "NVKcanLB7RY", "default", 0, "Khoa học", "K_YT_KI_E1_BA_BENTH_E1_BB_A8CTH_C3_9AV_E1_BB_8AOFFICIAL_I8E", "KIẾN THỨC THÚ VỊ Official", "https://www.youtube.com/@KI%E1%BA%BENTH%E1%BB%A8CTH%C3%9AV%E1%BB%8AOfficial-i8e"),
                movie("VD_VIET_39", "Ma có thật không? Phân tích theo Khoa Học", "MlxexHZ_7Jo", "default", 0, "Khoa học", "K_YT_KI_E1_BA_BENTH_E1_BB_A8CTH_C3_9AV_E1_BB_8AOFFICIAL_I8E", "KIẾN THỨC THÚ VỊ Official", "https://www.youtube.com/@KI%E1%BA%BENTH%E1%BB%A8CTH%C3%9AV%E1%BB%8AOfficial-i8e"),
                movie("VD_VIET_40", "Toàn bộ kiến thức về Sức khỏe bạn nên xem", "YsfozkETBc0", "default", 0, "Khoa học", "K_YT_KI_E1_BA_BENTH_E1_BB_A8CTH_C3_9AV_E1_BB_8AOFFICIAL_I8E", "KIẾN THỨC THÚ VỊ Official", "https://www.youtube.com/@KI%E1%BA%BENTH%E1%BB%A8CTH%C3%9AV%E1%BB%8AOfficial-i8e"),
                movie("VD_VIET_41", "THE LOCKER ROOM | “ÔNG GIÀ” MOURINHO ĐẲNG CẤP MÀ – VÀ EL CLASICO LẠI CÀNG HẤP DẪN HƠN", "vcXuf05De7o", "default", 0, "Thể thao", "K_YT_BLVANHQUAN68", "BLV Anh Quân", "https://www.youtube.com/@blvanhquan68"),
                movie("VD_VIET_42", "HARRY KANE GIÀNH QUẢ BÓNG VÀNG 2026 NGAY TRƯỚC MŨI MBAPPE VÀ YAMAL!!!", "HQr2ll9_I0Y", "default", 0, "Thể thao", "K_YT_BLVANHQUAN68", "BLV Anh Quân", "https://www.youtube.com/@blvanhquan68"),
                movie("VD_VIET_43", "CHIẾN THẮNG XỨNG ĐÁNG CHO HARRY KANE, MBAPPE NGẨNG CAO ĐẦU VÀ NỖI BUỒN CỦA LAMINE YAMAL", "kfbMi873NP0", "default", 0, "Thể thao", "K_YT_BLVANHQUAN68", "BLV Anh Quân", "https://www.youtube.com/@blvanhquan68"),
                movie("VD_VIET_44", "VÌ SAO QBV 2008 CỦA RONALDO ĐƯỢC BÌNH CHỌN LÀ VANG DANH SỐ 1 LỊCH SỬ? |Q&A HỎI ĐÁP CÙNG BLV ANH QUÂN", "47eZj9pwqOA", "default", 0, "Thể thao", "K_YT_BLVANHQUAN68", "BLV Anh Quân", "https://www.youtube.com/@blvanhquan68"),
                movie("VD_VIET_45", "MANCHESTER UNITED VÀ NỖI ĐAU CỦA NHỮNG NGƯỜI ĐÃ TRÓT YÊU MÀU ÁO ĐỎ", "jLhN-kc2aUM", "default", 0, "Thể thao", "K_YT_BLVANHQUAN68", "BLV Anh Quân", "https://www.youtube.com/@blvanhquan68"),
                movie("VD_VIET_46", "Choáng váng ở Dubai", "8Juf2WghQP0", "default", 0, "Đời sống", "K_YT_GIANG_C6_A0I", "Giang Ơi", "https://www.youtube.com/@Giang%C6%A0i"),
                movie("VD_VIET_47", "Làm mẹ là trải nghiệm khắc nghiệt nhất đời tôi 🧧 Nhà Có Tết 2026", "U79FTb7RAdI", "default", 0, "Đời sống", "K_YT_GIANG_C6_A0I", "Giang Ơi", "https://www.youtube.com/@Giang%C6%A0i"),
                movie("VD_VIET_48", "Ăn trưa & tán phét cùng mình", "Bm0Pn_VvEFQ", "default", 0, "Đời sống", "K_YT_GIANG_C6_A0I", "Giang Ơi", "https://www.youtube.com/@Giang%C6%A0i"),
                movie("VD_VIET_49", "Một ngày (thực sự) của một vlogger", "y82jMyEI3mE", "default", 0, "Đời sống", "K_YT_GIANG_C6_A0I", "Giang Ơi", "https://www.youtube.com/@Giang%C6%A0i"),
                movie("VD_VIET_50", "Một ngày KHÔNG làm mẹ", "kdh_zDviryw", "default", 0, "Đời sống", "K_YT_GIANG_C6_A0I", "Giang Ơi", "https://www.youtube.com/@Giang%C6%A0i")
            ],

            // 4. Đăng ký kênh mẫu.
            DangKyKenh: [
                {
                    maDangKy: 'DK1',
                    maNguoiDung: 'ND_VU',
                    maKenh: 'K_PHIM',
                    ngayDangKy: '2026-10-25T08:00:00+07:00'
                },

                {
                    maDangKy: 'DK2',
                    maNguoiDung: 'ND_MAU',
                    maKenh: 'K_PHIM',
                    ngayDangKy: '2026-10-25T09:00:00+07:00'
                }
            ],

            // 5. Bình luận được tạo khi người dùng bình luận.
            BinhLuan: [],

            // 6. Lưu Like, Dislike và Xem sau.
            TuongTac: [],

            // 7. Lịch sử được tạo khi người dùng mở video.
            LichSuXem: []
        };

        // Mỗi nguồn YouTube có tài khoản mẫu và trang kênh riêng.
        for (const video of data.Video) {
            if (!video.kenhYouTube || !video.maKenh.startsWith('K_YT_')) continue;
            if (data.Kenh.some(item => item.maKenh === video.maKenh)) continue;
            const ownerId = 'ND_' + video.maKenh.slice(2);
            const username = video.maKenh.toLowerCase().slice(0, 25) + '_demo';
            data.NguoiDung.push(account(ownerId, username, video.kenhYouTube, username + '@example.com'));
            data.Kenh.push(channel(video.maKenh, ownerId, video.kenhYouTube,
                'Kênh mẫu chủ đề ' + video.danhMuc + '.\nNguồn YouTube: ' + video.urlKenhYouTube));
        }
        return data;
    };

})(window);

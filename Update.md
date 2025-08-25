### Tốt, giờ tôi cần nâng cấp ứng dụng, cụ thể như sau: Tôi cần thêm 1 view là 'Trả hồ sơ' vào bên phải view 'Phân tích & Dự báo'. Dữ liệu tôi đã push từ google sheet qua supabase với table trên Supabase tên là 'tra_ho_so' với các cột là 
"[
  {
    "column_name": "ten nhan vien",
    "data_type": "text",
    "character_maximum_length": null,
    "is_nullable": "YES",
    "column_default": null,
    "ordinal_position": 1
  },
  {
    "column_name": "ten cong ty",
    "data_type": "text",
    "character_maximum_length": null,
    "is_nullable": "YES",
    "column_default": null,
    "ordinal_position": 2
  },
  {
    "column_name": "so nguoi kham",
    "data_type": "bigint",
    "character_maximum_length": null,
    "is_nullable": "YES",
    "column_default": null,
    "ordinal_position": 3
  },
  {
    "column_name": "ngay ket thuc kham",
    "data_type": "date",
    "character_maximum_length": null,
    "is_nullable": "YES",
    "column_default": null,
    "ordinal_position": 4
  },
  {
    "column_name": "ngay cuoi tra ho so",
    "data_type": "date",
    "character_maximum_length": null,
    "is_nullable": "YES",
    "column_default": null,
    "ordinal_position": 5
  },
  {
    "column_name": "trang thai kham",
    "data_type": "text",
    "character_maximum_length": null,
    "is_nullable": "YES",
    "column_default": null,
    "ordinal_position": 6
  },
  {
    "column_name": "gold",
    "data_type": "text",
    "character_maximum_length": null,
    "is_nullable": "YES",
    "column_default": null,
    "ordinal_position": 7
  },
  {
    "column_name": "ngay ket thuc kham thuc te",
    "data_type": "date",
    "character_maximum_length": null,
    "is_nullable": "YES",
    "column_default": null,
    "ordinal_position": 8
  },
  {
    "column_name": "ghi chu",
    "data_type": "text",
    "character_maximum_length": null,
    "is_nullable": "YES",
    "column_default": null,
    "ordinal_position": 9
  },
  {
    "column_name": "tra ho so",
    "data_type": "text",
    "character_maximum_length": null,
    "is_nullable": "YES",
    "column_default": null,
    "ordinal_position": 10
  },
  {
    "column_name": "ngay tra ho so",
    "data_type": "date",
    "character_maximum_length": null,
    "is_nullable": "YES",
    "column_default": null,
    "ordinal_position": 11
  },
  {
    "column_name": "ngay gui bang ke",
    "data_type": "date",
    "character_maximum_length": null,
    "is_nullable": "YES",
    "column_default": null,
    "ordinal_position": 12
  },
  {
    "column_name": "ID",
    "data_type": "text",
    "character_maximum_length": null,
    "is_nullable": "NO",
    "column_default": null,
    "ordinal_position": 13
  }
]"

và 5 dòng dữ liệu đầu tiên là:
"[
  {
    "ten nhan vien": "Lê Thị Thúy Hồng",
    "ten cong ty": "CÔNG TY TRÁCH NHIỆM HỮU HẠN AIMNEXT VIỆT NAM",
    "so nguoi kham": 7,
    "ngay ket thuc kham": "2024-12-28",
    "ngay cuoi tra ho so": "2025-01-07",
    "trang thai kham": "Đã khám xong",
    "gold": "",
    "ngay ket thuc kham thuc te": null,
    "ghi chu": "",
    "tra ho so": "Đã trả",
    "ngay tra ho so": null,
    "ngay gui bang ke": null,
    "ID": "NmYqk0Eyt6"
  },
  {
    "ten nhan vien": "Lê Thị Thúy Hồng",
    "ten cong ty": "CÔNG TY TNHH XÂY DỰNG TÀI VIỆT TÍN",
    "so nguoi kham": 31,
    "ngay ket thuc kham": "2024-12-31",
    "ngay cuoi tra ho so": "2025-01-10",
    "trang thai kham": "Đã khám xong",
    "gold": "",
    "ngay ket thuc kham thuc te": null,
    "ghi chu": "",
    "tra ho so": "Đã trả",
    "ngay tra ho so": null,
    "ngay gui bang ke": null,
    "ID": "q0ygXB87N7"
  },
  {
    "ten nhan vien": "Lê Thị Thúy Hồng",
    "ten cong ty": "CÔNG TY TNHH XÂY DỰNG TÀI VIỆT TÍN",
    "so nguoi kham": 4,
    "ngay ket thuc kham": "2024-12-31",
    "ngay cuoi tra ho so": "2025-01-10",
    "trang thai kham": "Đã khám xong",
    "gold": "",
    "ngay ket thuc kham thuc te": null,
    "ghi chu": "",
    "tra ho so": "Đã trả",
    "ngay tra ho so": null,
    "ngay gui bang ke": null,
    "ID": "PqgX95XUmR"
  },
  {
    "ten nhan vien": "Lê Thị Thúy Hồng",
    "ten cong ty": "CÔNG TY TNHH MI LOGIX",
    "so nguoi kham": 7,
    "ngay ket thuc kham": "2024-12-28",
    "ngay cuoi tra ho so": "2025-01-07",
    "trang thai kham": "Đã khám xong",
    "gold": "",
    "ngay ket thuc kham thuc te": null,
    "ghi chu": "",
    "tra ho so": "Đã trả",
    "ngay tra ho so": null,
    "ngay gui bang ke": null,
    "ID": "RaFMThGxU2"
  },
  {
    "ten nhan vien": "Lê Thị Thúy Hồng",
    "ten cong ty": "CÔNG TY TNHH EUREKA BLUE SKY (VIETNAM)",
    "so nguoi kham": 11,
    "ngay ket thuc kham": "2024-12-27",
    "ngay cuoi tra ho so": "2025-01-06",
    "trang thai kham": "Đã khám xong",
    "gold": "",
    "ngay ket thuc kham thuc te": null,
    "ghi chu": "",
    "tra ho so": "Đã trả",
    "ngay tra ho so": null,
    "ngay gui bang ke": null,
    "ID": "pjOkInICEV"
  }
]"

### Giờ bạn đã có ngữ cảnh cần thiết
- Tôi muốn hiển thị để ngưỡi xem có thể xem được tiến độ trả hồ sơ của các công ty đã khám xong nhưng trạng thái là chưa trả, hiện tại tôi có ứng dụng appsheet để theo dõi như hình ảnh (D:\pcloud\code\apps scripts\apps script hmsg chc ksk lich kham v1\file\image.png). Tuy nhiên tôi muốn cho những người không cần tài khoản appsheet cũng có thể xem được trên dashboard của chúng ta luôn. 
- Trên appsheet, tôi có thêm các cột ảo là 'so ngay tre' để tính số ngày trễ trả hồ sơ (như trên hình ảnh tên là 'TRE') với công thức appsheet 'IF(
  AND(
    [trang thai kham] = "Đã khám xong",
    [tra ho so] = "Đã trả"
  ),
  "OK",
  IF(
    OR(
      ISBLANK(
        IF(
          ISBLANK([ngay ket thuc kham thuc te]),
          [ngay cuoi tra ho so],
          ([ngay ket thuc kham thuc te] + 10)
        )
      ),
      IF(
        ISBLANK([ngay ket thuc kham thuc te]),
        [ngay cuoi tra ho so],
        ([ngay ket thuc kham thuc te] + 10)
      ) > TODAY()
    ),
    "",
    TEXT(
      ROUND(
        HOUR(
          TODAY() - IF(
            ISBLANK([ngay ket thuc kham thuc te]),
            [ngay cuoi tra ho so],
            ([ngay ket thuc kham thuc te] + 10)
          )
        ) / 24
      )
    )
  )
)'
và cột ưu tiên 'uu tien' với công thức appsheet 'IF(
  ISNOTBLANK([gold]),
  "X",
  IF(
    [so ngay tre] = "OK",
    "X",
    IF(
      ISBLANK([so ngay tre]),
      "Ưu tiên 3",
      IF(
        AND(
          NOT(CONTAINS([so ngay tre], "O")),
          ISNOTBLANK([so ngay tre])
        ),
        IF(
          NUMBER([so ngay tre]) >= 5,
          "Ưu tiên 1",
          "Ưu tiên 2"
        ),
        "Ưu tiên 3"
      )
    )
  )
)' và cột 'tra ho so not null' (trên hình ảnh tên là 'tra ho so' với công thức 'IF(
  ISNOTBLANK([gold]),
  "Đã trả",
  IF(
    ISBLANK([tra ho so]),
    "Chưa trả",
    [tra ho so]
  )
)'
3. Bạn nghĩ giao diện nên như thế nào, nên dạng bảng để đồng nhất như view appsheet, hay kiểu khác để đẹp với tinh tế hơn

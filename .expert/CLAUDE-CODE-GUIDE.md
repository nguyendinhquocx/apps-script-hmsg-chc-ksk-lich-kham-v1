# 🚀 Hướng dẫn Claude Code từ A-Z


## ƯU TIÊN NGÔN NGỮ TIẾNG VIỆT - MANDATORY

**LUÔN LUÔN ƯU TIÊN TIẾNG VIỆT KHI TRAO ĐỔI VỚI NGƯỜI DÙNG**

### NGUYÊN TẮC NGÔN NGỮ CỐT LÕI:
1. **Tiếng Việt là ngôn ngữ chính**: 90% nội dung phải bằng tiếng Việt
2. **Tiếng Anh chỉ cho thuật ngữ kỹ thuật**: Technical terms không có từ Việt phù hợp
3. **Giải thích bằng tiếng Việt**: Mọi khái niệm, logic, reasoning đều dùng tiếng Việt
4. **KHÔNG dùng emoji/icons**: Trừ khi người dùng yêu cầu cụ thể
5. **Format clean và professional**: Tập trung vào nội dung, không decoration

### CẤU TRÚC TRẢ LỜI CHUẨN:
```
[Chuyên môn] Expert - Chào bạn!

[Phân tích vấn đề bằng tiếng Việt]

**Đánh giá:**
- [Điểm mạnh - tiếng Việt]  
- [Vấn đề cần cải thiện - tiếng Việt]

**Gợi ý giải pháp:**
1. [Bước 1 - tiếng Việt với technical terms cần thiết]
2. [Bước 2 - tiếng Việt với code examples]

**Lưu ý quan trọng:**
[Tips và best practices bằng tiếng Việt]

Bạn có muốn tôi detail thêm phần nào không?
```


## 📚 Mục lục
1. [Khái niệm cơ bản](#khái-niệm-cơ-bản)
2. [15+ Tools của Claude Code](#tools-của-claude-code)
3. [So sánh với Cursor/Copilot](#so-sánh-với-cursorccopilot)
4. [Các lệnh thường dùng](#các-lệnh-thường-dùng)
5. [Workflows thực tế](#workflows-thực-tế)
6. [Tips & Tricks](#tips--tricks)

---

## 🎯 Khái niệm cơ bản

### Claude Code là gì?
- **CLI tool chính thức** từ Anthropic
- **Truy cập trực tiếp** model Claude Sonnet 4
- **Terminal-based**: Chạy qua command line
- **Tích hợp sâu**: VS Code, Git, system tools

### Sự khác biệt với Cursor/Copilot
```
Cursor/Copilot:        Claude Code:
┌─────────────────┐    ┌─────────────────┐
│   Giao diện     │    │   Command Line  │
│   Visual UI     │    │   Text-based    │
│   Point & Click │    │   Type commands │
│   Limited Tools │    │   15+ Tools     │
└─────────────────┘    └─────────────────┘
```

---

## 🛠 Tools của Claude Code

### **1. File Operations**
#### **Read** - Đọc file
```bash
# Cách sử dụng trong conversation:
"Đọc file package.json"
"Xem nội dung src/index.js"
"Đọc 50 dòng đầu của file lớn"
```

#### **Write** - Tạo file mới
```bash
# Ví dụ:
"Tạo file README.md với nội dung..."
"Viết file config.json"
```

#### **Edit** - Chỉnh sửa file
```bash
# Thay thế chính xác:
"Thay đổi dòng 15 trong index.js từ 'const' thành 'let'"
"Sửa function getName() trong utils.js"
```

#### **MultiEdit** - Sửa nhiều chỗ cùng lúc
```bash
# Ví dụ:
"Thay tất cả 'var' thành 'const' và thêm semicolon cuối dòng"
```

### **2. Search & Discovery**
#### **Glob** - Tìm file theo pattern
```bash
# Tìm tất cả file JS:
"Tìm tất cả file *.js trong project"
"Liệt kê file *.json trong thư mục config"
```

#### **Grep** - Tìm kiếm trong nội dung
```bash
# Tìm code chứa keyword:
"Tìm tất cả function có tên 'handleClick'"
"Tìm file nào import React"
"Tìm TODO comments trong project"
```

#### **LS** - Liệt kê thư mục
```bash
# Xem cấu trúc project:
"Xem thư mục src/"
"Liệt kê tất cả file trong root"
```

### **3. System Operations**
#### **Bash** - Chạy lệnh terminal
```bash
# Chạy commands:
"Chạy npm install"
"Build project với npm run build"
"Chạy tests"
"Git status và git commit"
```

#### **BashOutput** - Xem output của lệnh chạy background
```bash
# Monitor long-running processes:
"Xem output của lệnh npm run dev đang chạy"
```

#### **KillBash** - Dừng process
```bash
"Dừng lệnh đang chạy"
```

### **4. Web & Network**
#### **WebFetch** - Lấy nội dung web
```bash
# Fetch và phân tích:
"Lấy nội dung từ https://api.github.com/user"
"Đọc documentation từ URL"
```

#### **WebSearch** - Tìm kiếm web
```bash
# Search for info:
"Tìm kiếm cách sử dụng React hooks mới nhất"
"Search best practices cho TypeScript"
```

### **5. IDE Integration**
#### **mcp__ide__getDiagnostics** - Xem lỗi VS Code
```bash
"Xem lỗi TypeScript trong project"
"Check syntax errors"
```

#### **mcp__ide__executeCode** - Chạy code trong Jupyter
```bash
"Chạy Python code này trong kernel"
```

### **6. Task Management**
#### **TodoWrite** - Quản lý tasks
```bash
"Tạo todo list cho feature mới"
"Cập nhật task đã hoàn thành"
```

#### **Task** - Chạy specialized agents
```bash
# Ví dụ với general-purpose agent:
"Dùng agent để tìm và phân tích tất cả API endpoints trong project"
```

### **7. Special Operations**
#### **ExitPlanMode** - Thoát chế độ planning
#### **NotebookEdit** - Chỉnh sửa Jupyter notebooks

---

## 🔄 So sánh với Cursor/Copilot

| Tính năng | Cursor | Copilot | Claude Code |
|-----------|---------|---------|-------------|
| **File Operations** | ✅ GUI | ✅ GUI | ✅ Command |
| **Search trong Code** | ✅ Visual | ✅ Basic | ✅ Grep/Glob |
| **Run Commands** | ✅ Terminal panel | ❌ Limited | ✅ Bash tool |
| **Web Integration** | ❌ No | ❌ No | ✅ WebFetch |
| **Task Management** | ❌ No | ❌ No | ✅ TodoWrite |
| **Specialized Agents** | ❌ No | ❌ No | ✅ Task tool |
| **Speed** | 🐌 Slow | 🐌 API delays | ⚡ Direct |

---

## 📝 Các lệnh thường dùng

### **Bắt đầu project mới**
```
1. "Tạo structure cho React TypeScript project"
2. "Viết package.json với dependencies cơ bản"
3. "Tạo tsconfig.json và webpack config"
4. "Set up ESLint và Prettier"
```

### **Debug và fix lỗi**
```
1. "Tìm tất cả console.log trong project"
2. "Xem lỗi TypeScript hiện tại"
3. "Chạy linter và fix các warning"
4. "Run tests và analyze failures"
```

### **Code review và refactor**
```
1. "Tìm duplicate code trong project"
2. "Phân tích performance bottlenecks"
3. "Optimize imports và remove unused code"
4. "Convert JS sang TypeScript"
```

### **Deploy và build**
```
1. "Build production với error checking"
2. "Run security audit"
3. "Generate build report"
4. "Create deployment checklist"
```

---

## 💡 Workflows thực tế

### **Workflow 1: Fix Bug**
```
Claude: "Tôi gặp lỗi 'Cannot read property of undefined'"

1. "Grep tìm lỗi này trong logs"
2. "Đọc file có vấn đề"  
3. "Analyze stack trace"
4. "Fix và test"
5. "Commit changes"
```

### **Workflow 2: Add Feature**
```
Claude: "Thêm dark mode toggle"

1. "TodoWrite: Plan implementation"
2. "Tạo component DarkModeToggle"
3. "Add CSS variables cho themes"
4. "Update context và hooks"
5. "Test và commit"
```

### **Workflow 3: Code Review**
```
Claude: "Review code trước khi merge"

1. "Grep kiểm tra TODO comments"
2. "Run linter và tests"
3. "Check security vulnerabilities"
4. "Analyze bundle size impact"
5. "Generate review summary"
```

---

## 🎯 Tips & Tricks

### **Tip 1: Kết hợp tools**
```
"Grep tìm function handleSubmit, sau đó Edit để optimize performance"
```

### **Tip 2: Use CLAUDE.md**
```
Claude tự động đọc CLAUDE.md để hiểu project context
→ Luôn cập nhật file này!
```

### **Tip 3: Batch operations**
```
"Tìm tất cả .js files, convert sang TypeScript, và update imports"
```

### **Tip 4: Monitoring**
```
"Chạy dev server background, monitor output và auto-restart on errors"
```

### **Tip 5: Documentation**
```
"WebFetch latest React docs, then generate component templates"
```

---

## 🚨 Lỗi thường gặp và cách fix

### **"File not found"**
```bash
# Sai:
"Đọc file index.js"

# Đúng: 
"LS xem thư mục hiện tại trước, sau đó đọc src/index.js"
```

### **"Permission denied"**
```bash
# Sai:
"Tạo file trong /etc/"

# Đúng:
"Tạo file trong project directory"
```

### **"Command failed"**
```bash
# Check trước:
"Bash: kiểm tra node version"
"Bash: npm --version"
```

---

## 📋 Checklist chuyển từ Cursor/Copilot

- [ ] **Học commands**: Thay vì click → type commands
- [ ] **Practice Grep**: Thay search UI → grep patterns  
- [ ] **Use Bash tool**: Thay terminal panel → bash commands
- [ ] **TodoWrite**: Thay manual tracking → todo management
- [ ] **CLAUDE.md**: Maintain project context
- [ ] **Combine tools**: Grep + Edit + Bash workflows

---

## 🎓 Bài tập thực hành

### **Level 1: Cơ bản**
1. "LS xem project structure"
2. "Read package.json" 
3. "Grep tìm 'import React'"

### **Level 2: Trung bình**
1. "Tạo component Button với TypeScript"
2. "Bash: run tests và analyze results"
3. "Edit: fix lỗi trong test files"

### **Level 3: Nâng cao**  
1. "Task: Use agent để analyze performance bottlenecks"
2. "Multi-step: Grep → Edit → Bash → Commit workflow"
3. "WebFetch docs → Generate code → Test → Deploy"

---

## 📞 Khi nào cần help?

```
"Explain tool X"           → Giải thích tool cụ thể
"How to do Y?"             → Workflow cho task Y  
"Best practice for Z?"     → Conventions và tips
"Debug this error"         → Troubleshooting
```

---

**🎯 Kết luận**: Claude Code mạnh hơn Cursor/Copilot ở tools ecosystem và direct access. Đổi lại phải học command-based workflow thay vì GUI. Nhưng sau khi quen, productivity sẽ tăng đáng kể!

**💡 Next steps**: Thực hành với project hiện tại, dần dần quen với command style! 🚀
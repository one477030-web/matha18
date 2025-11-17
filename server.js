require("dotenv").config();
const express = require("express");
const fetch = require("node-fetch");
const bodyParser = require("body-parser");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;


app.use(express.static(__dirname));
app.use(bodyParser.json());

// HuggingFace Router (OpenAI format)
const HF_API_URL = "https://router.huggingface.co/v1/chat/completions";
const MODEL = "Qwen/Qwen2.5-7B-Instruct";
const HF_TOKEN = process.env.HF_TOKEN;


console.log("🔥 TOKEN = ", HF_TOKEN);


app.post("/ask", async (req, res) => {
  try {
    const { question, role } = req.body;

    // Chặn lỗi undefined
    if (!question || typeof question !== "string") {
      return res.json({ answer: "Câu hỏi không hợp lệ." });
    }

    const systemPrompt =
  role === "teacher"
    ? `Bạn là trợ lý toán học cho giáo viên Việt Nam.

    - Trả lời bằng tiếng Việt.
    - Giải theo từng bước rõ ràng, có đánh số 1), 2), 3) hoặc tương tự.
    - KHÔNG dùng LaTeX, KHÔNG dùng các ký hiệu như \\( \\), \\[ \\], hoặc dấu $.
    - Khi viết công thức, dùng văn bản thuần: ví dụ "V = pi * r^2 * h".
    - Nếu câu hỏi không rõ ràng, hãy hỏi lại để làm rõ.`
        : `Bạn là trợ lý toán học cho học sinh Việt Nam.

    - Trả lời bằng tiếng Việt, thân thiện, dễ hiểu.
    - Luôn giải từng bước, từ đơn giản đến khó.
    - KHÔNG dùng LaTeX, KHÔNG dùng mã Markdown công thức.
    - Công thức phải ở dạng văn bản thuần: "a^2 + b^2 = c^2".
    - Luôn giải thích ý nghĩa trước khi tính.`;


    const body = {
      model: MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: question }
      ],
      temperature: 0.2,
      max_tokens: 300
    };

    const hfRes = await fetch(HF_API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${HF_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });

    const data = await hfRes.json();

    console.log("🔥 HF RESPONSE:", data);

    // Đọc output đúng chuẩn OpenAI
    const reply =
      data?.choices?.[0]?.message?.content ||
      data?.error ||
      "Không rõ.";

    return res.json({ answer: reply });
  } catch (err) {
    console.error("🔥 SERVER ERROR:", err);
    return res.json({ answer: "Lỗi server." });
  }
});

// route hiển thị web
app.get("/qanda.html", (req, res) => {
  res.sendFile(path.join(__dirname, "qanda.html"));
});

app.listen(PORT, () => {
  console.log(`🚀 Server chạy tại: http://localhost:${PORT}/qanda.html`);

});





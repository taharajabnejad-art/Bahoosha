import express from "express";
import cors from "cors";
import multer from "multer";
import fs from "fs";
import OpenAI from "openai";

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// تنظیم multer برای آپلود تصویر
const upload = multer({ dest: "uploads/" });

// ایجاد کلاینت OpenAI با کلید API امن
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// روت دریافت متن و تصویر
app.post("/chat", upload.single("image"), async (req, res) => {
  try {
    const userText = req.body.message || "";
    let imageBase64 = null;

    if (req.file) {
      const imageData = fs.readFileSync(req.file.path);
      imageBase64 = imageData.toString("base64");
      fs.unlinkSync(req.file.path); // حذف فایل پس از خواندن
    }

    // ارسال پیام و تصویر به Responses API
    const response = await client.responses.create({
      model: "gpt-5.1",
      input: [
        {
          role: "user",
          content: [
            { type: "text", text: userText },
            imageBase64 ? { type: "input_image", image: imageBase64 } : null
          ].filter(Boolean)
        }
      ]
    });

    res.json({ reply: response.output_text });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

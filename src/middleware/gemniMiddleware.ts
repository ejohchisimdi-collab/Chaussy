import { GoogleGenerativeAI } from "@google/generative-ai"
import pdfParse from "pdf-parse"
import { Request, Response } from "express"
import { BadRequestException } from "../middleware/exceptions"

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" })

export const extractFieldsFromPdf = async (fileBuffer: Buffer) => {
  const pdfData = await pdfParse(fileBuffer)
  const rawText = pdfData.text

  const prompt = `You are a data extraction assistant. Extract the following fields from the text below and return ONLY a valid JSON object. Do not include explanations or markdown.

Fields to extract:
- providerName: string, required
- startDate: date in ISO format, optional
- expiryDate: date in ISO format, required (if not specified, calculate based on purchase/issuance date and warranty period)
- coverageNotes: string, optional

Text:
${rawText}
`

  const result = await model.generateContent(prompt)
  const responseText = result.response.text()

  const clean = responseText.replace(/```json|```/g, "").trim()
  return JSON.parse(clean)
}


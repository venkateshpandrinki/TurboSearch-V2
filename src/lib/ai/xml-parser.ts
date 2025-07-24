// src/lib/ai/xml-parser.ts
import { z, ZodObject, ZodSchema, ZodTypeAny } from 'zod'

export interface ToolCall {
  tool: string
  parameters: Record<string, any>
}

export function parseToolCallXml(xmlString: string, schema: ZodObject<any>): ToolCall | null {
  try {
    // Clean the XML string
    const cleanXml = xmlString
      .replace(/^[^]*<tool_call>/, '') // Remove everything before first </tool_call>
      .replace(/<\/tool_call>[^]*$/, '') // Remove everything after last </tool_call>
      .trim()

    if (!cleanXml) return null

    // Extract tool name
    const toolMatch = cleanXml.match(/<tool>([^<]*)<\/tool>/i)
    const tool = toolMatch ? toolMatch[1].trim() : ''

    if (!tool) return null

    // Extract parameters
    const parameters: Record<string, any> = {}
    
    // Get the parameters section
    const paramsMatch = cleanXml.match(/<parameters>([\s\S]*?)<\/parameters>/i)
    if (paramsMatch) {
      const paramsContent = paramsMatch[1]
      
      // Extract each parameter
      const schemaShape = schema.shape
      Object.keys(schemaShape).forEach(key => {
        const regex = new RegExp(`<${key}>([^<]*)<\/${key}>`, 'i')
        const match = paramsContent.match(regex)
        if (match) {
          const value = match[1].trim()
          
          // Try to parse as appropriate type
          const fieldSchema = schemaShape[key]
          if (fieldSchema instanceof z.ZodNumber) {
            const numValue = Number(value)
            parameters[key] = isNaN(numValue) ? value : numValue
          } else if (fieldSchema instanceof z.ZodArray) {
            // Handle arrays (like include_domains)
            parameters[key] = value ? value.split(',').map(s => s.trim()) : []
          } else {
            parameters[key] = value
          }
        }
      })
    }

    return { tool, parameters }
  } catch (error) {
    console.error('Error parsing tool call XML:', error)
    return null
  }
}
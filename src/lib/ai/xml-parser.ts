// src/lib/ai/xml-parser.ts (corrected)
import { z, ZodObject } from 'zod'
import { toolSchemas } from '@/lib/search/search-schema'

export interface ToolCall {
  tool: string
  parameters: Record<string, any>
}

export function parseToolCallXml(xmlString: string): ToolCall | null {
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

    // Extract parameters based on tool type
    const parameters: Record<string, any> = {}
    
    // Get the parameters section
    const paramsMatch = cleanXml.match(/<parameters>([\s\S]*?)<\/parameters>/i)
    if (paramsMatch) {
      const paramsContent = paramsMatch[1]
      
      // Get the appropriate schema for this tool
      const schema = toolSchemas[tool as keyof typeof toolSchemas]
      if (schema) {
        // Add null check for schema
        const schemaShape = schema.shape as Record<string, z.ZodTypeAny>
        if (schemaShape) {
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
              } else if (fieldSchema instanceof z.ZodString && key === 'url') {
                // Special handling for URLs to ensure they're valid
                try {
                  new URL(value)
                  parameters[key] = value
                } catch {
                  parameters[key] = value
                }
              } else {
                parameters[key] = value
              }
            }
          })
        }
      } else {
        console.log(`No schema found for tool: ${tool}`)
      }
    }

    return { tool, parameters }
  } catch (error) {
    console.error('Error parsing tool call XML:', error)
    return null
  }
}
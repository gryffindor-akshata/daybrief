export interface GoogleDoc {
  id: string
  title: string
  content: string
  url: string
}

export interface DocumentAttachment {
  id: string
  title: string
  url: string
  type: 'google_doc' | 'google_sheet' | 'pdf' | 'other'
}

// Google Docs API response types
interface GoogleDocsContent {
  paragraph?: {
    elements?: Array<{
      textRun?: {
        content?: string
      }
    }>
  }
  table?: {
    tableRows?: Array<{
      tableCells?: Array<{
        content?: GoogleDocsContent[]
      }>
    }>
  }
}

/**
 * Extract Google Drive document links from meeting description and attachments
 */
export function extractDocumentLinks(
  description?: string, 
  calendarAttachments?: { fileId: string; title: string; mimeType: string; fileUrl: string }[]
): DocumentAttachment[] {
  const links: DocumentAttachment[] = []
  
  // First, process calendar attachments (more reliable than parsing URLs)
  if (calendarAttachments) {
    console.log('Processing calendar attachments:', calendarAttachments.length)
    for (const attachment of calendarAttachments) {
      console.log(`Attachment: ${attachment.title}, mimeType: ${attachment.mimeType}, fileId: ${attachment.fileId}`)
      // Check if it's a Google Doc/Sheet/Drive file
      if (attachment.mimeType === 'application/vnd.google-apps.document') {
        console.log(`Found Google Doc: ${attachment.title}`)
        links.push({
          id: attachment.fileId,
          title: attachment.title,
          url: attachment.fileUrl,
          type: 'google_doc',
        })
      } else if (attachment.mimeType === 'application/vnd.google-apps.spreadsheet') {
        links.push({
          id: attachment.fileId,
          title: attachment.title,
          url: attachment.fileUrl,
          type: 'google_sheet',
        })
      } else if (attachment.fileUrl.includes('drive.google.com')) {
        links.push({
          id: attachment.fileId,
          title: attachment.title,
          url: attachment.fileUrl,
          type: 'other',
        })
      }
    }
  }
  
  // Then, also check description for any additional links
  if (!description) return links

  // Regex patterns for Google Drive links
  const patterns = {
    docs: /https:\/\/docs\.google\.com\/document\/d\/([a-zA-Z0-9-_]+)/g,
    sheets: /https:\/\/docs\.google\.com\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/g,
    drive: /https:\/\/drive\.google\.com\/file\/d\/([a-zA-Z0-9-_]+)/g,
  }

  // Extract Google Docs links
  let match
  while ((match = patterns.docs.exec(description)) !== null) {
    const docId = match[1]
    links.push({
      id: docId,
      title: `Document ${docId}`,
      url: match[0],
      type: 'google_doc',
    })
  }

  // Extract Google Sheets links
  while ((match = patterns.sheets.exec(description)) !== null) {
    const sheetId = match[1]
    links.push({
      id: sheetId,
      title: `Spreadsheet ${sheetId}`,
      url: match[0],
      type: 'google_sheet',
    })
  }

  // Extract Drive file links
  while ((match = patterns.drive.exec(description)) !== null) {
    const fileId = match[1]
    links.push({
      id: fileId,
      title: `File ${fileId}`,
      url: match[0],
      type: 'other',
    })
  }

  return links
}

/**
 * Fetch Google Doc content using the Docs API
 */
export async function fetchGoogleDocContent(
  accessToken: string,
  documentId: string
): Promise<GoogleDoc | null> {
  try {
    // First, get document metadata
    const metaResponse = await fetch(
      `https://www.googleapis.com/drive/v3/files/${documentId}?fields=id,name,webViewLink`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    )

    if (!metaResponse.ok) {
      console.error(`Drive API error: ${metaResponse.status}`)
      return null
    }

    const metadata = await metaResponse.json()

    // Then, get document content
    const contentResponse = await fetch(
      `https://docs.googleapis.com/v1/documents/${documentId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    )

    if (!contentResponse.ok) {
      console.error(`Docs API error: ${contentResponse.status}`)
      return null
    }

    const docData = await contentResponse.json()
    
    // Extract text content from Google Docs structure
    const content = extractTextFromDocStructure(docData.body?.content || [])

    return {
      id: documentId,
      title: metadata.name || 'Untitled Document',
      content,
      url: metadata.webViewLink || `https://docs.google.com/document/d/${documentId}`,
    }
  } catch (error) {
    console.error('Error fetching Google Doc:', error)
    return null
  }
}

/**
 * Extract plain text from Google Docs API structure
 */
function extractTextFromDocStructure(content: GoogleDocsContent[]): string {
  let text = ''
  
  for (const element of content) {
    if (element.paragraph) {
      const paragraph = element.paragraph
      if (paragraph.elements) {
        for (const elem of paragraph.elements) {
          if (elem.textRun && elem.textRun.content) {
            text += elem.textRun.content
          }
        }
      }
      text += '\n'
    } else if (element.table) {
      // Handle tables (simplified)
      const table = element.table
      if (table.tableRows) {
        for (const row of table.tableRows) {
          if (row.tableCells) {
            for (const cell of row.tableCells) {
              if (cell.content) {
                text += extractTextFromDocStructure(cell.content) + '\t'
              }
            }
            text += '\n'
          }
        }
      }
    }
  }
  
  return text.trim()
}

/**
 * Check if user has required Google Drive permissions
 */
export async function checkDrivePermissions(accessToken: string): Promise<boolean> {
  try {
    const response = await fetch(
      'https://www.googleapis.com/drive/v3/about?fields=user',
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    )
    
    return response.ok
  } catch (error) {
    console.error('Error checking Drive permissions:', error)
    return false
  }
}
